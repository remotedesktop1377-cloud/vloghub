"""
Base class for transcription services.
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, Union

from .models import Transcript, TranscriptionJob, TranscriptionSource


class BaseTranscriptionService(ABC):
    """
    Base class for transcription services.
    """
    
    @abstractmethod
    async def transcribe_video(
        self,
        video_id: str,
        language: Optional[str] = None,
        **kwargs
    ) -> TranscriptionJob:
        """
        Start transcribing a video.
        
        Args:
            video_id: ID of the video to transcribe.
            language: Language code for transcription (optional).
            **kwargs: Additional parameters for the transcription service.
            
        Returns:
            A transcription job object.
        """
        pass
    
    @abstractmethod
    async def get_transcription_status(self, job_id: str) -> TranscriptionJob:
        """
        Get the status of a transcription job.
        
        Args:
            job_id: ID of the transcription job.
            
        Returns:
            The transcription job object with updated status.
        """
        pass
    
    @abstractmethod
    async def get_transcript(self, video_id: str) -> Optional[Transcript]:
        """
        Get the transcript for a video.
        
        Args:
            video_id: ID of the video.
            
        Returns:
            The transcript object if available, None otherwise.
        """
        pass
    
    @abstractmethod
    async def cancel_transcription(self, job_id: str) -> bool:
        """
        Cancel a transcription job.
        
        Args:
            job_id: ID of the transcription job.
            
        Returns:
            True if the job was cancelled, False otherwise.
        """
        pass
    
    @abstractmethod
    async def delete_transcript(self, video_id: str) -> bool:
        """
        Delete a transcript.
        
        Args:
            video_id: ID of the video.
            
        Returns:
            True if the transcript was deleted, False otherwise.
        """
        pass
    
    @abstractmethod
    async def search_transcript(
        self,
        video_id: str,
        query: str,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Search for text within a transcript.
        
        Args:
            video_id: ID of the video.
            query: Search query.
            **kwargs: Additional parameters for the search.
            
        Returns:
            List of matching segments with timing information.
        """
        pass
    
    @property
    @abstractmethod
    def source_type(self) -> TranscriptionSource:
        """
        Get the source type of this transcription service.
        
        Returns:
            The transcription source type.
        """
        pass 