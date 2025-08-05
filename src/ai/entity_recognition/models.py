"""
Data models for named entity recognition.
"""
from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field


class EntityType(str, Enum):
    """Types of entities that can be recognized."""
    PERSON = "person"
    ORGANIZATION = "organization"
    LOCATION = "location"
    DATE = "date"
    TIME = "time"
    EVENT = "event"
    CONCEPT = "concept"
    PRODUCT = "product"
    MONEY = "money"
    QUANTITY = "quantity"
    LANGUAGE = "language"
    NATIONALITY = "nationality"
    OTHER = "other"


class Entity(BaseModel):
    """Represents a named entity extracted from text."""
    text: str
    type: EntityType
    confidence: float = Field(ge=0.0, le=1.0)
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    normalized_value: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EntityResult(BaseModel):
    """Result of entity recognition on a text."""
    text: str
    entities: List[Entity]
    language: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    processing_time: Optional[float] = None


class SegmentEntities(BaseModel):
    """Entity recognition results for a transcript segment."""
    segment_id: str
    start_time: float
    end_time: float
    text: str
    entities: List[Entity]
    entity_counts: Dict[EntityType, int] = Field(default_factory=dict)
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class VideoEntities(BaseModel):
    """Entity recognition results for an entire video."""
    video_id: str
    segments: List[SegmentEntities]
    all_entities: List[Entity]
    entity_summary: Dict[EntityType, List[Entity]] = Field(default_factory=dict)
    confidence: float = Field(ge=0.0, le=1.0)
    language: Optional[str] = None
    created_at: Optional[str] = None 