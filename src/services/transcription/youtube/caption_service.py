"""
Service for extracting captions from YouTube videos.
"""
import re
import uuid
import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime

from src.services.transcription.base import BaseTranscriptionService
from src.services.transcription.models import (
    Transcript, TranscriptSegment, TranscriptionJob, 
    TranscriptionSource, TranscriptionStatus
)
from src.services.youtube import YouTubeAPIClient

logger = logging.getLogger(__name__)


class YouTubeCaptionService(BaseTranscriptionService):
    """
    Service for extracting captions from YouTube videos.
    """
    
    def __init__(self, youtube_client: Optional[YouTubeAPIClient] = None):
        """
        Initialize the YouTube caption service.
        
        Args:
            youtube_client: YouTube API client.
        """
        self.youtube_client = youtube_client or YouTubeAPIClient()
        self._jobs: Dict[str, TranscriptionJob] = {}
        self._transcripts: Dict[str, Transcript] = {}
    
    @property
    def source_type(self) -> TranscriptionSource:
        """
        Get the source type of this transcription service.
        
        Returns:
            The transcription source type.
        """
        return TranscriptionSource.YOUTUBE
    
    async def transcribe_video(
        self,
        video_id: str,
        language: Optional[str] = None,
        **kwargs
    ) -> TranscriptionJob:
        """
        Extract captions from a YouTube video.
        
        Args:
            video_id: YouTube video ID.
            language: Preferred language code (e.g., 'en').
            **kwargs: Additional parameters.
            
        Returns:
            A transcription job object.
        """
        job_id = str(uuid.uuid4())
        
        # Create a new job
        job = TranscriptionJob(
            job_id=job_id,
            video_id=video_id,
            status=TranscriptionStatus.PENDING,
            source=self.source_type,
            language=language
        )
        
        self._jobs[job_id] = job
        
        # Start processing asynchronously
        job.status = TranscriptionStatus.IN_PROGRESS
        job.updated_at = datetime.utcnow()
        
        try:
            # Get available captions
            captions_list = await self._get_captions_list(video_id)
            
            if not captions_list:
                job.status = TranscriptionStatus.FAILED
                job.error = "No captions available for this video"
                job.updated_at = datetime.utcnow()
                return job
            
            # Select the best caption track
            caption_id, caption_language = self._select_caption_track(captions_list, language)
            
            if not caption_id:
                job.status = TranscriptionStatus.FAILED
                job.error = f"No captions available in the requested language: {language}"
                job.updated_at = datetime.utcnow()
                return job
            
            # Download and parse the caption
            caption_content = await self._download_caption(caption_id)
            segments = self._parse_caption(caption_content)
            
            # Create transcript
            transcript = Transcript(
                video_id=video_id,
                language=caption_language,
                segments=segments,
                source=self.source_type,
                metadata={"caption_id": caption_id}
            )
            
            # Store the transcript
            self._transcripts[video_id] = transcript
            
            # Update job status
            job.status = TranscriptionStatus.COMPLETED
            job.language = caption_language
            job.progress = 1.0
            job.updated_at = datetime.utcnow()
            
            return job
        
        except Exception as e:
            logger.error(f"Error extracting captions for video {video_id}: {e}")
            job.status = TranscriptionStatus.FAILED
            job.error = str(e)
            job.updated_at = datetime.utcnow()
            return job
    
    async def get_transcription_status(self, job_id: str) -> TranscriptionJob:
        """
        Get the status of a transcription job.
        
        Args:
            job_id: ID of the transcription job.
            
        Returns:
            The transcription job object.
        """
        job = self._jobs.get(job_id)
        if not job:
            raise ValueError(f"Job with ID {job_id} not found")
        return job
    
    async def get_transcript(self, video_id: str) -> Optional[Transcript]:
        """
        Get the transcript for a video.
        
        Args:
            video_id: YouTube video ID.
            
        Returns:
            The transcript object if available.
        """
        return self._transcripts.get(video_id)
    
    async def cancel_transcription(self, job_id: str) -> bool:
        """
        Cancel a transcription job.
        
        Args:
            job_id: ID of the transcription job.
            
        Returns:
            True if the job was cancelled.
        """
        job = self._jobs.get(job_id)
        if not job or job.status not in [TranscriptionStatus.PENDING, TranscriptionStatus.IN_PROGRESS]:
            return False
        
        job.status = TranscriptionStatus.FAILED
        job.error = "Job cancelled by user"
        job.updated_at = datetime.utcnow()
        return True
    
    async def delete_transcript(self, video_id: str) -> bool:
        """
        Delete a transcript.
        
        Args:
            video_id: YouTube video ID.
            
        Returns:
            True if the transcript was deleted.
        """
        if video_id in self._transcripts:
            del self._transcripts[video_id]
            return True
        return False
    
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
        transcript = self._transcripts.get(video_id)
        if not transcript:
            return []
        
        results = []
        query_lower = query.lower()
        
        for segment in transcript.segments:
            if query_lower in segment.text.lower():
                results.append({
                    "start_time": segment.start_time,
                    "end_time": segment.end_time,
                    "text": segment.text,
                    "video_id": video_id
                })
        
        return results
    
    async def _get_captions_list(self, video_id: str) -> List[Dict[str, Any]]:
        """
        Get the list of available captions for a video.
        
        Args:
            video_id: YouTube video ID.
            
        Returns:
            List of available caption tracks.
        """
        try:
            captions_response = self.youtube_client.get_captions(video_id=video_id)
            return captions_response.get("items", [])
        except Exception as e:
            logger.error(f"Error getting captions list for video {video_id}: {e}")
            return []
    
    def _select_caption_track(
        self,
        captions_list: List[Dict[str, Any]],
        preferred_language: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Select the best caption track based on language preference.
        
        Args:
            captions_list: List of available caption tracks.
            preferred_language: Preferred language code.
            
        Returns:
            Tuple of (caption_id, language_code) or (None, None) if no suitable track found.
        """
        if not captions_list:
            return None, None
        
        # First, try to find an exact match for the preferred language
        if preferred_language:
            for caption in captions_list:
                language = caption.get("snippet", {}).get("language", "")
                if language.lower() == preferred_language.lower():
                    return caption["id"], language
        
        # If no exact match, try to find a partial match
        if preferred_language:
            for caption in captions_list:
                language = caption.get("snippet", {}).get("language", "")
                if language.lower().startswith(preferred_language.lower()):
                    return caption["id"], language
        
        # If no match or no preference, use the first available track
        caption = captions_list[0]
        return caption["id"], caption.get("snippet", {}).get("language", "unknown")
    
    async def _download_caption(self, caption_id: str) -> str:
        """
        Download the caption content.
        
        Args:
            caption_id: Caption track ID.
            
        Returns:
            Caption content as text.
        """
        try:
            return self.youtube_client.download_caption(caption_id=caption_id, format="srt")
        except Exception as e:
            logger.error(f"Error downloading caption {caption_id}: {e}")
            raise
    
    def _parse_caption(self, caption_content: str) -> List[TranscriptSegment]:
        """
        Parse SRT caption content into transcript segments.
        
        Args:
            caption_content: SRT caption content.
            
        Returns:
            List of transcript segments.
        """
        segments = []
        
        # Split by double newline (each subtitle block)
        blocks = caption_content.strip().split("\n\n")
        
        for block in blocks:
            lines = block.split("\n")
            if len(lines) < 3:
                continue
            
            # Parse the timestamp line
            timestamp_line = lines[1]
            try:
                start_time, end_time = self._parse_srt_timestamp(timestamp_line)
            except ValueError:
                continue
            
            # Join the remaining lines as the text
            text = " ".join(lines[2:]).strip()
            
            # Create a segment
            segment = TranscriptSegment(
                start_time=start_time,
                end_time=end_time,
                text=text
            )
            
            segments.append(segment)
        
        return segments
    
    def _parse_srt_timestamp(self, timestamp_line: str) -> Tuple[float, float]:
        """
        Parse SRT timestamp line into start and end times in seconds.
        
        Args:
            timestamp_line: SRT timestamp line (e.g., "00:00:20,000 --> 00:00:25,000").
            
        Returns:
            Tuple of (start_time, end_time) in seconds.
        """
        pattern = r"(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})"
        match = re.match(pattern, timestamp_line)
        
        if not match:
            raise ValueError(f"Invalid timestamp format: {timestamp_line}")
        
        # Extract hours, minutes, seconds, milliseconds for start and end times
        start_h, start_m, start_s, start_ms, end_h, end_m, end_s, end_ms = map(int, match.groups())
        
        # Convert to seconds
        start_time = start_h * 3600 + start_m * 60 + start_s + start_ms / 1000
        end_time = end_h * 3600 + end_m * 60 + end_s + end_ms / 1000
        
        return start_time, end_time 