"""
Data models for clip detection service.
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

from src.ai.sentiment.models import SegmentSentiment
from src.ai.entity_recognition.models import SegmentEntities
from src.ai.segment_detection.models import ClipCandidate, TopicSegment


class ClipMetadata(BaseModel):
    """Metadata for a detected clip."""
    title: str
    description: str
    keywords: List[str] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list)
    sentiment: Optional[str] = None
    emotion: Optional[str] = None
    speaker: Optional[str] = None
    location: Optional[str] = None
    date_mentioned: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    relevance_factors: Dict[str, float] = Field(default_factory=dict)


class ClipRanking(BaseModel):
    """Ranking information for a clip."""
    overall_score: float = Field(ge=0.0, le=1.0)
    relevance_score: float = Field(ge=0.0, le=1.0)
    quality_score: float = Field(ge=0.0, le=1.0)
    sentiment_score: float = Field(ge=0.0, le=1.0)
    entity_score: float = Field(ge=0.0, le=1.0)
    coherence_score: float = Field(ge=0.0, le=1.0)
    uniqueness_score: float = Field(ge=0.0, le=1.0)
    ranking_factors: Dict[str, float] = Field(default_factory=dict)


class ClipAnalysisResult(BaseModel):
    """Complete analysis result for a video clip."""
    clip_id: str
    video_id: str
    start_time: float
    end_time: float
    duration: float
    
    # Analysis results
    metadata: ClipMetadata
    ranking: ClipRanking
    sentiment_analysis: Optional[SegmentSentiment] = None
    entity_analysis: Optional[SegmentEntities] = None
    topic_segments: List[TopicSegment] = Field(default_factory=list)
    
    # Raw candidate info
    candidate: ClipCandidate
    
    # Processing info
    analysis_confidence: float = Field(ge=0.0, le=1.0)
    processing_time: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    

class ClipDetectionRequest(BaseModel):
    """Request for clip detection."""
    video_id: str
    query: Optional[str] = None
    min_duration: float = Field(default=30.0, ge=5.0)
    max_duration: float = Field(default=120.0, le=600.0)
    max_clips: int = Field(default=10, ge=1, le=50)
    min_relevance: float = Field(default=0.6, ge=0.0, le=1.0)
    target_sentiment: Optional[str] = None
    required_entities: List[str] = Field(default_factory=list)
    required_keywords: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class ClipDetectionResponse(BaseModel):
    """Response from clip detection service."""
    video_id: str
    query: Optional[str] = None
    clips: List[ClipAnalysisResult]
    total_clips_found: int
    processing_time: float
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict) 