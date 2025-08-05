"""
Segment detection module for identifying topic changes and speaker transitions.
"""

from .base import BaseSegmentDetector
from .models import (
    SegmentBoundary, TopicSegment, SpeakerSegment, 
    SegmentationResult, SegmentType, BoundaryType
)
from .topic_detector import TopicChangeDetector
from .speaker_detector import SpeakerTransitionDetector
from .hybrid_detector import HybridSegmentDetector

__all__ = [
    'BaseSegmentDetector',
    'SegmentBoundary',
    'TopicSegment',
    'SpeakerSegment',
    'SegmentationResult',
    'SegmentType',
    'BoundaryType',
    'TopicChangeDetector',
    'SpeakerTransitionDetector',
    'HybridSegmentDetector',
] 