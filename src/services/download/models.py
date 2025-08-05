"""
Data models for download service.
"""
from enum import Enum
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class DownloadStatus(str, Enum):
    """Download job status."""
    PENDING = "pending"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VideoFormat(str, Enum):
    """Video format options."""
    MP4 = "mp4"
    WEBM = "webm"
    MKV = "mkv"


class VideoQuality(str, Enum):
    """Video quality options."""
    BEST = "best"
    WORST = "worst"
    Q720P = "720p"
    Q480P = "480p"
    Q360P = "360p"
    Q240P = "240p"


class StorageProvider(str, Enum):
    """Storage provider options."""
    LOCAL = "local"
    AWS_S3 = "aws_s3"
    GOOGLE_DRIVE = "google_drive"


class ClipRequest(BaseModel):
    """Request for creating a video clip."""
    clip_id: str
    start_time: float = Field(ge=0)
    end_time: float = Field(gt=0)
    title: Optional[str] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DownloadRequest(BaseModel):
    """Request for downloading video or clips."""
    video_id: str
    clips: List[ClipRequest] = Field(default_factory=list)
    format: VideoFormat = VideoFormat.MP4
    quality: VideoQuality = VideoQuality.Q720P
    include_subtitles: bool = True
    subtitle_languages: List[str] = Field(default_factory=lambda: ["en"])
    storage_provider: StorageProvider = StorageProvider.LOCAL
    storage_path: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DownloadProgress(BaseModel):
    """Download progress information."""
    downloaded_bytes: int = 0
    total_bytes: Optional[int] = None
    percentage: float = Field(ge=0, le=100, default=0)
    speed: Optional[float] = None  # bytes per second
    eta: Optional[float] = None    # estimated time remaining in seconds


class DownloadJob(BaseModel):
    """Download job information."""
    job_id: str
    video_id: str
    request: DownloadRequest
    status: DownloadStatus = DownloadStatus.PENDING
    progress: DownloadProgress = Field(default_factory=DownloadProgress)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    output_files: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DownloadResult(BaseModel):
    """Download operation result."""
    job_id: str
    status: DownloadStatus
    output_files: List[str]
    download_path: str
    total_size: int = 0
    duration: float = 0  # Processing duration in seconds
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class StorageConfig(BaseModel):
    """Storage configuration."""
    provider: StorageProvider
    base_path: str = "downloads"
    aws_config: Optional[Dict[str, str]] = None
    google_drive_config: Optional[Dict[str, str]] = None
    naming_pattern: str = "{video_id}_{timestamp}"
    create_folders: bool = True
    max_file_size: Optional[int] = None  # bytes


class QueueStatus(BaseModel):
    """Download queue status."""
    total_jobs: int = 0
    pending_jobs: int = 0
    active_jobs: int = 0
    completed_jobs: int = 0
    failed_jobs: int = 0
    queue_size_limit: int = 100
    estimated_wait_time: Optional[float] = None  # seconds 