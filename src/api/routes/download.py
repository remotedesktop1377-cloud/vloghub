"""
Download API routes for video and clip downloading.
"""
import logging
from typing import List
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from fastapi.responses import FileResponse
import tempfile
import zipfile
import os

from src.services.download.models import (
    DownloadRequest, DownloadJob, DownloadResult, QueueStatus,
    ClipRequest, VideoFormat, VideoQuality, StorageProvider
)
from src.services.download.video_downloader import YouTubeVideoDownloader
from src.services.download.download_manager import DownloadManager

router = APIRouter(prefix="/api/download", tags=["download"])
logger = logging.getLogger(__name__)

# Initialize download manager
download_manager = DownloadManager()


@router.post("/video", response_model=DownloadJob)
async def download_video(
    request: DownloadRequest,
    background_tasks: BackgroundTasks
):
    """
    Start downloading a YouTube video.
    
    Args:
        request: Download request parameters.
        background_tasks: FastAPI background tasks.
        
    Returns:
        Download job information.
    """
    try:
        job = await download_manager.start_download(request)
        return job
        
    except Exception as e:
        logger.error(f"Error starting download: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.post("/clips", response_model=DownloadJob)
async def download_clips(
    video_id: str,
    clips: List[ClipRequest],
    format: VideoFormat = VideoFormat.MP4,
    quality: VideoQuality = VideoQuality.Q720P,
    include_subtitles: bool = True
):
    """
    Download specific clips from a video.
    
    Args:
        video_id: YouTube video ID.
        clips: List of clip requests.
        format: Video format.
        quality: Video quality.
        include_subtitles: Whether to include subtitles.
        
    Returns:
        Download job information.
    """
    try:
        request = DownloadRequest(
            video_id=video_id,
            clips=clips,
            format=format,
            quality=quality,
            include_subtitles=include_subtitles
        )
        
        job = await download_manager.start_download(request)
        return job
        
    except Exception as e:
        logger.error(f"Error starting clip download: {e}")
        raise HTTPException(status_code=500, detail=f"Clip download failed: {str(e)}")


@router.get("/job/{job_id}", response_model=DownloadJob)
async def get_download_job(job_id: str):
    """
    Get download job status.
    
    Args:
        job_id: Download job ID.
        
    Returns:
        Download job information.
    """
    job = await download_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.get("/jobs", response_model=List[DownloadJob])
async def list_download_jobs(
    status: str = None,
    limit: int = 50
):
    """
    List download jobs.
    
    Args:
        status: Filter by job status.
        limit: Maximum number of jobs to return.
        
    Returns:
        List of download jobs.
    """
    jobs = await download_manager.list_jobs(status=status, limit=limit)
    return jobs


@router.delete("/job/{job_id}")
async def cancel_download_job(job_id: str):
    """
    Cancel a download job.
    
    Args:
        job_id: Download job ID.
        
    Returns:
        Success message.
    """
    success = await download_manager.cancel_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or cannot be cancelled")
    
    return {"message": "Job cancelled successfully"}


@router.get("/job/{job_id}/download")
async def download_job_files(job_id: str):
    """
    Download files from a completed job.
    
    Args:
        job_id: Download job ID.
        
    Returns:
        File download response.
    """
    job = await download_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    if not job.output_files:
        raise HTTPException(status_code=404, detail="No files available")
    
    # If single file, return it directly
    if len(job.output_files) == 1:
        file_path = job.output_files[0]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            file_path,
            media_type='application/octet-stream',
            filename=os.path.basename(file_path)
        )
    
    # Multiple files - create a zip
    with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
        with zipfile.ZipFile(tmp_file.name, 'w') as zip_file:
            for file_path in job.output_files:
                if os.path.exists(file_path):
                    zip_file.write(file_path, os.path.basename(file_path))
        
        return FileResponse(
            tmp_file.name,
            media_type='application/zip',
            filename=f"{job.video_id}_clips.zip"
        )


@router.get("/queue/status", response_model=QueueStatus)
async def get_queue_status():
    """
    Get download queue status.
    
    Returns:
        Queue status information.
    """
    status = await download_manager.get_queue_status()
    return status


@router.post("/queue/clear")
async def clear_download_queue():
    """
    Clear all completed and failed jobs from the queue.
    
    Returns:
        Success message.
    """
    cleared_count = await download_manager.clear_completed_jobs()
    return {"message": f"Cleared {cleared_count} completed jobs"}


@router.get("/video/{video_id}/info")
async def get_video_info(video_id: str):
    """
    Get video information without downloading.
    
    Args:
        video_id: YouTube video ID.
        
    Returns:
        Video information.
    """
    try:
        downloader = YouTubeVideoDownloader()
        info = await downloader.get_video_info(video_id)
        return info
        
    except Exception as e:
        logger.error(f"Error getting video info for {video_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get video info: {str(e)}")


@router.post("/test")
async def test_download_capability():
    """
    Test download capability without actually downloading.
    
    Returns:
        Test result.
    """
    try:
        # Test with a short, public domain video
        test_video_id = "dQw4w9WgXcQ"  # Rick Roll - short and widely available
        
        downloader = YouTubeVideoDownloader()
        info = await downloader.get_video_info(test_video_id)
        
        return {
            "status": "success",
            "message": "Download capability working",
            "test_video": {
                "id": test_video_id,
                "title": info.get("title"),
                "duration": info.get("duration"),
                "available_formats": len(info.get("formats", []))
            }
        }
        
    except Exception as e:
        logger.error(f"Download capability test failed: {e}")
        return {
            "status": "error", 
            "message": f"Download capability test failed: {str(e)}"
        } 