"""
Tests for speaker transition detector.
"""
import pytest
from unittest.mock import Mock

from backend.ai.segment_detection.speaker_detector import SpeakerTransitionDetector
from backend.ai.segment_detection.models import SegmentationResult
from backend.services.transcription.models import Transcript, TranscriptSegment


@pytest.fixture
def sample_transcript():
    """Create a sample transcript for testing."""
    segments = [
        TranscriptSegment(
            start_time=0.0,
            end_time=10.0,
            text="I think Nelson Mandela was a great leader.",
            confidence=0.9
        ),
        TranscriptSegment(
            start_time=10.0,
            end_time=20.0,
            text="What do you think about his impact?",
            confidence=0.8
        ),
        TranscriptSegment(
            start_time=20.0,
            end_time=30.0,
            text="He fought for freedom during apartheid years.",
            confidence=0.7
        ),
    ]
    
    return Transcript(
        video_id="test_video",
        language="en",
        segments=segments,
        source="test"
    )


@pytest.mark.asyncio
async def test_speaker_detector_initialization():
    """Test speaker detector initialization."""
    detector = SpeakerTransitionDetector()
    assert detector.min_speaker_duration == 5.0
    assert detector.speaker_change_threshold == 0.7


@pytest.mark.asyncio
async def test_detect_segments(sample_transcript):
    """Test basic speaker segment detection."""
    detector = SpeakerTransitionDetector()
    
    result = await detector.detect_segments(sample_transcript)
    
    assert isinstance(result, SegmentationResult)
    assert result.video_id == "test_video"
    assert len(result.speaker_segments) >= 0


@pytest.mark.asyncio
async def test_detect_segments_empty():
    """Test detection with empty transcript."""
    detector = SpeakerTransitionDetector()
    
    empty_transcript = Transcript(
        video_id="empty",
        language="en", 
        segments=[],
        source="test"
    )
    
    result = await detector.detect_segments(empty_transcript)
    
    assert result.video_id == "empty"
    assert result.total_duration == 0.0
    assert len(result.boundaries) == 0


def test_analyze_pronoun_usage():
    """Test pronoun usage analysis."""
    detector = SpeakerTransitionDetector()
    
    text = "I think you are right about this."
    usage = detector._analyze_pronoun_usage(text)
    
    assert "first_person" in usage
    assert "second_person" in usage
    assert "third_person" in usage
    assert usage["first_person"] > 0  # "I"
    assert usage["second_person"] > 0  # "you"


def test_calculate_formality_score():
    """Test formality score calculation."""
    detector = SpeakerTransitionDetector()
    
    # Formal text
    formal_text = "Mr. President, I would like to discuss this matter."
    formal_score = detector._calculate_formality_score(formal_text)
    
    # Informal text
    informal_text = "Yeah, um, like, you know what I mean?"
    informal_score = detector._calculate_formality_score(informal_text)
    
    assert formal_score > informal_score


def test_classify_speaker_type():
    """Test speaker type classification."""
    detector = SpeakerTransitionDetector()
    
    # Mock features for different speaker types
    interviewee_features = {
        "pronoun_usage": {"first_person": 0.1, "second_person": 0.01, "third_person": 0.02},
        "formality_score": 0.1,
        "speaker_markers": {"has_interview_markers": False}
    }
    
    interviewer_features = {
        "pronoun_usage": {"first_person": 0.02, "second_person": 0.05, "third_person": 0.02},
        "formality_score": 0.2,
        "speaker_markers": {"has_interview_markers": True}
    }
    
    assert detector._classify_speaker_type(interviewee_features) == "interviewee"
    assert detector._classify_speaker_type(interviewer_features) == "interviewer"


def test_calculate_overall_confidence():
    """Test overall confidence calculation."""
    detector = SpeakerTransitionDetector()
    
    boundaries = [
        Mock(confidence=0.8),
        Mock(confidence=0.6),
        Mock(confidence=0.9)
    ]
    
    confidence = detector._calculate_overall_confidence(boundaries)
    
    expected = (0.8 + 0.6 + 0.9) / 3
    assert abs(confidence - expected) < 0.01


def test_calculate_overall_confidence_empty():
    """Test confidence calculation with no boundaries."""
    detector = SpeakerTransitionDetector()
    
    confidence = detector._calculate_overall_confidence([])
    assert confidence == 0.0


def test_extract_linguistic_features():
    """Test linguistic feature extraction."""
    detector = SpeakerTransitionDetector()
    
    segments = [
        Mock(text="I think this is great!"),
        Mock(text="What do you think about it?")
    ]
    
    features = detector._extract_linguistic_features(segments)
    
    assert len(features) == 2
    assert "pronoun_usage" in features[0]
    assert "formality_score" in features[0]
    assert "vocabulary_complexity" in features[0]


def test_detect_emotional_indicators():
    """Test emotional indicator detection."""
    detector = SpeakerTransitionDetector()
    
    positive_text = "This is great! I love it!"
    negative_text = "This is terrible and awful."
    
    positive_emotions = detector._detect_emotional_indicators(positive_text)
    negative_emotions = detector._detect_emotional_indicators(negative_text)
    
    assert positive_emotions["positive_ratio"] > 0
    assert positive_emotions["exclamation_ratio"] > 0
    assert negative_emotions["negative_ratio"] > 0 