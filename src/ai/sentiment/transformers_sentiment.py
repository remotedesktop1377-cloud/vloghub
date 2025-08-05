"""
Transformers-based sentiment analyzer using pre-trained models.
"""
import logging
from typing import Dict, Any, Optional, List
import numpy as np

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    from sentence_transformers import SentenceTransformer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

from .base import BaseSentimentAnalyzer
from .models import SentimentResult, SentimentLabel, EmotionResult, EmotionLabel

logger = logging.getLogger(__name__)


class TransformersSentimentAnalyzer(BaseSentimentAnalyzer):
    """Transformers-based sentiment analyzer."""
    
    def __init__(self, 
                 sentiment_model: str = "cardiffnlp/twitter-roberta-base-sentiment-latest",
                 emotion_model: str = "j-hartmann/emotion-english-distilroberta-base",
                 config: Optional[Dict[str, Any]] = None):
        """
        Initialize the transformers sentiment analyzer.
        
        Args:
            sentiment_model: HuggingFace model for sentiment analysis.
            emotion_model: HuggingFace model for emotion analysis.
            config: Additional configuration parameters.
        """
        super().__init__(config)
        
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError("transformers and sentence-transformers packages are required")
        
        self.sentiment_model_name = sentiment_model
        self.emotion_model_name = emotion_model
        
        # Initialize models
        try:
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=sentiment_model,
                tokenizer=sentiment_model,
                return_all_scores=True
            )
            
            self.emotion_pipeline = pipeline(
                "text-classification",
                model=emotion_model,
                tokenizer=emotion_model,
                return_all_scores=True
            )
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    async def analyze_text(self, text: str) -> SentimentResult:
        """
        Analyze sentiment of text using transformers.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Sentiment analysis result.
        """
        try:
            # Truncate text if too long
            max_length = 512
            if len(text) > max_length:
                text = text[:max_length]
            
            results = self.sentiment_pipeline(text)
            
            # Convert results to our format
            scores = {}
            max_score = 0.0
            best_label = SentimentLabel.NEUTRAL
            
            for result in results[0]:  # pipeline returns list of lists
                label_map = {
                    "LABEL_0": "negative",
                    "LABEL_1": "neutral", 
                    "LABEL_2": "positive",
                    "NEGATIVE": "negative",
                    "NEUTRAL": "neutral",
                    "POSITIVE": "positive"
                }
                
                mapped_label = label_map.get(result["label"].upper(), result["label"].lower())
                score = result["score"]
                scores[mapped_label] = score
                
                if score > max_score:
                    max_score = score
                    try:
                        best_label = SentimentLabel(mapped_label)
                    except ValueError:
                        best_label = SentimentLabel.NEUTRAL
            
            return SentimentResult(
                label=best_label,
                confidence=max_score,
                scores=scores,
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
        Analyze emotions in text using transformers.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Emotion analysis result.
        """
        try:
            # Truncate text if too long
            max_length = 512
            if len(text) > max_length:
                text = text[:max_length]
            
            results = self.emotion_pipeline(text)
            
            # Convert results to our format
            emotions = {}
            max_score = 0.0
            primary_emotion = EmotionLabel.FORMAL
            
            # Map model labels to our emotion labels
            emotion_map = {
                "sadness": EmotionLabel.SADNESS,
                "joy": EmotionLabel.JOY,
                "love": EmotionLabel.JOY,
                "anger": EmotionLabel.ANGER,
                "fear": EmotionLabel.FEAR,
                "surprise": EmotionLabel.SURPRISE,
                "disgust": EmotionLabel.DISGUST
            }
            
            for result in results[0]:  # pipeline returns list of lists
                emotion_name = result["label"].lower()
                score = result["score"]
                
                # Map to our emotion labels
                emotion_label = emotion_map.get(emotion_name)
                if emotion_label:
                    emotions[emotion_label] = score
                    
                    if score > max_score:
                        max_score = score
                        primary_emotion = emotion_label
            
            # Add default emotions if not present
            for emotion in EmotionLabel:
                if emotion not in emotions:
                    emotions[emotion] = 0.0
            
            return EmotionResult(
                emotions=emotions,
                primary_emotion=primary_emotion,
                confidence=max_score,
                text=text
            )
            
        except Exception as e:
            logger.error(f"Error analyzing emotions: {e}")
            # Return neutral emotion result as fallback
            return EmotionResult(
                emotions={emotion: 0.1 for emotion in EmotionLabel},
                primary_emotion=EmotionLabel.FORMAL,
                confidence=0.0,
                text=text
            ) 