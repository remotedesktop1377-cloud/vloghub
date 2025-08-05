"""
Metadata models for video clips and tagging system.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from decimal import Decimal

from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Float, Boolean, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

# Association table for many-to-many relationship between clips and tags
clip_tags = Table(
    'clip_tags',
    Base.metadata,
    Column('clip_id', UUID(as_uuid=True), ForeignKey('clip_metadata.id'), primary_key=True),
    Column('tag_id', UUID(as_uuid=True), ForeignKey('tags.id'), primary_key=True)
)


class TagType(str, Enum):
    """Types of tags."""
    PERSON = "person"
    LOCATION = "location"
    ORGANIZATION = "organization"
    EVENT = "event"
    TOPIC = "topic"
    SENTIMENT = "sentiment"
    SPEAKER = "speaker"
    LANGUAGE = "language"
    GENRE = "genre"
    CUSTOM = "custom"


class ConfidenceLevel(str, Enum):
    """Confidence levels for AI-generated tags."""
    HIGH = "high"        # > 0.8
    MEDIUM = "medium"    # 0.5 - 0.8
    LOW = "low"         # < 0.5
    MANUAL = "manual"    # User-created


class MetadataSource(str, Enum):
    """Source of metadata information."""
    AI_ANALYSIS = "ai_analysis"
    USER_INPUT = "user_input"
    YOUTUBE_API = "youtube_api"
    TRANSCRIPT = "transcript"
    EXTERNAL_API = "external_api"


# SQLAlchemy Models
class TagCategory(Base):
    """Tag category for organizing tags."""
    __tablename__ = 'tag_categories'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    color = Column(String(7))  # Hex color code
    icon = Column(String(50))
    parent_id = Column(UUID(as_uuid=True), ForeignKey('tag_categories.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    parent = relationship("TagCategory", remote_side=[id], backref="children")
    tags = relationship("Tag", back_populates="category")


class Tag(Base):
    """Tag model for labeling content."""
    __tablename__ = 'tags'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    tag_type = Column(String(50), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('tag_categories.id'))
    description = Column(Text)
    confidence = Column(Float, default=1.0)
    confidence_level = Column(String(20), default=ConfidenceLevel.MANUAL.value)
    source = Column(String(50), default=MetadataSource.USER_INPUT.value)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("TagCategory", back_populates="tags")
    clips = relationship("ClipMetadata", secondary=clip_tags, back_populates="tags")


class GeoLocation(Base):
    """Geographic location information."""
    __tablename__ = 'geo_locations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    country = Column(String(100))
    region = Column(String(100))
    city = Column(String(100))
    address = Column(Text)
    place_id = Column(String(200))  # Google Places ID
    confidence = Column(Float, default=1.0)
    source = Column(String(50), default=MetadataSource.USER_INPUT.value)
    created_at = Column(DateTime, default=datetime.utcnow)


class VideoMetadata(Base):
    """Metadata for YouTube videos."""
    __tablename__ = 'video_metadata'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(String(20), unique=True, nullable=False)  # YouTube video ID
    title = Column(String(500), nullable=False)
    description = Column(Text)
    channel_title = Column(String(200))
    channel_id = Column(String(50))
    published_at = Column(DateTime)
    duration = Column(Integer)  # Duration in seconds
    view_count = Column(Integer)
    like_count = Column(Integer)
    comment_count = Column(Integer)
    language = Column(String(10))
    default_audio_language = Column(String(10))
    thumbnail_url = Column(String(500))
    
    # AI Analysis Results
    overall_sentiment = Column(String(50))
    dominant_topics = Column(JSON)  # List of topics with scores
    detected_entities = Column(JSON)  # List of entities
    speaker_count = Column(Integer)
    content_quality_score = Column(Float)
    
    # Metadata
    processing_status = Column(String(50), default="pending")
    last_analyzed = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    clips = relationship("ClipMetadata", back_populates="video")


class ClipMetadata(Base):
    """Metadata for video clips."""
    __tablename__ = 'clip_metadata'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clip_id = Column(String(100), unique=True, nullable=False)
    video_id = Column(UUID(as_uuid=True), ForeignKey('video_metadata.id'), nullable=False)
    
    # Clip Information
    title = Column(String(300), nullable=False)
    description = Column(Text)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float)
    
    # Content Analysis
    transcript_text = Column(Text)
    sentiment_score = Column(Float)
    sentiment_label = Column(String(50))
    emotion_scores = Column(JSON)  # Dict of emotions with scores
    topic_labels = Column(JSON)  # List of topic labels
    named_entities = Column(JSON)  # List of named entities
    keywords = Column(JSON)  # List of keywords
    
    # Speaker Information
    speaker_id = Column(String(100))
    speaker_name = Column(String(200))
    speaker_confidence = Column(Float)
    speech_characteristics = Column(JSON)  # Voice analysis data
    
    # Location and Time
    geo_location_id = Column(UUID(as_uuid=True), ForeignKey('geo_locations.id'))
    event_date = Column(DateTime)  # Date of the event in the clip
    historical_context = Column(Text)
    
    # Quality Metrics
    relevance_score = Column(Float)
    content_quality = Column(Float)
    audio_quality = Column(Float)
    visual_quality = Column(Float)
    
    # User Annotations
    user_rating = Column(Integer)  # 1-5 star rating
    user_notes = Column(Text)
    is_favorite = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    # File Information
    file_path = Column(String(500))
    file_size = Column(Integer)
    file_format = Column(String(10))
    resolution = Column(String(20))
    
    # Metadata
    source = Column(String(50), default=MetadataSource.AI_ANALYSIS.value)
    confidence_level = Column(String(20), default=ConfidenceLevel.MEDIUM.value)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    video = relationship("VideoMetadata", back_populates="clips")
    geo_location = relationship("GeoLocation")
    tags = relationship("Tag", secondary=clip_tags, back_populates="clips")
    versions = relationship("MetadataVersion", back_populates="clip_metadata")


class MetadataVersion(Base):
    """Version history for metadata changes."""
    __tablename__ = 'metadata_versions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clip_metadata_id = Column(UUID(as_uuid=True), ForeignKey('clip_metadata.id'), nullable=False)
    version_number = Column(Integer, nullable=False)
    changes = Column(JSON)  # Dict of field changes
    changed_by = Column(String(200))  # User or system identifier
    change_reason = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    clip_metadata = relationship("ClipMetadata", back_populates="versions")


# Pydantic Models for API
class GeoLocationData(BaseModel):
    """Pydantic model for geographic location."""
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)


class SentimentData(BaseModel):
    """Pydantic model for sentiment analysis results."""
    label: str = Field(..., description="Overall sentiment label")
    score: float = Field(ge=-1.0, le=1.0, description="Sentiment score from -1 to 1")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in sentiment analysis")
    emotions: Dict[str, float] = Field(default_factory=dict, description="Emotion scores")


class EntityData(BaseModel):
    """Pydantic model for named entity data."""
    text: str = Field(..., description="Entity text")
    label: str = Field(..., description="Entity type/label")
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    additional_info: Dict[str, Any] = Field(default_factory=dict)


class TagCreate(BaseModel):
    """Pydantic model for creating tags."""
    name: str = Field(..., max_length=200)
    tag_type: TagType
    category_id: Optional[str] = None
    description: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    confidence_level: ConfidenceLevel = ConfidenceLevel.MANUAL
    source: MetadataSource = MetadataSource.USER_INPUT


class TagResponse(BaseModel):
    """Pydantic model for tag responses."""
    id: str
    name: str
    tag_type: TagType
    category_id: Optional[str] = None
    description: Optional[str] = None
    confidence: float
    confidence_level: ConfidenceLevel
    source: MetadataSource
    usage_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ClipMetadataCreate(BaseModel):
    """Pydantic model for creating clip metadata."""
    clip_id: str
    video_id: str
    title: str = Field(..., max_length=300)
    description: Optional[str] = None
    start_time: float = Field(ge=0.0)
    end_time: float = Field(gt=0.0)
    transcript_text: Optional[str] = None
    sentiment_data: Optional[SentimentData] = None
    topic_labels: List[str] = Field(default_factory=list)
    named_entities: List[EntityData] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    speaker_name: Optional[str] = None
    geo_location: Optional[GeoLocationData] = None
    event_date: Optional[datetime] = None
    tag_ids: List[str] = Field(default_factory=list)
    
    @validator('end_time')
    def end_time_must_be_greater_than_start_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be greater than start_time')
        return v


class ClipMetadataUpdate(BaseModel):
    """Pydantic model for updating clip metadata."""
    title: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    sentiment_data: Optional[SentimentData] = None
    topic_labels: Optional[List[str]] = None
    named_entities: Optional[List[EntityData]] = None
    keywords: Optional[List[str]] = None
    speaker_name: Optional[str] = None
    geo_location: Optional[GeoLocationData] = None
    event_date: Optional[datetime] = None
    user_rating: Optional[int] = Field(None, ge=1, le=5)
    user_notes: Optional[str] = None
    is_favorite: Optional[bool] = None
    tag_ids: Optional[List[str]] = None


class ClipMetadataResponse(BaseModel):
    """Pydantic model for clip metadata responses."""
    id: str
    clip_id: str
    video_id: str
    title: str
    description: Optional[str] = None
    start_time: float
    end_time: float
    duration: Optional[float] = None
    transcript_text: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    topic_labels: Optional[List[str]] = None
    named_entities: Optional[List[EntityData]] = None
    keywords: Optional[List[str]] = None
    speaker_name: Optional[str] = None
    geo_location: Optional[GeoLocationData] = None
    event_date: Optional[datetime] = None
    relevance_score: Optional[float] = None
    user_rating: Optional[int] = None
    user_notes: Optional[str] = None
    is_favorite: bool
    tags: List[TagResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MetadataSearchFilters(BaseModel):
    """Filters for metadata search."""
    tags: Optional[List[str]] = None
    sentiment: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    speaker: Optional[str] = None
    location: Optional[str] = None
    topic: Optional[str] = None
    min_duration: Optional[float] = None
    max_duration: Optional[float] = None
    min_relevance: Optional[float] = None
    is_favorite: Optional[bool] = None
    language: Optional[str] = None


class MetadataSearchResult(BaseModel):
    """Search result with metadata."""
    clips: List[ClipMetadataResponse]
    total_count: int
    page: int
    page_size: int
    filters_applied: MetadataSearchFilters
    aggregations: Dict[str, Any] = Field(default_factory=dict)


class TagSuggestion(BaseModel):
    """AI-generated tag suggestion."""
    name: str
    tag_type: TagType
    confidence: float
    source: MetadataSource
    context: Optional[str] = None


class MetadataAnalysisResult(BaseModel):
    """Result of AI metadata analysis."""
    clip_id: str
    sentiment_data: Optional[SentimentData] = None
    named_entities: List[EntityData] = Field(default_factory=list)
    topic_labels: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    suggested_tags: List[TagSuggestion] = Field(default_factory=list)
    speaker_detection: Optional[Dict[str, Any]] = None
    geo_extraction: Optional[GeoLocationData] = None
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.0)
    processing_time: float = Field(ge=0.0, description="Processing time in seconds") 