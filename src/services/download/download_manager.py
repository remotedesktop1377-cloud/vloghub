"""
Download manager for handling YouTube video and clip downloads with queue system.
"""
import logging
import asyncio
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
import os

from .models import (
    DownloadRequest, DownloadJob, DownloadStatus, DownloadResult, 
    QueueStatus, DownloadProgress
)
from .video_downloader import YouTubeVideoDownloader
from .clip_processor import ClipProcessor
from .storage_manager import StorageManager

logger = logging.getLogger(__name__)


class DownloadManager:
    """Manager for download operations with queue system."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize download manager.
        
        Args:
            config: Configuration parameters.
        """
        self.config = config or {}
        self.max_concurrent_downloads = self.config.get("max_concurrent_downloads", 3)
        self.queue_size_limit = self.config.get("queue_size_limit", 100)
        
        # Job storage
        self._jobs: Dict[str, DownloadJob] = {}
        self._active_jobs: Dict[str, asyncio.Task] = {}
        self._job_queue: asyncio.Queue = asyncio.Queue(maxsize=self.queue_size_limit)
        
        # Initialize services
        self.video_downloader = YouTubeVideoDownloader(self.config.get("downloader", {}))
        self.clip_processor = ClipProcessor(self.config.get("clip_processor", {}))
        self.storage_manager = StorageManager(self.config.get("storage", {}))
        
        # Start background worker
        self._worker_task = None
        self._running = False
    
    async def start(self):
        """Start the download manager."""
        if not self._running:
            self._running = True
            self._worker_task = asyncio.create_task(self._download_worker())
            logger.info("Download manager started")
    
    async def stop(self):
        """Stop the download manager."""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        
        # Cancel active jobs
        for task in self._active_jobs.values():
            task.cancel()
        
        logger.info("Download manager stopped")
    
    async def start_download(self, request: DownloadRequest) -> DownloadJob:
        """
        Start a download job.
        
        Args:
            request: Download request.
            
        Returns:
            Download job.
        """
        job_id = str(uuid.uuid4())
        
        job = DownloadJob(
            job_id=job_id,
            video_id=request.video_id,
            request=request,
            status=DownloadStatus.PENDING,
            created_at=datetime.utcnow()
        )
        
        self._jobs[job_id] = job
        
        # Add to queue
        try:
            await self._job_queue.put(job)
            logger.info(f"Added download job {job_id} to queue")
        except asyncio.QueueFull:
            job.status = DownloadStatus.FAILED
            job.error_message = "Download queue is full"
            logger.error(f"Queue full, rejecting job {job_id}")
        
        # Start manager if not running
        if not self._running:
            await self.start()
        
        return job
    
    async def get_job(self, job_id: str) -> Optional[DownloadJob]:
        """Get download job by ID."""
        return self._jobs.get(job_id)
    
    async def list_jobs(self, status: Optional[str] = None, limit: int = 50) -> List[DownloadJob]:
        """
        List download jobs.
        
        Args:
            status: Filter by status.
            limit: Maximum number of jobs.
            
        Returns:
            List of jobs.
        """
        jobs = list(self._jobs.values())
        
        if status:
            jobs = [job for job in jobs if job.status == status]
        
        # Sort by creation time (newest first)
        jobs.sort(key=lambda x: x.created_at, reverse=True)
        
        return jobs[:limit]
    
    async def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a download job.
        
        Args:
            job_id: Job ID to cancel.
            
        Returns:
            True if cancelled successfully.
        """
        job = self._jobs.get(job_id)
        if not job:
            return False
        
        if job.status in [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED]:
            return False  # Cannot cancel completed jobs
        
        # Cancel active task if running
        if job_id in self._active_jobs:
            self._active_jobs[job_id].cancel()
            del self._active_jobs[job_id]
        
        job.status = DownloadStatus.CANCELLED
        job.completed_at = datetime.utcnow()
        
        logger.info(f"Cancelled download job {job_id}")
        return True
    
    async def get_queue_status(self) -> QueueStatus:
        """Get download queue status."""
        total_jobs = len(self._jobs)
        pending_jobs = len([j for j in self._jobs.values() if j.status == DownloadStatus.PENDING])
        active_jobs = len(self._active_jobs)
        completed_jobs = len([j for j in self._jobs.values() if j.status == DownloadStatus.COMPLETED])
        failed_jobs = len([j for j in self._jobs.values() if j.status == DownloadStatus.FAILED])
        
        # Estimate wait time
        estimated_wait_time = None
        if pending_jobs > 0 and active_jobs > 0:
            # Simple estimation: pending jobs / active jobs * average job time
            estimated_wait_time = (pending_jobs / max(active_jobs, 1)) * 300  # Assume 5 min average
        
        return QueueStatus(
            total_jobs=total_jobs,
            pending_jobs=pending_jobs,
            active_jobs=active_jobs,
            completed_jobs=completed_jobs,
            failed_jobs=failed_jobs,
            queue_size_limit=self.queue_size_limit,
            estimated_wait_time=estimated_wait_time
        )
    
    async def clear_completed_jobs(self) -> int:
        """Clear completed and failed jobs."""
        to_remove = []
        for job_id, job in self._jobs.items():
            if job.status in [DownloadStatus.COMPLETED, DownloadStatus.FAILED, DownloadStatus.CANCELLED]:
                to_remove.append(job_id)
        
        for job_id in to_remove:
            del self._jobs[job_id]
        
        logger.info(f"Cleared {len(to_remove)} completed jobs")
        return len(to_remove)
    
    async def _download_worker(self):
        """Background worker for processing download queue."""
        logger.info("Download worker started")
        
        while self._running:
            try:
                # Check if we can start new downloads
                if len(self._active_jobs) >= self.max_concurrent_downloads:
                    await asyncio.sleep(1)
                    continue
                
                # Get next job from queue
                try:
                    job = await asyncio.wait_for(self._job_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                
                # Start download task
                task = asyncio.create_task(self._process_download_job(job))
                self._active_jobs[job.job_id] = task
                
                logger.info(f"Started processing job {job.job_id}")
                
            except Exception as e:
                logger.error(f"Error in download worker: {e}")
                await asyncio.sleep(1)
        
        logger.info("Download worker stopped")
    
    async def _process_download_job(self, job: DownloadJob):
        """Process a single download job."""
        try:
            job.status = DownloadStatus.DOWNLOADING
            job.started_at = datetime.utcnow()
            
            # Progress callback
            def progress_callback(progress: DownloadProgress):
                job.progress = progress
            
            # Download video
            download_result = await self.video_downloader.download_video(
                job.video_id,
                job.request,
                progress_callback=progress_callback
            )
            
            job.status = DownloadStatus.PROCESSING
            
            # Process clips if requested
            if job.request.clips:
                clip_results = await self.clip_processor.process_clips(
                    download_result["downloaded_files"][0],
                    job.request.clips,
                    job.request.format
                )
                job.output_files = clip_results
            else:
                job.output_files = download_result["downloaded_files"]
            
            # Store files if needed
            if job.request.storage_provider != "local":
                stored_files = await self.storage_manager.store_files(
                    job.output_files,
                    job.request.storage_provider,
                    job.request.storage_path
                )
                job.output_files = stored_files
            
            job.status = DownloadStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            job.metadata = download_result.get("metadata", {})
            
            logger.info(f"Download job {job.job_id} completed successfully")
            
        except asyncio.CancelledError:
            job.status = DownloadStatus.CANCELLED
            job.completed_at = datetime.utcnow()
            logger.info(f"Download job {job.job_id} was cancelled")
            
        except Exception as e:
            job.status = DownloadStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            logger.error(f"Download job {job.job_id} failed: {e}")
            
        finally:
            # Remove from active jobs
            if job.job_id in self._active_jobs:
                del self._active_jobs[job.job_id] 