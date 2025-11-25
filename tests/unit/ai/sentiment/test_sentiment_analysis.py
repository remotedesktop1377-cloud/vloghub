"""
Tests for sentiment analysis components.
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import os

from backend.ai.sentiment.models import SentimentResult, SentimentLabel, EmotionResult, EmotionLabel
from backend.ai.sentiment.base import BaseSentimentAnalyzer
from backend.services.transcription.models import TranscriptSegment, Transcript


class MockSentimentAnalyzer(BaseSentimentAnalyzer):
    """Mock sentiment analyzer for testing."""
    
    async def analyze_text(self, text: str) -> SentimentResult:
        # Simple mock logic
        if "happy" in text.lower() or "great" in text.lower():
            return SentimentResult(
                label=SentimentLabel.POSITIVE,
                confidence=0.9,
                scores={"positive": 0.9, "negative": 0.05, "neutral": 0.05},
                text=text
            )
        elif "sad" in text.lower() or "terrible" in text.lower():
            return SentimentResult(
                label=SentimentLabel.NEGATIVE,
                confidence=0.9,
                scores={"positive": 0.05, "negative": 0.9, "neutral": 0.05},
                text=text
            )
        else:
            return SentimentResult(
                label=SentimentLabel.NEUTRAL,
                confidence=0.8,
                scores={"positive": 0.3, "negative": 0.3, "neutral": 0.4},
                text=text
            )
    
    async def analyze_emotions(self, text: str) -> EmotionResult:
        return EmotionResult(
            emotions={EmotionLabel.JOY: 0.8, EmotionLabel.SADNESS: 0.1, EmotionLabel.FORMAL: 0.1},
            primary_emotion=EmotionLabel.JOY,
            confidence=0.8,
            text=text
        )


@pytest.fixture
def sentiment_analyzer():
    """Create a mock sentiment analyzer."""
    return MockSentimentAnalyzer()


@pytest.fixture
def sample_segment():
    """Create a sample transcript segment."""
    return TranscriptSegment(
        start_time=0.0,
        end_time=10.0,
        text="This is a great speech about hope and progress.",
        confidence=0.9
    )


@pytest.fixture
def sample_transcript():
    """Create a sample transcript."""
    segments = [
        TranscriptSegment(
            start_time=0.0,
            end_time=10.0,
            text="This is a great speech about hope and progress.",
            confidence=0.9
        ),
        TranscriptSegment(
            start_time=10.0,
            end_time=20.0,
            text="The situation is quite neutral, not particularly good or bad.",
            confidence=0.8
        ),
        TranscriptSegment(
            start_time=20.0,
            end_time=30.0,
            text="Unfortunately, this is a sad and terrible outcome.",
            confidence=0.7
        )
    ]
    
    return Transcript(
        video_id="test_video",
        language="en",
        segments=segments,
        source="test"
    )


@pytest.mark.asyncio
async def test_analyze_text_positive(sentiment_analyzer):
    """Test positive sentiment analysis."""
    text = "This is a great and happy day!"
    result = await sentiment_analyzer.analyze_text(text)
    
    assert result.label == SentimentLabel.POSITIVE
    assert result.confidence > 0.5
    assert result.text == text
    assert "positive" in result.scores


@pytest.mark.asyncio
async def test_analyze_text_negative(sentiment_analyzer):
    """Test negative sentiment analysis."""
    text = "This is a sad and terrible situation."
    result = await sentiment_analyzer.analyze_text(text)
    
    assert result.label == SentimentLabel.NEGATIVE
    assert result.confidence > 0.5
    assert result.text == text


@pytest.mark.asyncio
async def test_analyze_text_neutral(sentiment_analyzer):
    """Test neutral sentiment analysis."""
    text = "This is a neutral statement about the weather."
    result = await sentiment_analyzer.analyze_text(text)
    
    assert result.label == SentimentLabel.NEUTRAL
    assert result.confidence > 0.5
    assert result.text == text


@pytest.mark.asyncio
async def test_analyze_emotions(sentiment_analyzer):
    """Test emotion analysis."""
    text = "This is a joyful celebration!"
    result = await sentiment_analyzer.analyze_emotions(text)
    
    assert result.primary_emotion == EmotionLabel.JOY
    assert result.confidence > 0.5
    assert EmotionLabel.JOY in result.emotions
    assert result.text == text


@pytest.mark.asyncio
async def test_analyze_segment(sentiment_analyzer, sample_segment):
    """Test segment sentiment analysis."""
    result = await sentiment_analyzer.analyze_segment(sample_segment)
    
    assert result.segment_id == "0.0_10.0"
    assert result.start_time == 0.0
    assert result.end_time == 10.0
    assert result.text == sample_segment.text
    assert result.sentiment is not None
    assert result.emotions is not None


@pytest.mark.asyncio
async def test_analyze_transcript(sentiment_analyzer, sample_transcript):
    """Test transcript sentiment analysis."""
    results = await sentiment_analyzer.analyze_transcript(sample_transcript)
    
    assert len(results) == 3
    assert all(isinstance(result.sentiment, SentimentResult) for result in results)
    assert results[0].sentiment.label == SentimentLabel.POSITIVE  # "great speech"
    assert results[2].sentiment.label == SentimentLabel.NEGATIVE  # "sad and terrible"


@pytest.mark.asyncio
async def test_get_overall_sentiment(sentiment_analyzer, sample_transcript):
    """Test overall transcript sentiment."""
    result = await sentiment_analyzer.get_overall_sentiment(sample_transcript)
    
    assert isinstance(result, SentimentResult)
    assert result.label in [SentimentLabel.POSITIVE, SentimentLabel.NEGATIVE, SentimentLabel.NEUTRAL]
    assert 0.0 <= result.confidence <= 1.0


@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OpenAI API key not available")
@pytest.mark.asyncio
async def test_openai_sentiment_analyzer_integration():
    """Integration test for OpenAI sentiment analyzer (requires API key)."""
    from backend.ai.sentiment import OpenAISentimentAnalyzer
    
    analyzer = OpenAISentimentAnalyzer(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Test positive sentiment
    result = await analyzer.analyze_text("I am absolutely thrilled and delighted!")
    assert result.label == SentimentLabel.POSITIVE
    
    # Test negative sentiment
    result = await analyzer.analyze_text("I am devastated and heartbroken.")
    assert result.label == SentimentLabel.NEGATIVE


@pytest.mark.skipif(True, reason="Transformers models require large downloads")
@pytest.mark.asyncio
async def test_transformers_sentiment_analyzer():
    """Test transformers sentiment analyzer (skipped by default due to model size)."""
    from backend.ai.sentiment import TransformersSentimentAnalyzer
    
    analyzer = TransformersSentimentAnalyzer()
    
    result = await analyzer.analyze_text("This is wonderful news!")
    assert result.label in [SentimentLabel.POSITIVE, SentimentLabel.NEGATIVE, SentimentLabel.NEUTRAL]
    assert 0.0 <= result.confidence <= 1.0 