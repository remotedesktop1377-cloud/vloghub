"""
Data models for segment detection.
"""
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field


class SegmentType(str, Enum):
    """Types of segments that can be detected."""
    TOPIC = "topic"
    SPEAKER = "speaker"
    SCENE = "scene"
    PAUSE = "pause"
    HYBRID = "hybrid"


class BoundaryType(str, Enum):
    """Types of segment boundaries."""
    HARD = "hard"  # Clear, definitive boundary
    SOFT = "soft"  # Gradual transition
    UNCERTAIN = "uncertain"  # Low confidence boundary


class SegmentBoundary(BaseModel):
    """Represents a boundary between segments."""
    timestamp: float  # Time in seconds
    boundary_type: BoundaryType
    confidence: float = Field(ge=0.0, le=1.0)
    segment_type: SegmentType
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TopicSegment(BaseModel):
    """A segment based on topic coherence."""
    start_time: float
    end_time: float
    topic_summary: str
    keywords: List[str] = Field(default_factory=list)
    coherence_score: float = Field(ge=0.0, le=1.0)
    entities: List[str] = Field(default_factory=list)
    sentiment: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SpeakerSegment(BaseModel):
    """A segment based on speaker identity."""
    start_time: float
    end_time: float
    speaker_id: str
    speaker_name: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    audio_features: Optional[Dict[str, float]] = None
    text_features: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SceneSegment(BaseModel):
    """A segment based on scene/context changes."""
    start_time: float
    end_time: float
    scene_type: str
    location: Optional[str] = None
    setting: Optional[str] = None
    context_change_score: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SegmentationResult(BaseModel):
    """Complete segmentation result for a transcript."""
    video_id: str
    total_duration: float
    boundaries: List[SegmentBoundary]
    topic_segments: List[TopicSegment] = Field(default_factory=list)
    speaker_segments: List[SpeakerSegment] = Field(default_factory=list)
    scene_segments: List[SceneSegment] = Field(default_factory=list)
    overall_confidence: float = Field(ge=0.0, le=1.0)
    processing_time: Optional[float] = None
    algorithm_info: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ClipCandidate(BaseModel):
    """A candidate clip identified from segmentation."""
    clip_id: str
    start_time: float
    end_time: float
    duration: float
    title: Optional[str] = None
    description: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)
    quality_score: float = Field(ge=0.0, le=1.0)
    topic_segments: List[TopicSegment] = Field(default_factory=list)
    speaker_segments: List[SpeakerSegment] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list)
    sentiment: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict) 