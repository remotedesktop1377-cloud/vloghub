"""
Clip detection service that combines transcription, sentiment analysis, 
entity recognition, and segment detection to identify relevant video clips.
"""

from .clip_detector import ClipDetectionService
from .models import ClipAnalysisResult, ClipMetadata, ClipRanking

__all__ = [
    'ClipDetectionService',
    'ClipAnalysisResult', 
    'ClipMetadata',
    'ClipRanking'
] 