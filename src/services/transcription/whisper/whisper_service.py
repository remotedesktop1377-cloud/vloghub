"""
Service for transcribing audio using OpenAI's Whisper API.
"""
import os
import uuid
import logging
import tempfile
import asyncio
from typing import Optional, List, Dict, Any, BinaryIO
from datetime import datetime

import openai
from openai import AsyncOpenAI
import httpx
import yt_dlp

from src.services.transcription.base import BaseTranscriptionService
from src.services.transcription.models import (
    Transcript, TranscriptSegment, TranscriptionJob, 
    TranscriptionSource, TranscriptionStatus
)

logger = logging.getLogger(__name__)


class WhisperTranscriptionService(BaseTranscriptionService):
    """
    Service for transcribing audio using OpenAI's Whisper API.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Whisper transcription service.
        
        Args:
            api_key: OpenAI API key. If None, will use OPENAI_API_KEY environment variable.
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not provided or found in environment variables")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self._jobs: Dict[str, TranscriptionJob] = {}
        self._transcripts: Dict[str, Transcript] = {}
        self._active_tasks: Dict[str, asyncio.Task] = {}
    
    @property
    def source_type(self) -> TranscriptionSource:
        """
        Get the source type of this transcription service.
        
        Returns:
            The transcription source type.
        """
        return TranscriptionSource.WHISPER
    
    async def transcribe_video(
        self,
        video_id: str,
        language: Optional[str] = None,
        **kwargs
    ) -> TranscriptionJob:
        """
        Start transcribing a YouTube video using Whisper.
        
        Args:
            video_id: YouTube video ID.
            language: Language code for transcription.
            **kwargs: Additional parameters:
                - model: Whisper model to use (default: "whisper-1")
                - temperature: Sampling temperature (default: 0)
                - prompt: Initial prompt for the model
                - response_format: Response format (default: "verbose_json")
                - max_duration: Maximum duration in seconds to transcribe (default: 600)
            
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
            language=language,
            metadata={
                "model": kwargs.get("model", "whisper-1"),
                "temperature": kwargs.get("temperature", 0),
                "response_format": kwargs.get("response_format", "verbose_json"),
                "max_duration": kwargs.get("max_duration", 600)
            }
        )
        
        self._jobs[job_id] = job
        
        # Start the transcription task asynchronously
        task = asyncio.create_task(self._process_transcription(job, **kwargs))
        self._active_tasks[job_id] = task
        
        return job
    
    async def _process_transcription(self, job: TranscriptionJob, **kwargs) -> None:
        """
        Process the transcription job.
        
        Args:
            job: Transcription job to process.
            **kwargs: Additional parameters.
        """
        try:
            job.status = TranscriptionStatus.IN_PROGRESS
            job.updated_at = datetime.utcnow()
            
            # Download the audio from YouTube
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_path = temp_file.name
            
            try:
                await self._download_audio(job.video_id, temp_path, max_duration=job.metadata.get("max_duration", 600))
                job.progress = 0.3
                job.updated_at = datetime.utcnow()
                
                # Transcribe the audio
                with open(temp_path, "rb") as audio_file:
                    transcript_data = await self._transcribe_audio(
                        audio_file,
                        language=job.language,
                        model=job.metadata.get("model", "whisper-1"),
                        temperature=job.metadata.get("temperature", 0),
                        prompt=kwargs.get("prompt"),
                        response_format=job.metadata.get("response_format", "verbose_json")
                    )
                
                job.progress = 0.7
                job.updated_at = datetime.utcnow()
                
                # Parse the transcript data
                segments = self._parse_transcript_data(transcript_data)
                detected_language = transcript_data.get("language") or job.language or "unknown"
                
                # Create transcript
                transcript = Transcript(
                    video_id=job.video_id,
                    language=detected_language,
                    segments=segments,
                    source=self.source_type,
                    metadata={
                        "model": job.metadata.get("model"),
                        "duration": transcript_data.get("duration")
                    }
                )
                
                # Store the transcript
                self._transcripts[job.video_id] = transcript
                
                # Update job status
                job.status = TranscriptionStatus.COMPLETED
                job.language = detected_language
                job.progress = 1.0
                job.updated_at = datetime.utcnow()
            
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
        
        except asyncio.CancelledError:
            job.status = TranscriptionStatus.FAILED
            job.error = "Job cancelled"
            job.updated_at = datetime.utcnow()
        
        except Exception as e:
            logger.error(f"Error transcribing video {job.video_id}: {e}")
            job.status = TranscriptionStatus.FAILED
            job.error = str(e)
            job.updated_at = datetime.utcnow()
        
        finally:
            # Remove the task from active tasks
            if job.job_id in self._active_tasks:
                del self._active_tasks[job.job_id]
    
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
        
        # Cancel the task if it's running
        task = self._active_tasks.get(job_id)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
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
    
    async def _download_audio(
        self,
        video_id: str,
        output_path: str,
        max_duration: int = 600
    ) -> None:
        """
        Download audio from a YouTube video.
        
        Args:
            video_id: YouTube video ID.
            output_path: Path to save the audio file.
            max_duration: Maximum duration in seconds to download.
        """
        url = f"https://www.youtube.com/watch?v={video_id}"
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '128',
            }],
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'max_filesize': 25 * 1024 * 1024,  # 25 MB limit for Whisper API
        }
        
        # If max_duration is specified, add it to the options
        if max_duration:
            ydl_opts['download_ranges'] = lambda info_dict, _: [{
                'start_time': 0,
                'end_time': min(info_dict.get('duration', max_duration), max_duration)
            }]
        
        # Run yt-dlp in a separate thread to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: self._run_yt_dlp(url, ydl_opts))
    
    def _run_yt_dlp(self, url: str, options: Dict[str, Any]) -> None:
        """
        Run yt-dlp to download a video.
        
        Args:
            url: YouTube video URL.
            options: yt-dlp options.
        """
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])
    
    async def _transcribe_audio(
        self,
        audio_file: BinaryIO,
        language: Optional[str] = None,
        model: str = "whisper-1",
        temperature: float = 0,
        prompt: Optional[str] = None,
        response_format: str = "verbose_json"
    ) -> Dict[str, Any]:
        """
        Transcribe audio using the Whisper API.
        
        Args:
            audio_file: Audio file object.
            language: Language code.
            model: Whisper model to use.
            temperature: Sampling temperature.
            prompt: Initial prompt for the model.
            response_format: Response format.
            
        Returns:
            Transcription data.
        """
        try:
            params = {
                "model": model,
                "temperature": temperature,
                "response_format": response_format
            }
            
            if language:
                params["language"] = language
            
            if prompt:
                params["prompt"] = prompt
            
            response = await self.client.audio.transcriptions.create(
                file=audio_file,
                **params
            )
            
            # Convert response to dict
            if hasattr(response, 'model_dump'):
                return response.model_dump()
            else:
                # Fallback for older OpenAI SDK versions
                return response.to_dict()
        
        except Exception as e:
            logger.error(f"Error transcribing audio with Whisper: {e}")
            raise
    
    def _parse_transcript_data(self, transcript_data: Dict[str, Any]) -> List[TranscriptSegment]:
        """
        Parse transcript data from Whisper API.
        
        Args:
            transcript_data: Transcript data from Whisper API.
            
        Returns:
            List of transcript segments.
        """
        segments = []
        
        # Check if we have segments in the response
        if "segments" in transcript_data:
            for segment_data in transcript_data["segments"]:
                segment = TranscriptSegment(
                    start_time=segment_data.get("start", 0),
                    end_time=segment_data.get("end", 0),
                    text=segment_data.get("text", "").strip(),
                    confidence=segment_data.get("confidence", 1.0)
                )
                segments.append(segment)
        else:
            # Fallback if no segments, create a single segment with the full text
            text = transcript_data.get("text", "").strip()
            if text:
                segment = TranscriptSegment(
                    start_time=0,
                    end_time=transcript_data.get("duration", 0),
                    text=text
                )
                segments.append(segment)
        
        return segments 