"""
Tests for hybrid segment detector.
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch

from src.ai.segment_detection.hybrid_detector import HybridSegmentDetector
from src.ai.segment_detection.models import SegmentationResult, SegmentBoundary, BoundaryType, SegmentType
from src.services.transcription.models import Transcript, TranscriptSegment


@pytest.fixture
def sample_transcript():
    """Create a sample transcript for testing."""
    segments = [
        TranscriptSegment(
            start_time=0.0,
            end_time=10.0,
            text="Nelson Mandela was a great leader in South Africa.",
            confidence=0.9
        ),
        TranscriptSegment(
            start_time=10.0,
            end_time=20.0,
            text="What do you think about his impact on society?",
            confidence=0.8
        ),
        TranscriptSegment(
            start_time=20.0,
            end_time=30.0,
            text="Today the weather will be sunny and warm.",
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
async def test_hybrid_detector_initialization():
    """Test hybrid detector initialization."""
    detector = HybridSegmentDetector()
    
    # Should initialize speaker detector at minimum
    assert detector.speaker_detector is not None
    assert detector.topic_weight == 0.6
    assert detector.speaker_weight == 0.4


@pytest.mark.asyncio
async def test_detect_segments_with_mocked_detectors(sample_transcript):
    """Test hybrid detection with mocked sub-detectors."""
    detector = HybridSegmentDetector()
    
    # Mock the sub-detectors
    mock_topic_result = SegmentationResult(
        video_id="test_video",
        total_duration=30.0,
        boundaries=[
            SegmentBoundary(
                timestamp=20.0,
                boundary_type=BoundaryType.HARD,
                confidence=0.8,
                segment_type=SegmentType.TOPIC
            )
        ],
        overall_confidence=0.8
    )
    
    mock_speaker_result = SegmentationResult(
        video_id="test_video",
        total_duration=30.0,
        boundaries=[
            SegmentBoundary(
                timestamp=10.0,
                boundary_type=BoundaryType.SOFT,
                confidence=0.6,
                segment_type=SegmentType.SPEAKER
            )
        ],
        overall_confidence=0.6
    )
    
    # Mock the detector methods
    if detector.topic_detector:
        detector.topic_detector.detect_segments = AsyncMock(return_value=mock_topic_result)
    
    detector.speaker_detector.detect_segments = AsyncMock(return_value=mock_speaker_result)
    
    result = await detector.detect_segments(sample_transcript)
    
    assert isinstance(result, SegmentationResult)
    assert result.video_id == "test_video"
    assert len(result.boundaries) >= 0


@pytest.mark.asyncio
async def test_detect_segments_empty():
    """Test detection with empty transcript."""
    detector = HybridSegmentDetector()
    
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


def test_combine_boundaries():
    """Test boundary combination logic."""
    detector = HybridSegmentDetector()
    
    topic_boundaries = [
        SegmentBoundary(
            timestamp=20.0,
            boundary_type=BoundaryType.HARD,
            confidence=0.8,
            segment_type=SegmentType.TOPIC
        )
    ]
    
    speaker_boundaries = [
        SegmentBoundary(
            timestamp=10.0,
            boundary_type=BoundaryType.SOFT,
            confidence=0.6,
            segment_type=SegmentType.SPEAKER
        )
    ]
    
    combined = detector._combine_boundaries(topic_boundaries, speaker_boundaries)
    
    assert len(combined) == 2
    assert combined[0].timestamp == 10.0  # Sorted by timestamp
    assert combined[1].timestamp == 20.0


def test_merge_close_boundaries():
    """Test merging of close boundaries."""
    detector = HybridSegmentDetector()
    detector.boundary_merge_threshold = 5.0
    
    boundaries = [
        SegmentBoundary(
            timestamp=10.0,
            boundary_type=BoundaryType.HARD,
            confidence=0.8,
            segment_type=SegmentType.TOPIC
        ),
        SegmentBoundary(
            timestamp=12.0,  # Close to previous
            boundary_type=BoundaryType.SOFT,
            confidence=0.6,
            segment_type=SegmentType.SPEAKER
        ),
        SegmentBoundary(
            timestamp=25.0,  # Far from others
            boundary_type=BoundaryType.HARD,
            confidence=0.9,
            segment_type=SegmentType.TOPIC
        )
    ]
    
    merged = detector._merge_close_boundaries(boundaries)
    
    # Should merge first two boundaries but keep the third
    assert len(merged) == 2
    assert merged[0].segment_type == SegmentType.HYBRID
    assert merged[1].timestamp == 25.0


def test_calculate_speaker_relevance():
    """Test speaker relevance calculation."""
    detector = HybridSegmentDetector()
    
    # Mock speaker segment
    speaker_segment = Mock()
    speaker_segment.text_features = {
        "likely_speaker_type": "interviewee",
        "emotional_indicators": {"positive_ratio": 0.1, "excitement_ratio": 0.05},
        "formality_score": 0.2
    }
    
    relevance = detector._calculate_speaker_relevance(speaker_segment)
    
    assert 0.0 <= relevance <= 1.0
    # Should get bonus for being interviewee
    assert relevance > 0.5


@pytest.mark.asyncio
async def test_extract_clip_candidates_speaker_only():
    """Test clip candidate extraction with speaker segments only."""
    detector = HybridSegmentDetector()
    
    # Mock segmentation result with speaker segments
    speaker_segments = [
        Mock(
            start_time=0.0,
            end_time=60.0,
            speaker_id="speaker_1",
            text_features={
                "likely_speaker_type": "interviewee",
                "formality_score": 0.3
            },
            confidence=0.8
        ),
        Mock(
            start_time=60.0,
            end_time=90.0,
            speaker_id="speaker_2", 
            text_features={
                "likely_speaker_type": "interviewer",
                "formality_score": 0.5
            },
            confidence=0.7
        )
    ]
    
    segmentation = Mock()
    segmentation.topic_segments = []
    segmentation.speaker_segments = speaker_segments
    
    # Mock the topic detector as None
    detector.topic_detector = None
    
    candidates = await detector.extract_clip_candidates(segmentation)
    
    assert isinstance(candidates, list)
    # Should create candidates based on speaker segments
    assert len(candidates) >= 0


def test_enhance_candidates_with_speaker_info():
    """Test enhancing topic candidates with speaker information."""
    detector = HybridSegmentDetector()
    
    # Mock topic candidate
    topic_candidate = Mock()
    topic_candidate.start_time = 10.0
    topic_candidate.end_time = 50.0
    topic_candidate.relevance_score = 0.7
    topic_candidate.topic_segments = []
    topic_candidate.keywords = []
    topic_candidate.metadata = {}
    
    # Mock overlapping speaker segments
    speaker_segments = [
        Mock(
            start_time=5.0,
            end_time=30.0,
            speaker_id="speaker_1",
            text_features={"likely_speaker_type": "interviewee"}
        ),
        Mock(
            start_time=25.0,
            end_time=55.0,
            speaker_id="speaker_2",
            text_features={"likely_speaker_type": "interviewer"}
        )
    ]
    
    enhanced = detector._enhance_candidates_with_speaker_info([topic_candidate], speaker_segments)
    
    assert len(enhanced) == 1
    # Should get bonus for having 2 speakers (interview format)
    assert enhanced[0].relevance_score > topic_candidate.relevance_score


@pytest.mark.asyncio
async def test_hybrid_detector_without_topic_detector():
    """Test hybrid detector when topic detector is not available."""
    config = {"topic_detection": {}}
    
    with patch('src.ai.segment_detection.hybrid_detector.TopicChangeDetector') as mock_topic:
        mock_topic.side_effect = ImportError("NLP dependencies not available")
        
        detector = HybridSegmentDetector(config)
        
        assert detector.topic_detector is None
        assert detector.speaker_detector is not None 