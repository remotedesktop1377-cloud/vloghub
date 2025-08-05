"""
Data models for transcription services.
"""
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class TranscriptionSource(str, Enum):
    """Source of the transcription."""
    WHISPER = "whisper"
    YOUTUBE = "youtube"
    MANUAL = "manual"
    OTHER = "other"


class TranscriptionStatus(str, Enum):
    """Status of the transcription process."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Speaker(BaseModel):
    """Speaker information for diarization."""
    id: str
    name: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class TranscriptSegment(BaseModel):
    """A segment of the transcript with timing information."""
    start_time: float  # Start time in seconds
    end_time: float  # End time in seconds
    text: str
    speaker_id: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    words: Optional[List[Dict[str, Any]]] = None  # Word-level timing if available


class Transcript(BaseModel):
    """Complete transcript of a video."""
    video_id: str
    language: str
    segments: List[TranscriptSegment]
    source: TranscriptionSource
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    speakers: Optional[List[Speaker]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TranscriptionJob(BaseModel):
    """A job for transcribing a video."""
    job_id: str
    video_id: str
    status: TranscriptionStatus = TranscriptionStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    source: TranscriptionSource
    language: Optional[str] = None
    error: Optional[str] = None
    progress: float = Field(default=0.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class VideoClip(BaseModel):
    """A clip extracted from a video."""
    clip_id: str
    video_id: str
    start_time: float  # Start time in seconds
    end_time: float  # End time in seconds
    title: Optional[str] = None
    transcript_segments: List[TranscriptSegment]
    relevance_score: float = Field(default=0.0, ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict) 