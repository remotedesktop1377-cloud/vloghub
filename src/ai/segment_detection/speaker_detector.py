"""
Speaker transition detector for identifying changes in speakers.
"""
import logging
import time
import re
from typing import List, Dict, Any, Optional, Set
from collections import defaultdict

from .base import BaseSegmentDetector
from .models import (
    SegmentationResult, SpeakerSegment, SegmentBoundary, 
    BoundaryType, SegmentType
)
from src.services.transcription.models import Transcript, TranscriptSegment

logger = logging.getLogger(__name__)


class SpeakerTransitionDetector(BaseSegmentDetector):
    """Detector for speaker transitions using heuristic analysis."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the speaker transition detector.
        
        Args:
            config: Configuration parameters for the detector.
        """
        super().__init__(config)
        
        # Configuration for speaker detection
        self.min_speaker_duration = self.config.get("min_speaker_duration", 5.0)
        self.speaker_change_threshold = self.config.get("speaker_change_threshold", 0.7)
        self.pronoun_weight = self.config.get("pronoun_weight", 0.3)
        self.formality_weight = self.config.get("formality_weight", 0.2)
        self.vocabulary_weight = self.config.get("vocabulary_weight", 0.3)
        self.length_weight = self.config.get("length_weight", 0.2)
        
        # Speaker detection patterns
        self.speaker_indicators = {
            "first_person": ["I", "me", "my", "mine", "we", "us", "our", "ours"],
            "second_person": ["you", "your", "yours"],
            "third_person": ["he", "she", "him", "her", "his", "hers", "they", "them", "their"],
            "formal_markers": ["Mr.", "Mrs.", "Dr.", "Professor", "President", "Minister"],
            "informal_markers": ["yeah", "um", "uh", "like", "you know", "I mean"],
            "question_words": ["what", "where", "when", "who", "why", "how"],
            "interview_markers": ["thank you for", "could you tell", "what do you think"]
        }
    
    async def detect_segments(self, transcript: Transcript) -> SegmentationResult:
        """
        Detect speaker segments in a transcript.
        
        Args:
            transcript: Transcript to analyze.
            
        Returns:
            Segmentation result with speaker boundaries and segments.
        """
        start_time = time.time()
        
        if not transcript.segments:
            return SegmentationResult(
                video_id=transcript.video_id,
                total_duration=0.0,
                boundaries=[],
                overall_confidence=0.0
            )
        
        # Analyze linguistic features for each segment
        segment_features = self._extract_linguistic_features(transcript.segments)
        
        # Detect speaker boundaries
        boundaries = self._detect_speaker_boundaries(transcript.segments, segment_features)
        
        # Create speaker segments
        speaker_segments = self._create_speaker_segments(transcript.segments, boundaries)
        
        # Filter short segments
        speaker_segments = self._filter_short_speaker_segments(speaker_segments)
        
        processing_time = time.time() - start_time
        total_duration = transcript.segments[-1].end_time if transcript.segments else 0.0
        
        return SegmentationResult(
            video_id=transcript.video_id,
            total_duration=total_duration,
            boundaries=boundaries,
            speaker_segments=speaker_segments,
            overall_confidence=self._calculate_overall_confidence(boundaries),
            processing_time=processing_time,
            algorithm_info={
                "detector_type": "speaker_transition",
                "change_threshold": self.speaker_change_threshold,
                "min_duration": self.min_speaker_duration
            }
        )
    
    def _extract_linguistic_features(self, segments: List[TranscriptSegment]) -> List[Dict[str, Any]]:
        """Extract linguistic features from transcript segments."""
        features = []
        
        for segment in segments:
            text = segment.text.lower()
            words = text.split()
            
            # Extract various linguistic features
            feature_dict = {
                "pronoun_usage": self._analyze_pronoun_usage(text),
                "formality_score": self._calculate_formality_score(text),
                "vocabulary_complexity": self._calculate_vocabulary_complexity(words),
                "sentence_length": len(words),
                "question_ratio": self._calculate_question_ratio(text),
                "speaker_markers": self._detect_speaker_markers(text),
                "emotional_indicators": self._detect_emotional_indicators(text)
            }
            
            features.append(feature_dict)
        
        return features
    
    def _analyze_pronoun_usage(self, text: str) -> Dict[str, float]:
        """Analyze pronoun usage patterns."""
        words = text.split()
        total_words = len(words) if words else 1
        
        pronoun_counts = {
            "first_person": 0,
            "second_person": 0,
            "third_person": 0
        }
        
        for word in words:
            word_clean = re.sub(r'[^\w]', '', word.lower())
            for pronoun_type, pronouns in self.speaker_indicators.items():
                if pronoun_type.endswith("_person") and word_clean in [p.lower() for p in pronouns]:
                    pronoun_counts[pronoun_type] += 1
        
        # Convert to ratios
        return {k: v / total_words for k, v in pronoun_counts.items()}
    
    def _calculate_formality_score(self, text: str) -> float:
        """Calculate formality score based on linguistic markers."""
        words = text.split()
        total_words = len(words) if words else 1
        
        formal_count = 0
        informal_count = 0
        
        text_lower = text.lower()
        
        # Count formal markers
        for marker in self.speaker_indicators["formal_markers"]:
            formal_count += text_lower.count(marker.lower())
        
        # Count informal markers
        for marker in self.speaker_indicators["informal_markers"]:
            informal_count += text_lower.count(marker.lower())
        
        # Calculate formality score (-1 to 1, where 1 is very formal)
        if formal_count + informal_count == 0:
            return 0.0
        
        return (formal_count - informal_count) / (formal_count + informal_count)
    
    def _calculate_vocabulary_complexity(self, words: List[str]) -> float:
        """Calculate vocabulary complexity score."""
        if not words:
            return 0.0
        
        # Simple heuristic: ratio of unique words to total words
        unique_words = set(word.lower() for word in words)
        complexity = len(unique_words) / len(words)
        
        # Adjust for average word length
        avg_word_length = sum(len(word) for word in words) / len(words)
        length_factor = min(avg_word_length / 5.0, 2.0)  # Normalize around 5 chars
        
        return complexity * length_factor
    
    def _calculate_question_ratio(self, text: str) -> float:
        """Calculate ratio of questions in the text."""
        sentences = re.split(r'[.!?]+', text)
        if not sentences:
            return 0.0
        
        question_count = text.count('?')
        question_words = sum(1 for word in text.lower().split() 
                           if word in self.speaker_indicators["question_words"])
        
        return (question_count + question_words * 0.5) / len(sentences)
    
    def _detect_speaker_markers(self, text: str) -> Dict[str, bool]:
        """Detect specific speaker type markers."""
        text_lower = text.lower()
        
        return {
            "has_interview_markers": any(marker in text_lower 
                                       for marker in self.speaker_indicators["interview_markers"]),
            "has_formal_titles": any(marker.lower() in text_lower 
                                   for marker in self.speaker_indicators["formal_markers"]),
            "has_direct_address": "you" in text_lower.split(),
            "has_narrative_style": any(word in text_lower.split() 
                                     for word in ["then", "next", "after", "before"])
        }
    
    def _detect_emotional_indicators(self, text: str) -> Dict[str, float]:
        """Detect emotional tone indicators."""
        text_lower = text.lower()
        words = text_lower.split()
        total_words = len(words) if words else 1
        
        # Simple emotion word lists
        positive_words = ["good", "great", "excellent", "wonderful", "amazing", "love", "happy"]
        negative_words = ["bad", "terrible", "awful", "hate", "sad", "angry", "frustrated"]
        excited_words = ["wow", "fantastic", "incredible", "awesome", "brilliant"]
        
        return {
            "positive_ratio": sum(1 for word in words if word in positive_words) / total_words,
            "negative_ratio": sum(1 for word in words if word in negative_words) / total_words,
            "excitement_ratio": sum(1 for word in words if word in excited_words) / total_words,
            "exclamation_ratio": text.count('!') / total_words
        }
    
    def _detect_speaker_boundaries(
        self, 
        segments: List[TranscriptSegment], 
        features: List[Dict[str, Any]]
    ) -> List[SegmentBoundary]:
        """Detect speaker boundaries based on feature changes."""
        boundaries = []
        
        if len(segments) < 2:
            return boundaries
        
        for i in range(1, len(segments)):
            current_features = features[i]
            previous_features = features[i - 1]
            
            # Calculate feature differences
            pronoun_diff = self._calculate_pronoun_difference(
                current_features["pronoun_usage"], 
                previous_features["pronoun_usage"]
            )
            
            formality_diff = abs(
                current_features["formality_score"] - 
                previous_features["formality_score"]
            )
            
            complexity_diff = abs(
                current_features["vocabulary_complexity"] - 
                previous_features["vocabulary_complexity"]
            )
            
            length_diff = abs(
                current_features["sentence_length"] - 
                previous_features["sentence_length"]
            ) / max(current_features["sentence_length"], previous_features["sentence_length"], 1)
            
            # Calculate weighted change score
            change_score = (
                self.pronoun_weight * pronoun_diff +
                self.formality_weight * formality_diff +
                self.vocabulary_weight * complexity_diff +
                self.length_weight * length_diff
            )
            
            # Check if change score exceeds threshold
            if change_score > self.speaker_change_threshold:
                # Determine boundary type based on strength of change
                if change_score > 0.9:
                    boundary_type = BoundaryType.HARD
                elif change_score > 0.7:
                    boundary_type = BoundaryType.SOFT
                else:
                    boundary_type = BoundaryType.UNCERTAIN
                
                boundary = SegmentBoundary(
                    timestamp=segments[i].start_time,
                    boundary_type=boundary_type,
                    confidence=min(change_score, 1.0),
                    segment_type=SegmentType.SPEAKER,
                    description=f"Speaker change detected (score: {change_score:.3f})",
                    metadata={
                        "pronoun_diff": pronoun_diff,
                        "formality_diff": formality_diff,
                        "complexity_diff": complexity_diff,
                        "length_diff": length_diff
                    }
                )
                boundaries.append(boundary)
        
        return boundaries
    
    def _calculate_pronoun_difference(self, current: Dict[str, float], previous: Dict[str, float]) -> float:
        """Calculate difference in pronoun usage patterns."""
        total_diff = 0.0
        
        for pronoun_type in ["first_person", "second_person", "third_person"]:
            diff = abs(current.get(pronoun_type, 0) - previous.get(pronoun_type, 0))
            total_diff += diff
        
        return total_diff
    
    def _create_speaker_segments(
        self, 
        segments: List[TranscriptSegment], 
        boundaries: List[SegmentBoundary]
    ) -> List[SpeakerSegment]:
        """Create speaker segments based on detected boundaries."""
        speaker_segments = []
        
        if not segments:
            return speaker_segments
        
        # Add start and end boundaries
        boundary_times = [0.0] + [b.timestamp for b in boundaries] + [segments[-1].end_time]
        
        # Create speaker segments between boundaries
        for i in range(len(boundary_times) - 1):
            start_time = boundary_times[i]
            end_time = boundary_times[i + 1]
            
            # Find segments within this time range
            segment_texts = []
            segment_features = []
            
            for j, segment in enumerate(segments):
                if (segment.start_time >= start_time and 
                    segment.end_time <= end_time):
                    segment_texts.append(segment.text)
            
            if segment_texts:
                # Generate speaker ID and metadata
                speaker_id = f"speaker_{i + 1}"
                combined_text = " ".join(segment_texts)
                
                # Analyze speaker characteristics
                speaker_features = self._analyze_speaker_characteristics(combined_text)
                
                speaker_segment = SpeakerSegment(
                    start_time=start_time,
                    end_time=end_time,
                    speaker_id=speaker_id,
                    speaker_name=None,  # Could be enhanced with name detection
                    confidence=0.8,  # Default confidence
                    text_features=speaker_features,
                    metadata={
                        "segment_count": len(segment_texts),
                        "word_count": len(combined_text.split()),
                        "avg_formality": speaker_features.get("formality_score", 0.0)
                    }
                )
                speaker_segments.append(speaker_segment)
        
        return speaker_segments
    
    def _analyze_speaker_characteristics(self, text: str) -> Dict[str, Any]:
        """Analyze characteristics of a speaker based on their text."""
        features = {}
        
        # Pronoun usage
        features["pronoun_usage"] = self._analyze_pronoun_usage(text)
        
        # Formality level
        features["formality_score"] = self._calculate_formality_score(text)
        
        # Speaking style
        features["question_ratio"] = self._calculate_question_ratio(text)
        features["speaker_markers"] = self._detect_speaker_markers(text)
        features["emotional_indicators"] = self._detect_emotional_indicators(text)
        
        # Classify likely speaker type
        features["likely_speaker_type"] = self._classify_speaker_type(features)
        
        return features
    
    def _classify_speaker_type(self, features: Dict[str, Any]) -> str:
        """Classify the likely type of speaker based on features."""
        pronoun_usage = features.get("pronoun_usage", {})
        formality = features.get("formality_score", 0.0)
        markers = features.get("speaker_markers", {})
        
        # Interview participant (high first person, answers questions)
        if (pronoun_usage.get("first_person", 0) > 0.05 and 
            not markers.get("has_interview_markers", False)):
            return "interviewee"
        
        # Interviewer (asks questions, uses second person)
        if (markers.get("has_interview_markers", False) or 
            pronoun_usage.get("second_person", 0) > 0.03):
            return "interviewer"
        
        # Narrator (third person, formal)
        if (pronoun_usage.get("third_person", 0) > 0.03 and 
            formality > 0.2):
            return "narrator"
        
        # Presenter (formal, direct address)
        if (formality > 0.1 and 
            markers.get("has_direct_address", False)):
            return "presenter"
        
        return "unknown"
    
    def _filter_short_speaker_segments(self, segments: List[SpeakerSegment]) -> List[SpeakerSegment]:
        """Filter out speaker segments that are too short."""
        return [
            segment for segment in segments 
            if (segment.end_time - segment.start_time) >= self.min_speaker_duration
        ]
    
    def _calculate_overall_confidence(self, boundaries: List[SegmentBoundary]) -> float:
        """Calculate overall confidence in the speaker segmentation."""
        if not boundaries:
            return 0.0
        
        total_confidence = sum(b.confidence for b in boundaries)
        return total_confidence / len(boundaries) 