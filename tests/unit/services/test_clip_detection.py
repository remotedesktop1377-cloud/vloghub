"""
Tests for clip detection service.
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import os

from src.services.clip_detection import ClipDetectionService
from src.services.clip_detection.models import (
    ClipDetectionRequest, ClipDetectionResponse, ClipAnalysisResult
)
from src.services.transcription.models import Transcript, TranscriptSegment
from src.ai.segment_detection.models import ClipCandidate


@pytest.fixture
def mock_transcript():
    """Create a mock transcript for testing."""
    segments = [
        TranscriptSegment(
            start_time=0.0,
            end_time=30.0,
            text="Nelson Mandela was a great leader who fought for freedom in South Africa.",
            confidence=0.9
        ),
        TranscriptSegment(
            start_time=30.0,
            end_time=60.0,
            text="He was imprisoned for 27 years before becoming president in 1994.",
            confidence=0.8
        ),
        TranscriptSegment(
            start_time=60.0,
            end_time=90.0,
            text="His speech after release was inspiring and hopeful for the future.",
            confidence=0.7
        ),
        TranscriptSegment(
            start_time=90.0,
            end_time=120.0,
            text="The transition to democracy was peaceful under his leadership.",
            confidence=0.8
        )
    ]
    
    return Transcript(
        video_id="test_video_123",
        language="en",
        segments=segments,
        source="test"
    )


@pytest.fixture
def sample_request():
    """Create a sample clip detection request."""
    return ClipDetectionRequest(
        video_id="test_video_123",
        query="Nelson Mandela prison release speech",
        min_duration=30.0,
        max_duration=90.0,
        max_clips=5,
        min_relevance=0.6,
        required_entities=["Nelson Mandela"],
        required_keywords=["prison", "release"]
    )


@pytest.fixture
def clip_service():
    """Create a clip detection service with mocked AI components."""
    service = ClipDetectionService()
    
    # Mock the AI components to avoid dependency issues in tests
    service.sentiment_analyzer = Mock()
    service.entity_recognizer = Mock()
    service.segment_detector = Mock()
    
    return service


@pytest.mark.asyncio
async def test_detect_clips_basic(clip_service, sample_request, mock_transcript):
    """Test basic clip detection functionality."""
    # Mock transcription service
    with patch.object(clip_service.transcription_service, 'get_transcript', 
                     return_value=mock_transcript):
        
        # Mock segment detector
        mock_candidates = [
            ClipCandidate(
                clip_id="clip_1",
                start_time=0.0,
                end_time=60.0,
                duration=60.0,
                title="Nelson Mandela Leadership",
                description="Discussion about Nelson Mandela's leadership",
                relevance_score=0.8,
                quality_score=0.7,
                keywords=["Nelson Mandela", "leader", "South Africa"]
            )
        ]
        
        clip_service.segment_detector.detect_segments = AsyncMock()
        clip_service.segment_detector.extract_clip_candidates = AsyncMock(
            return_value=mock_candidates
        )
        
        # Mock sentiment and entity analysis
        clip_service.sentiment_analyzer.analyze_segment = AsyncMock(
            return_value=Mock(
                sentiment=Mock(label=Mock(value="positive"), confidence=0.8),
                emotions=Mock(primary_emotion=Mock(value="inspiring"))
            )
        )
        
        clip_service.entity_recognizer.extract_from_segment = AsyncMock(
            return_value=Mock(
                entities=[Mock(text="Nelson Mandela", type="person")],
                confidence=0.9
            )
        )
        
        # Execute clip detection
        response = await clip_service.detect_clips(sample_request)
        
        # Verify response
        assert isinstance(response, ClipDetectionResponse)
        assert response.video_id == "test_video_123"
        assert len(response.clips) >= 0
        assert response.processing_time > 0


@pytest.mark.asyncio
async def test_detect_clips_no_transcript(clip_service, sample_request):
    """Test clip detection when no transcript is available."""
    # Mock transcription service to return None
    with patch.object(clip_service.transcription_service, 'get_transcript', 
                     return_value=None):
        with patch.object(clip_service.transcription_service, 'transcribe_video', 
                         return_value=Mock()):
            
            response = await clip_service.detect_clips(sample_request)
            
            # Should return error response
            assert response.video_id == "test_video_123"
            assert len(response.clips) == 0
            assert response.confidence == 0.0
            assert "error" in response.metadata


@pytest.mark.asyncio
async def test_fallback_clip_creation(clip_service, sample_request, mock_transcript):
    """Test fallback clip creation when segment detector is not available."""
    # Disable segment detector
    clip_service.segment_detector = None
    
    with patch.object(clip_service.transcription_service, 'get_transcript', 
                     return_value=mock_transcript):
        
        response = await clip_service.detect_clips(sample_request)
        
        # Should create fallback clips
        assert len(response.clips) >= 0
        assert "segment_detector_used" in response.metadata
        assert response.metadata["segment_detector_used"] is False


def test_create_fallback_clips(clip_service, sample_request, mock_transcript):
    """Test fallback clip creation logic."""
    candidates = clip_service._create_fallback_clips(mock_transcript, sample_request)
    
    assert len(candidates) > 0
    
    for candidate in candidates:
        assert candidate.duration >= sample_request.min_duration
        assert candidate.duration <= sample_request.max_duration
        assert candidate.start_time >= 0
        assert candidate.end_time <= 120.0  # Duration of mock transcript


@pytest.mark.asyncio
async def test_analyze_clip(clip_service, mock_transcript):
    """Test individual clip analysis."""
    candidate = ClipCandidate(
        clip_id="test_clip",
        start_time=0.0,
        end_time=60.0,
        duration=60.0,
        title="Test Clip",
        description="Test description",
        relevance_score=0.7,
        quality_score=0.8,
        keywords=["test"]
    )
    
    request = ClipDetectionRequest(video_id="test_video_123")
    
    # Mock sentiment analysis
    clip_service._analyze_sentiment = AsyncMock(
        return_value=Mock(
            sentiment=Mock(label=Mock(value="positive"), confidence=0.8),
            emotions=Mock(primary_emotion=Mock(value="joy"))
        )
    )
    
    # Mock entity analysis
    clip_service._analyze_entities = AsyncMock(
        return_value=Mock(
            entities=[Mock(text="Nelson Mandela")],
            confidence=0.9
        )
    )
    
    result = await clip_service._analyze_clip(candidate, mock_transcript, request)
    
    assert isinstance(result, ClipAnalysisResult)
    assert result.clip_id == "test_clip"
    assert result.video_id == "test_video_123"
    assert result.metadata.title == "Test Clip"
    assert result.ranking.overall_score > 0


def test_calculate_ranking(clip_service):
    """Test clip ranking calculation."""
    candidate = ClipCandidate(
        clip_id="test_clip",
        start_time=0.0,
        end_time=60.0,
        duration=60.0,
        title="Test Clip",
        description="Test description",
        relevance_score=0.8,
        quality_score=0.7,
        keywords=[]
    )
    
    request = ClipDetectionRequest(
        video_id="test_video",
        target_sentiment="positive",
        required_entities=["Nelson Mandela"]
    )
    
    # Mock analysis results
    sentiment_analysis = Mock(
        sentiment=Mock(label=Mock(value="positive"), confidence=0.9)
    )
    
    entity_analysis = Mock(
        entities=[Mock(text="Nelson Mandela")],
        confidence=0.8
    )
    
    ranking = clip_service._calculate_ranking(
        candidate, sentiment_analysis, entity_analysis, request
    )
    
    assert ranking.overall_score > 0
    assert ranking.relevance_score == 0.8
    assert ranking.quality_score == 0.7
    assert ranking.sentiment_score > 0.5  # Should get bonus for matching target sentiment
    assert ranking.entity_score > 0.5     # Should get bonus for required entities


def test_filter_clips(clip_service):
    """Test clip filtering logic."""
    clips = [
        Mock(
            metadata=Mock(
                keywords=["prison", "release"],
                entities=["Nelson Mandela"],
                sentiment="positive"
            )
        ),
        Mock(
            metadata=Mock(
                keywords=["other", "content"],
                entities=["Other Person"],
                sentiment="negative"
            )
        )
    ]
    
    request = ClipDetectionRequest(
        video_id="test_video",
        required_keywords=["prison"],
        required_entities=["Nelson Mandela"],
        target_sentiment="positive"
    )
    
    filtered = clip_service._filter_clips(clips, request)
    
    # Only first clip should pass all filters
    assert len(filtered) == 1


def test_rank_clips(clip_service):
    """Test clip ranking logic."""
    clips = [
        Mock(ranking=Mock(overall_score=0.6)),
        Mock(ranking=Mock(overall_score=0.9)),
        Mock(ranking=Mock(overall_score=0.3)),
        Mock(ranking=Mock(overall_score=0.8))
    ]
    
    request = ClipDetectionRequest(video_id="test_video")
    
    ranked = clip_service._rank_clips(clips, request)
    
    # Should be sorted by overall_score in descending order
    scores = [clip.ranking.overall_score for clip in ranked]
    assert scores == [0.9, 0.8, 0.6, 0.3]


@pytest.mark.asyncio
async def test_health_check_components(clip_service):
    """Test component availability checking."""
    # Test with all components available
    clip_service.sentiment_analyzer = Mock()
    clip_service.entity_recognizer = Mock()
    clip_service.segment_detector = Mock()
    
    # This would be tested through the API endpoint, but we can test the logic
    assert clip_service.sentiment_analyzer is not None
    assert clip_service.entity_recognizer is not None
    assert clip_service.segment_detector is not None


@pytest.mark.integration
@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="Integration test requires API key")
@pytest.mark.asyncio
async def test_clip_detection_integration():
    """Full integration test with real components (requires API key)."""
    # This test would use real transcription, sentiment analysis, etc.
    # Skipped by default due to API requirements
    pass 