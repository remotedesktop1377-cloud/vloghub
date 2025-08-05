"""
Main transcription service that combines YouTube caption and Whisper services.
"""
import logging
from typing import Optional, List, Dict, Any, Union

from .base import BaseTranscriptionService
from .models import (
    Transcript, TranscriptionJob, TranscriptionSource, TranscriptionStatus
)
from .youtube import YouTubeCaptionService
from .whisper import WhisperTranscriptionService
from .storage import TranscriptFileStorage
from .text_processing import TextProcessor

logger = logging.getLogger(__name__)


class TranscriptionService:
    """
    Main transcription service that combines YouTube caption and Whisper services.
    """
    
    def __init__(
        self,
        youtube_service: Optional[YouTubeCaptionService] = None,
        whisper_service: Optional[WhisperTranscriptionService] = None,
        storage: Optional[TranscriptFileStorage] = None,
        text_processor: Optional[TextProcessor] = None
    ):
        """
        Initialize the transcription service.
        
        Args:
            youtube_service: YouTube caption service.
            whisper_service: Whisper transcription service.
            storage: Transcript storage.
            text_processor: Text processing utilities.
        """
        self.youtube_service = youtube_service
        self.whisper_service = whisper_service
        self.storage = storage or TranscriptFileStorage()
        self.text_processor = text_processor or TextProcessor()
        
        # Dictionary to track jobs by ID
        self._jobs: Dict[str, Dict[str, Any]] = {}
    
    async def transcribe_video(
        self,
        video_id: str,
        source: Union[str, TranscriptionSource] = TranscriptionSource.YOUTUBE,
        language: Optional[str] = None,
        force_new: bool = False,
        **kwargs
    ) -> TranscriptionJob:
        """
        Transcribe a video.
        
        Args:
            video_id: YouTube video ID.
            source: Transcription source (youtube or whisper).
            language: Language code.
            force_new: Whether to force a new transcription even if one exists.
            **kwargs: Additional parameters for the transcription service.
            
        Returns:
            A transcription job object.
        """
        # Check if transcript already exists
        if not force_new:
            transcript = self.storage.load_transcript(video_id)
            if transcript:
                logger.info(f"Transcript already exists for video {video_id}, returning completed job")
                return TranscriptionJob(
                    job_id=f"existing_{video_id}",
                    video_id=video_id,
                    status=TranscriptionStatus.COMPLETED,
                    source=transcript.source,
                    language=transcript.language,
                    progress=1.0
                )
        
        # Convert string source to enum if needed
        if isinstance(source, str):
            try:
                source = TranscriptionSource(source.lower())
            except ValueError:
                logger.warning(f"Invalid source: {source}, using YouTube as default")
                source = TranscriptionSource.YOUTUBE
        
        # Select the appropriate service
        service = self._get_service_for_source(source)
        if not service:
            raise ValueError(f"No service available for source: {source}")
        
        # Start transcription
        job = await service.transcribe_video(
            video_id=video_id,
            language=language,
            **kwargs
        )
        
        # Store job information
        self._jobs[job.job_id] = {
            "job": job,
            "service": service
        }
        
        # If job is already completed, save the transcript
        if job.status == TranscriptionStatus.COMPLETED:
            transcript = await service.get_transcript(video_id)
            if transcript:
                self.storage.save_transcript(transcript)
        
        return job
    
    async def get_transcription_status(self, job_id: str) -> TranscriptionJob:
        """
        Get the status of a transcription job.
        
        Args:
            job_id: ID of the transcription job.
            
        Returns:
            The transcription job object.
        """
        job_info = self._jobs.get(job_id)
        if not job_info:
            raise ValueError(f"Job with ID {job_id} not found")
        
        service = job_info["service"]
        job = await service.get_transcription_status(job_id)
        
        # If job is completed, save the transcript
        if job.status == TranscriptionStatus.COMPLETED:
            transcript = await service.get_transcript(job.video_id)
            if transcript:
                self.storage.save_transcript(transcript)
        
        return job
    
    async def get_transcript(self, video_id: str) -> Optional[Transcript]:
        """
        Get the transcript for a video.
        
        Args:
            video_id: YouTube video ID.
            
        Returns:
            The transcript object if available.
        """
        # First, try to load from storage
        transcript = self.storage.load_transcript(video_id)
        if transcript:
            return transcript
        
        # If not in storage, try to get from services
        for service in self._get_all_services():
            if not service:
                continue
            
            transcript = await service.get_transcript(video_id)
            if transcript:
                # Save to storage for future use
                self.storage.save_transcript(transcript)
                return transcript
        
        return None
    
    async def cancel_transcription(self, job_id: str) -> bool:
        """
        Cancel a transcription job.
        
        Args:
            job_id: ID of the transcription job.
            
        Returns:
            True if the job was cancelled.
        """
        job_info = self._jobs.get(job_id)
        if not job_info:
            return False
        
        service = job_info["service"]
        return await service.cancel_transcription(job_id)
    
    async def delete_transcript(self, video_id: str) -> bool:
        """
        Delete a transcript.
        
        Args:
            video_id: YouTube video ID.
            
        Returns:
            True if the transcript was deleted.
        """
        # Delete from storage
        storage_deleted = self.storage.delete_transcript(video_id)
        
        # Delete from services
        service_deleted = False
        for service in self._get_all_services():
            if not service:
                continue
            
            if await service.delete_transcript(video_id):
                service_deleted = True
        
        return storage_deleted or service_deleted
    
    async def search_transcript(
        self,
        video_id: str,
        query: str,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Search for text within a transcript.
        
        Args:
            video_id: YouTube video ID.
            query: Search query.
            **kwargs: Additional parameters.
            
        Returns:
            List of matching segments.
        """
        # Get the transcript
        transcript = await self.get_transcript(video_id)
        if not transcript:
            return []
        
        # Use the service that created the transcript
        service = self._get_service_for_source(transcript.source)
        if not service:
            return []
        
        return await service.search_transcript(video_id, query, **kwargs)
    
    def list_available_transcripts(self) -> List[str]:
        """
        List all available transcript video IDs.
        
        Returns:
            List of video IDs with available transcripts.
        """
        return self.storage.list_transcripts()
    
    def _get_service_for_source(self, source: TranscriptionSource) -> Optional[BaseTranscriptionService]:
        """
        Get the appropriate service for a source.
        
        Args:
            source: Transcription source.
            
        Returns:
            The corresponding transcription service.
        """
        if source == TranscriptionSource.YOUTUBE:
            if not self.youtube_service:
                self.youtube_service = YouTubeCaptionService()
            return self.youtube_service
        
        elif source == TranscriptionSource.WHISPER:
            if not self.whisper_service:
                try:
                    self.whisper_service = WhisperTranscriptionService()
                except ValueError as e:
                    logger.error(f"Could not initialize Whisper service: {e}")
                    return None
            return self.whisper_service
        
        return None
    
    def _get_all_services(self) -> List[Optional[BaseTranscriptionService]]:
        """
        Get all available transcription services.
        
        Returns:
            List of transcription services.
        """
        services = []
        
        # Try to get YouTube service
        youtube_service = self._get_service_for_source(TranscriptionSource.YOUTUBE)
        if youtube_service:
            services.append(youtube_service)
        
        # Try to get Whisper service
        whisper_service = self._get_service_for_source(TranscriptionSource.WHISPER)
        if whisper_service:
            services.append(whisper_service)
        
        return services 