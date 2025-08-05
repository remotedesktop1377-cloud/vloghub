"""
OpenAI-based sentiment analyzer.
"""
import json
import logging
from typing import Dict, Any, Optional

from openai import AsyncOpenAI

from .base import BaseSentimentAnalyzer
from .models import SentimentResult, SentimentLabel, EmotionResult, EmotionLabel

logger = logging.getLogger(__name__)


class OpenAISentimentAnalyzer(BaseSentimentAnalyzer):
    """OpenAI-based sentiment analyzer."""
    
    def __init__(self, api_key: str, model: str = "gpt-4", config: Optional[Dict[str, Any]] = None):
        """
        Initialize the OpenAI sentiment analyzer.
        
        Args:
            api_key: OpenAI API key.
            model: OpenAI model to use.
            config: Additional configuration parameters.
        """
        super().__init__(config)
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
    
    async def analyze_text(self, text: str) -> SentimentResult:
        """
        Analyze sentiment of text using OpenAI.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Sentiment analysis result.
        """
        system_prompt = """
        You are an expert sentiment analyzer. Analyze the sentiment of the given text.
        Classify it as positive, negative, or neutral with a confidence score.
        Return the result as JSON with this structure:
        {
            "label": "positive|negative|neutral",
            "confidence": float between 0 and 1,
            "scores": {
                "positive": float,
                "negative": float,
                "neutral": float
            },
            "reasoning": "brief explanation"
        }
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze the sentiment of this text: {text}"}
                ]
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return SentimentResult(
                label=SentimentLabel(result["label"]),
                confidence=result["confidence"],
                scores=result.get("scores", {}),
                text=text
            )
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            # Return neutral with low confidence as fallback
            return SentimentResult(
                label=SentimentLabel.NEUTRAL,
                confidence=0.0,
                scores={"positive": 0.33, "negative": 0.33, "neutral": 0.34},
                text=text
            )
    
    async def analyze_emotions(self, text: str) -> EmotionResult:
        """
        Analyze emotions in text using OpenAI.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Emotion analysis result.
        """
        system_prompt = """
        You are an expert emotion analyzer. Analyze the emotions present in the given text.
        Consider emotions like joy, sadness, anger, fear, surprise, disgust, hope, inspiring, formal, casual.
        Return the result as JSON with this structure:
        {
            "emotions": {
                "joy": float between 0 and 1,
                "sadness": float between 0 and 1,
                "anger": float between 0 and 1,
                "fear": float between 0 and 1,
                "surprise": float between 0 and 1,
                "disgust": float between 0 and 1,
                "hope": float between 0 and 1,
                "inspiring": float between 0 and 1,
                "formal": float between 0 and 1,
                "casual": float between 0 and 1
            },
            "primary_emotion": "name of strongest emotion",
            "confidence": float between 0 and 1
        }
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze the emotions in this text: {text}"}
                ]
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return EmotionResult(
                emotions={EmotionLabel(k): v for k, v in result["emotions"].items() if k in EmotionLabel.__members__.values()},
                primary_emotion=EmotionLabel(result["primary_emotion"]),
                confidence=result["confidence"],
                text=text
            )
            
        except Exception as e:
            logger.error(f"Error analyzing emotions: {e}")
            # Return neutral emotion result as fallback
            return EmotionResult(
                emotions={EmotionLabel.NEUTRAL: 1.0},
                primary_emotion=EmotionLabel.FORMAL,
                confidence=0.0,
                text=text
            ) 