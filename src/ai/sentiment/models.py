"""
Data models for sentiment analysis.
"""
from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field


class SentimentLabel(str, Enum):
    """Sentiment classification labels."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class EmotionLabel(str, Enum):
    """Emotion classification labels."""
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    SURPRISE = "surprise"
    DISGUST = "disgust"
    HOPE = "hope"
    INSPIRING = "inspiring"
    FORMAL = "formal"
    CASUAL = "casual"


class SentimentResult(BaseModel):
    """Result of sentiment analysis."""
    label: SentimentLabel
    confidence: float = Field(ge=0.0, le=1.0)
    scores: Dict[str, float] = Field(default_factory=dict)
    text: str
    start_time: Optional[float] = None
    end_time: Optional[float] = None


class EmotionResult(BaseModel):
    """Result of emotion analysis."""
    emotions: Dict[EmotionLabel, float] = Field(default_factory=dict)
    primary_emotion: EmotionLabel
    confidence: float = Field(ge=0.0, le=1.0)
    text: str
    start_time: Optional[float] = None
    end_time: Optional[float] = None


class SegmentSentiment(BaseModel):
    """Sentiment analysis for a transcript segment."""
    segment_id: str
    start_time: float
    end_time: float
    text: str
    sentiment: SentimentResult
    emotions: Optional[EmotionResult] = None
    tone_descriptors: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict) 