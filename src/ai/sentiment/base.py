"""
Base class for sentiment analyzers.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from .models import SentimentResult, EmotionResult, SegmentSentiment
from src.services.transcription.models import TranscriptSegment, Transcript


class BaseSentimentAnalyzer(ABC):
    """Base class for sentiment analysis implementations."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the sentiment analyzer.
        
        Args:
            config: Configuration parameters for the analyzer.
        """
        self.config = config or {}
    
    @abstractmethod
    async def analyze_text(self, text: str) -> SentimentResult:
        """
        Analyze sentiment of a single text.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Sentiment analysis result.
        """
        pass
    
    @abstractmethod
    async def analyze_emotions(self, text: str) -> EmotionResult:
        """
        Analyze emotions in a single text.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Emotion analysis result.
        """
        pass
    
    async def analyze_segment(self, segment: TranscriptSegment) -> SegmentSentiment:
        """
        Analyze sentiment for a transcript segment.
        
        Args:
            segment: Transcript segment to analyze.
            
        Returns:
            Segment sentiment analysis.
        """
        sentiment = await self.analyze_text(segment.text)
        emotions = await self.analyze_emotions(segment.text)
        
        return SegmentSentiment(
            segment_id=f"{segment.start_time}_{segment.end_time}",
            start_time=segment.start_time,
            end_time=segment.end_time,
            text=segment.text,
            sentiment=sentiment,
            emotions=emotions
        )
    
    async def analyze_transcript(self, transcript: Transcript) -> List[SegmentSentiment]:
        """
        Analyze sentiment for all segments in a transcript.
        
        Args:
            transcript: Transcript to analyze.
            
        Returns:
            List of segment sentiment analyses.
        """
        results = []
        for segment in transcript.segments:
            result = await self.analyze_segment(segment)
            results.append(result)
        return results
    
    async def get_overall_sentiment(self, transcript: Transcript) -> SentimentResult:
        """
        Get overall sentiment for a transcript.
        
        Args:
            transcript: Transcript to analyze.
            
        Returns:
            Overall sentiment result.
        """
        # Combine all segment texts
        full_text = " ".join([segment.text for segment in transcript.segments])
        return await self.analyze_text(full_text) 