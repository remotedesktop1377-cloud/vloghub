"""
Hybrid segment detector that combines topic and speaker detection.
"""
import logging
import time
from typing import List, Dict, Any, Optional

from .base import BaseSegmentDetector
from .topic_detector import TopicChangeDetector
from .speaker_detector import SpeakerTransitionDetector
from .models import (
    SegmentationResult, SegmentBoundary, TopicSegment, SpeakerSegment,
    BoundaryType, SegmentType, ClipCandidate
)
from src.services.transcription.models import Transcript

logger = logging.getLogger(__name__)


class HybridSegmentDetector(BaseSegmentDetector):
    """Hybrid detector that combines topic and speaker segmentation."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the hybrid segment detector.
        
        Args:
            config: Configuration parameters for the detector.
        """
        super().__init__(config)
        
        # Initialize sub-detectors
        topic_config = self.config.get("topic_detection", {})
        speaker_config = self.config.get("speaker_detection", {})
        
        try:
            self.topic_detector = TopicChangeDetector(topic_config)
        except ImportError:
            logger.warning("Topic detector not available")
            self.topic_detector = None
        
        self.speaker_detector = SpeakerTransitionDetector(speaker_config)
        
        # Hybrid detection parameters
        self.topic_weight = self.config.get("topic_weight", 0.6)
        self.speaker_weight = self.config.get("speaker_weight", 0.4)
        self.boundary_merge_threshold = self.config.get("boundary_merge_threshold", 5.0)
        self.min_hybrid_segment_duration = self.config.get("min_hybrid_segment_duration", 15.0)
    
    async def detect_segments(self, transcript: Transcript) -> SegmentationResult:
        """
        Detect segments using hybrid approach.
        
        Args:
            transcript: Transcript to analyze.
            
        Returns:
            Combined segmentation result.
        """
        start_time = time.time()
        
        if not transcript.segments:
            return SegmentationResult(
                video_id=transcript.video_id,
                total_duration=0.0,
                boundaries=[],
                overall_confidence=0.0
            )
        
        # Run both detectors
        topic_result = None
        if self.topic_detector:
            topic_result = await self.topic_detector.detect_segments(transcript)
        
        speaker_result = await self.speaker_detector.detect_segments(transcript)
        
        # Combine results
        combined_boundaries = self._combine_boundaries(
            topic_result.boundaries if topic_result else [],
            speaker_result.boundaries
        )
        
        # Create hybrid segments
        topic_segments = topic_result.topic_segments if topic_result else []
        speaker_segments = speaker_result.speaker_segments
        
        # Merge and filter segments
        combined_boundaries = self._merge_close_boundaries(combined_boundaries)
        
        processing_time = time.time() - start_time
        total_duration = transcript.segments[-1].end_time if transcript.segments else 0.0
        
        # Calculate overall confidence
        topic_confidence = topic_result.overall_confidence if topic_result else 0.0
        speaker_confidence = speaker_result.overall_confidence
        overall_confidence = (
            self.topic_weight * topic_confidence + 
            self.speaker_weight * speaker_confidence
        )
        
        return SegmentationResult(
            video_id=transcript.video_id,
            total_duration=total_duration,
            boundaries=combined_boundaries,
            topic_segments=topic_segments,
            speaker_segments=speaker_segments,
            overall_confidence=overall_confidence,
            processing_time=processing_time,
            algorithm_info={
                "detector_type": "hybrid",
                "topic_weight": self.topic_weight,
                "speaker_weight": self.speaker_weight,
                "topic_detector_used": self.topic_detector is not None,
                "speaker_detector_used": True
            }
        )
    
    def _combine_boundaries(
        self, 
        topic_boundaries: List[SegmentBoundary], 
        speaker_boundaries: List[SegmentBoundary]
    ) -> List[SegmentBoundary]:
        """Combine topic and speaker boundaries with weighted scoring."""
        combined = []
        
        # Add topic boundaries with weight
        for boundary in topic_boundaries:
            weighted_boundary = SegmentBoundary(
                timestamp=boundary.timestamp,
                boundary_type=boundary.boundary_type,
                confidence=boundary.confidence * self.topic_weight,
                segment_type=SegmentType.TOPIC,
                description=f"Topic: {boundary.description}",
                metadata={**boundary.metadata, "source": "topic"}
            )
            combined.append(weighted_boundary)
        
        # Add speaker boundaries with weight
        for boundary in speaker_boundaries:
            weighted_boundary = SegmentBoundary(
                timestamp=boundary.timestamp,
                boundary_type=boundary.boundary_type,
                confidence=boundary.confidence * self.speaker_weight,
                segment_type=SegmentType.SPEAKER,
                description=f"Speaker: {boundary.description}",
                metadata={**boundary.metadata, "source": "speaker"}
            )
            combined.append(weighted_boundary)
        
        # Sort by timestamp
        combined.sort(key=lambda x: x.timestamp)
        
        return combined
    
    def _merge_close_boundaries(self, boundaries: List[SegmentBoundary]) -> List[SegmentBoundary]:
        """Merge boundaries that are very close together."""
        if not boundaries:
            return boundaries
        
        merged = []
        current = boundaries[0]
        
        for next_boundary in boundaries[1:]:
            time_diff = next_boundary.timestamp - current.timestamp
            
            if time_diff <= self.boundary_merge_threshold:
                # Merge boundaries - keep the one with higher confidence
                if next_boundary.confidence > current.confidence:
                    # Update current with stronger boundary
                    current = SegmentBoundary(
                        timestamp=(current.timestamp + next_boundary.timestamp) / 2,
                        boundary_type=next_boundary.boundary_type,
                        confidence=max(current.confidence, next_boundary.confidence),
                        segment_type=SegmentType.HYBRID,
                        description=f"Merged: {current.description} + {next_boundary.description}",
                        metadata={
                            "merged_from": [current.segment_type.value, next_boundary.segment_type.value],
                            "original_timestamps": [current.timestamp, next_boundary.timestamp]
                        }
                    )
                # If current is stronger, just update confidence
                else:
                    current = SegmentBoundary(
                        timestamp=current.timestamp,
                        boundary_type=current.boundary_type,
                        confidence=max(current.confidence, next_boundary.confidence),
                        segment_type=SegmentType.HYBRID,
                        description=f"Merged: {current.description} + {next_boundary.description}",
                        metadata={
                            "merged_from": [current.segment_type.value, next_boundary.segment_type.value],
                            "original_timestamps": [current.timestamp, next_boundary.timestamp]
                        }
                    )
            else:
                # Keep current boundary and move to next
                merged.append(current)
                current = next_boundary
        
        # Add the last boundary
        merged.append(current)
        
        return merged
    
    async def extract_clip_candidates(
        self, 
        segmentation: SegmentationResult,
        min_duration: float = 30.0,
        max_duration: float = 120.0,
        min_relevance: float = 0.6
    ) -> List[ClipCandidate]:
        """Extract clip candidates from hybrid segmentation."""
        candidates = []
        
        # Get base candidates from topic segments if available
        topic_candidates = []
        if segmentation.topic_segments and self.topic_detector:
            topic_result = SegmentationResult(
                video_id=segmentation.video_id,
                total_duration=segmentation.total_duration,
                boundaries=segmentation.boundaries,
                topic_segments=segmentation.topic_segments,
                overall_confidence=segmentation.overall_confidence
            )
            topic_candidates = await self.topic_detector.extract_clip_candidates(
                topic_result, min_duration, max_duration, min_relevance
            )
        
        # Enhance candidates with speaker information
        enhanced_candidates = self._enhance_candidates_with_speaker_info(
            topic_candidates, segmentation.speaker_segments
        )
        
        # Create speaker-based candidates if no topic candidates
        if not enhanced_candidates and segmentation.speaker_segments:
            enhanced_candidates = self._create_speaker_based_candidates(
                segmentation.speaker_segments, min_duration, max_duration
            )
        
        # Filter by relevance and rank
        final_candidates = [
            candidate for candidate in enhanced_candidates
            if candidate.relevance_score >= min_relevance
        ]
        
        # Sort by combined relevance score
        final_candidates.sort(key=lambda x: x.relevance_score, reverse=True)
        
        return final_candidates
    
    def _enhance_candidates_with_speaker_info(
        self, 
        topic_candidates: List[ClipCandidate], 
        speaker_segments: List[SpeakerSegment]
    ) -> List[ClipCandidate]:
        """Enhance topic-based candidates with speaker information."""
        enhanced = []
        
        for candidate in topic_candidates:
            # Find overlapping speaker segments
            overlapping_speakers = []
            for speaker_segment in speaker_segments:
                if (speaker_segment.start_time < candidate.end_time and
                    speaker_segment.end_time > candidate.start_time):
                    overlapping_speakers.append(speaker_segment)
            
            # Calculate speaker diversity bonus
            unique_speakers = set(seg.speaker_id for seg in overlapping_speakers)
            speaker_diversity = len(unique_speakers)
            
            # Adjust relevance based on speaker information
            speaker_bonus = 0.0
            if speaker_diversity == 2:  # Interview format
                speaker_bonus = 0.1
            elif speaker_diversity == 1:  # Single speaker
                # Check if it's a good speaker type
                if overlapping_speakers:
                    speaker_type = overlapping_speakers[0].text_features.get("likely_speaker_type", "unknown")
                    if speaker_type in ["interviewee", "presenter"]:
                        speaker_bonus = 0.05
            
            # Create enhanced candidate
            enhanced_candidate = ClipCandidate(
                clip_id=candidate.clip_id,
                start_time=candidate.start_time,
                end_time=candidate.end_time,
                duration=candidate.duration,
                title=candidate.title,
                description=candidate.description,
                relevance_score=min(1.0, candidate.relevance_score + speaker_bonus),
                quality_score=candidate.quality_score,
                topic_segments=candidate.topic_segments,
                speaker_segments=overlapping_speakers,
                keywords=candidate.keywords,
                metadata={
                    **candidate.metadata,
                    "speaker_count": speaker_diversity,
                    "speaker_types": [seg.text_features.get("likely_speaker_type", "unknown") 
                                    for seg in overlapping_speakers],
                    "speaker_bonus": speaker_bonus
                }
            )
            enhanced.append(enhanced_candidate)
        
        return enhanced
    
    def _create_speaker_based_candidates(
        self, 
        speaker_segments: List[SpeakerSegment],
        min_duration: float,
        max_duration: float
    ) -> List[ClipCandidate]:
        """Create clip candidates based solely on speaker segments."""
        candidates = []
        
        for i, segment in enumerate(speaker_segments):
            duration = segment.end_time - segment.start_time
            
            if min_duration <= duration <= max_duration:
                # Calculate relevance based on speaker characteristics
                relevance = self._calculate_speaker_relevance(segment)
                
                candidate = ClipCandidate(
                    clip_id=f"speaker_{segment.speaker_id}_{i}",
                    start_time=segment.start_time,
                    end_time=segment.end_time,
                    duration=duration,
                    title=f"Speaker {segment.speaker_id} segment",
                    description=f"Content from {segment.text_features.get('likely_speaker_type', 'unknown')} speaker",
                    relevance_score=relevance,
                    quality_score=segment.confidence,
                    speaker_segments=[segment],
                    keywords=[],
                    metadata={
                        "source": "speaker_based",
                        "speaker_type": segment.text_features.get("likely_speaker_type", "unknown"),
                        "formality": segment.text_features.get("formality_score", 0.0)
                    }
                )
                candidates.append(candidate)
        
        return candidates
    
    def _calculate_speaker_relevance(self, speaker_segment: SpeakerSegment) -> float:
        """Calculate relevance score for a speaker segment."""
        base_score = 0.5
        
        # Bonus for interesting speaker types
        speaker_type = speaker_segment.text_features.get("likely_speaker_type", "unknown")
        type_bonuses = {
            "interviewee": 0.3,
            "presenter": 0.2,
            "narrator": 0.1,
            "interviewer": 0.1,
            "unknown": 0.0
        }
        
        type_bonus = type_bonuses.get(speaker_type, 0.0)
        
        # Bonus for emotional content
        emotions = speaker_segment.text_features.get("emotional_indicators", {})
        emotion_bonus = min(0.2, sum(emotions.values()) * 0.5)
        
        # Penalty for very informal speech
        formality = speaker_segment.text_features.get("formality_score", 0.0)
        formality_penalty = max(0.0, -formality * 0.1)
        
        final_score = base_score + type_bonus + emotion_bonus - formality_penalty
        return max(0.0, min(1.0, final_score)) 