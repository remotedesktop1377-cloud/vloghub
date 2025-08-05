"""
Base class for segment detectors.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
import logging

from .models import (
    SegmentBoundary, SegmentationResult, TopicSegment, 
    SpeakerSegment, ClipCandidate, SegmentType
)
from src.services.transcription.models import Transcript, TranscriptSegment

logger = logging.getLogger(__name__)


class BaseSegmentDetector(ABC):
    """Base class for segment detection implementations."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the segment detector.
        
        Args:
            config: Configuration parameters for the detector.
        """
        self.config = config or {}
        self.min_segment_duration = self.config.get("min_segment_duration", 10.0)
        self.max_segment_duration = self.config.get("max_segment_duration", 300.0)
        self.confidence_threshold = self.config.get("confidence_threshold", 0.5)
    
    @abstractmethod
    async def detect_segments(self, transcript: Transcript) -> SegmentationResult:
        """
        Detect segments in a transcript.
        
        Args:
            transcript: Transcript to analyze.
            
        Returns:
            Segmentation result with detected boundaries and segments.
        """
        pass
    
    async def extract_clip_candidates(
        self, 
        segmentation: SegmentationResult,
        min_duration: float = 30.0,
        max_duration: float = 120.0,
        min_relevance: float = 0.6
    ) -> List[ClipCandidate]:
        """
        Extract potential clips from segmentation results.
        
        Args:
            segmentation: Segmentation result.
            min_duration: Minimum clip duration in seconds.
            max_duration: Maximum clip duration in seconds.
            min_relevance: Minimum relevance score.
            
        Returns:
            List of clip candidates.
        """
        candidates = []
        
        # Extract clips from topic segments
        for i, topic_segment in enumerate(segmentation.topic_segments):
            duration = topic_segment.end_time - topic_segment.start_time
            
            if min_duration <= duration <= max_duration:
                # Find overlapping speaker segments
                overlapping_speakers = self._find_overlapping_speakers(
                    topic_segment, segmentation.speaker_segments
                )
                
                # Calculate relevance based on coherence and other factors
                relevance_score = self._calculate_relevance_score(
                    topic_segment, overlapping_speakers
                )
                
                if relevance_score >= min_relevance:
                    candidate = ClipCandidate(
                        clip_id=f"topic_{i}_{topic_segment.start_time}",
                        start_time=topic_segment.start_time,
                        end_time=topic_segment.end_time,
                        duration=duration,
                        title=topic_segment.topic_summary,
                        description=f"Topic: {topic_segment.topic_summary}",
                        relevance_score=relevance_score,
                        quality_score=topic_segment.coherence_score,
                        topic_segments=[topic_segment],
                        speaker_segments=overlapping_speakers,
                        entities=topic_segment.entities,
                        keywords=topic_segment.keywords
                    )
                    candidates.append(candidate)
        
        return sorted(candidates, key=lambda x: x.relevance_score, reverse=True)
    
    def _find_overlapping_speakers(
        self, 
        topic_segment: TopicSegment, 
        speaker_segments: List[SpeakerSegment]
    ) -> List[SpeakerSegment]:
        """Find speaker segments that overlap with a topic segment."""
        overlapping = []
        
        for speaker_segment in speaker_segments:
            # Check for overlap
            if (speaker_segment.start_time < topic_segment.end_time and
                speaker_segment.end_time > topic_segment.start_time):
                overlapping.append(speaker_segment)
        
        return overlapping
    
    def _calculate_relevance_score(
        self, 
        topic_segment: TopicSegment, 
        speaker_segments: List[SpeakerSegment]
    ) -> float:
        """Calculate relevance score for a potential clip."""
        # Base score from topic coherence
        base_score = topic_segment.coherence_score
        
        # Bonus for having entities (indicates important content)
        entity_bonus = min(len(topic_segment.entities) * 0.1, 0.3)
        
        # Bonus for having keywords
        keyword_bonus = min(len(topic_segment.keywords) * 0.05, 0.2)
        
        # Penalty for too many speaker changes (might be confusing)
        speaker_penalty = max(len(speaker_segments) - 2, 0) * 0.1
        
        final_score = base_score + entity_bonus + keyword_bonus - speaker_penalty
        
        return max(0.0, min(1.0, final_score))
    
    def merge_segments(
        self, 
        segments: List[TopicSegment], 
        max_gap: float = 5.0
    ) -> List[TopicSegment]:
        """
        Merge adjacent segments with small gaps.
        
        Args:
            segments: List of segments to merge.
            max_gap: Maximum gap between segments to merge.
            
        Returns:
            List of merged segments.
        """
        if not segments:
            return []
        
        merged = []
        current = segments[0]
        
        for next_segment in segments[1:]:
            gap = next_segment.start_time - current.end_time
            
            if gap <= max_gap:
                # Merge segments
                current = TopicSegment(
                    start_time=current.start_time,
                    end_time=next_segment.end_time,
                    topic_summary=f"{current.topic_summary} + {next_segment.topic_summary}",
                    keywords=list(set(current.keywords + next_segment.keywords)),
                    coherence_score=(current.coherence_score + next_segment.coherence_score) / 2,
                    entities=list(set(current.entities + next_segment.entities)),
                    metadata={**current.metadata, **next_segment.metadata}
                )
            else:
                merged.append(current)
                current = next_segment
        
        merged.append(current)
        return merged
    
    def filter_short_segments(
        self, 
        segments: List[TopicSegment]
    ) -> List[TopicSegment]:
        """Filter out segments that are too short."""
        return [
            segment for segment in segments 
            if (segment.end_time - segment.start_time) >= self.min_segment_duration
        ] 