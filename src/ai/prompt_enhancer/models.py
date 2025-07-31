"""
Data models for the prompt enhancer module.
"""
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class Entity(BaseModel):
    """Represents an entity extracted from a prompt."""
    text: str
    type: str
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    start_char: Optional[int] = None
    end_char: Optional[int] = None


class TemporalReference(BaseModel):
    """Represents a temporal reference (date, time period) extracted from a prompt."""
    text: str
    type: str  # 'date', 'period', 'decade', etc.
    normalized_value: str  # ISO format for dates, standardized format for periods
    start_date: Optional[str] = None  # ISO format
    end_date: Optional[str] = None  # ISO format
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class LocationReference(BaseModel):
    """Represents a location reference extracted from a prompt."""
    text: str
    normalized_name: str
    country_code: Optional[str] = None  # ISO 3166-1 alpha-2
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class RelatedTerm(BaseModel):
    """Represents a term related to entities in the prompt."""
    text: str
    relation_type: str  # 'synonym', 'related_entity', 'broader_term', etc.
    source_entity: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class EnhancedPrompt(BaseModel):
    """Represents an enhanced prompt with extracted information and expansions."""
    original_prompt: str
    entities: List[Entity] = Field(default_factory=list)
    temporal_references: List[TemporalReference] = Field(default_factory=list)
    location_references: List[LocationReference] = Field(default_factory=list)
    related_terms: List[RelatedTerm] = Field(default_factory=list)
    
    # Generated search queries
    primary_query: str  # Main query for YouTube search
    alternative_queries: List[str] = Field(default_factory=list)  # Alternative formulations
    
    # Search parameters
    search_params: Dict[str, any] = Field(default_factory=dict)  # Parameters for YouTube API 