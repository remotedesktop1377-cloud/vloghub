"""
Topic change detector using NLP techniques.
"""
import logging
import time
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict, Counter

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.feature_extraction.text import TfidfVectorizer
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize, sent_tokenize
    NLP_AVAILABLE = True
except ImportError:
    NLP_AVAILABLE = False

from .base import BaseSegmentDetector
from .models import (
    SegmentationResult, TopicSegment, SegmentBoundary, 
    BoundaryType, SegmentType
)
from src.services.transcription.models import Transcript, TranscriptSegment

logger = logging.getLogger(__name__)


class TopicChangeDetector(BaseSegmentDetector):
    """Detector for topic changes using semantic similarity and keyword analysis."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the topic change detector.
        
        Args:
            config: Configuration parameters for the detector.
        """
        super().__init__(config)
        
        if not NLP_AVAILABLE:
            raise ImportError("Required NLP packages not available")
        
        # Configuration
        self.window_size = self.config.get("window_size", 5)  # Number of segments to consider
        self.similarity_threshold = self.config.get("similarity_threshold", 0.7)
        self.min_topic_duration = self.config.get("min_topic_duration", 30.0)
        
        # Initialize models
        self.sentence_model = None
        self.tfidf_vectorizer = None
        self._initialize_models()
        
        # Download NLTK data if needed
        self._ensure_nltk_data()
    
    def _initialize_models(self):
        """Initialize NLP models."""
        try:
            # Load sentence transformer model
            model_name = self.config.get("sentence_model", "all-MiniLM-L6-v2")
            self.sentence_model = SentenceTransformer(model_name)
            
            # Initialize TF-IDF vectorizer
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                ngram_range=(1, 2)
            )
            
        except Exception as e:
            logger.error(f"Error initializing NLP models: {e}")
            raise
    
    def _ensure_nltk_data(self):
        """Ensure required NLTK data is downloaded."""
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            try:
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
            except Exception as e:
                logger.warning(f"Could not download NLTK data: {e}")
    
    async def detect_segments(self, transcript: Transcript) -> SegmentationResult:
        """
        Detect topic segments in a transcript.
        
        Args:
            transcript: Transcript to analyze.
            
        Returns:
            Segmentation result with topic boundaries and segments.
        """
        start_time = time.time()
        
        if not transcript.segments:
            return SegmentationResult(
                video_id=transcript.video_id,
                total_duration=0.0,
                boundaries=[],
                overall_confidence=0.0
            )
        
        # Extract text from segments
        texts = [segment.text for segment in transcript.segments]
        
        # Calculate semantic similarities
        similarities = await self._calculate_semantic_similarities(texts)
        
        # Calculate keyword-based similarities
        keyword_similarities = await self._calculate_keyword_similarities(texts)
        
        # Combine similarities
        combined_similarities = self._combine_similarities(similarities, keyword_similarities)
        
        # Detect boundaries
        boundaries = self._detect_topic_boundaries(transcript.segments, combined_similarities)
        
        # Create topic segments
        topic_segments = await self._create_topic_segments(transcript.segments, boundaries)
        
        # Filter and merge segments
        topic_segments = self.filter_short_segments(topic_segments)
        topic_segments = self.merge_segments(topic_segments, max_gap=10.0)
        
        processing_time = time.time() - start_time
        total_duration = transcript.segments[-1].end_time if transcript.segments else 0.0
        
        return SegmentationResult(
            video_id=transcript.video_id,
            total_duration=total_duration,
            boundaries=boundaries,
            topic_segments=topic_segments,
            overall_confidence=self._calculate_overall_confidence(boundaries),
            processing_time=processing_time,
            algorithm_info={
                "detector_type": "topic_change",
                "similarity_threshold": self.similarity_threshold,
                "window_size": self.window_size
            }
        )
    
    async def _calculate_semantic_similarities(self, texts: List[str]) -> List[float]:
        """Calculate semantic similarities between adjacent text segments."""
        if not texts or len(texts) < 2:
            return []
        
        try:
            # Generate embeddings
            embeddings = self.sentence_model.encode(texts)
            
            # Calculate similarities between adjacent segments
            similarities = []
            for i in range(len(embeddings) - 1):
                # Calculate similarity in a sliding window
                window_start = max(0, i - self.window_size // 2)
                window_end = min(len(embeddings), i + self.window_size // 2 + 2)
                
                window_embeddings = embeddings[window_start:window_end]
                window_similarities = cosine_similarity(window_embeddings)
                
                # Average similarity for this position
                local_idx = i - window_start
                if local_idx < len(window_similarities) - 1:
                    similarity = window_similarities[local_idx][local_idx + 1]
                else:
                    similarity = 0.5
                
                similarities.append(float(similarity))
            
            return similarities
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarities: {e}")
            return [0.5] * (len(texts) - 1)
    
    async def _calculate_keyword_similarities(self, texts: List[str]) -> List[float]:
        """Calculate keyword-based similarities using TF-IDF."""
        if not texts or len(texts) < 2:
            return []
        
        try:
            # Fit TF-IDF on all texts
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
            
            # Calculate similarities between adjacent segments
            similarities = []
            for i in range(len(texts) - 1):
                similarity = cosine_similarity(
                    tfidf_matrix[i:i+1], 
                    tfidf_matrix[i+1:i+2]
                )[0][0]
                similarities.append(float(similarity))
            
            return similarities
            
        except Exception as e:
            logger.error(f"Error calculating keyword similarities: {e}")
            return [0.5] * (len(texts) - 1)
    
    def _combine_similarities(self, semantic: List[float], keyword: List[float]) -> List[float]:
        """Combine semantic and keyword similarities."""
        if not semantic or not keyword:
            return semantic or keyword or []
        
        # Weighted combination
        semantic_weight = self.config.get("semantic_weight", 0.7)
        keyword_weight = 1.0 - semantic_weight
        
        combined = []
        for sem, kw in zip(semantic, keyword):
            combined_sim = semantic_weight * sem + keyword_weight * kw
            combined.append(combined_sim)
        
        return combined
    
    def _detect_topic_boundaries(
        self, 
        segments: List[TranscriptSegment], 
        similarities: List[float]
    ) -> List[SegmentBoundary]:
        """Detect topic boundaries based on similarity drops."""
        boundaries = []
        
        if not similarities or len(similarities) < 2:
            return boundaries
        
        # Find local minima in similarities (topic boundaries)
        for i in range(1, len(similarities) - 1):
            current_sim = similarities[i]
            prev_sim = similarities[i - 1]
            next_sim = similarities[i + 1]
            
            # Check if this is a local minimum below threshold
            if (current_sim < prev_sim and current_sim < next_sim and 
                current_sim < self.similarity_threshold):
                
                # Determine boundary type based on how low the similarity is
                if current_sim < 0.3:
                    boundary_type = BoundaryType.HARD
                elif current_sim < 0.5:
                    boundary_type = BoundaryType.SOFT
                else:
                    boundary_type = BoundaryType.UNCERTAIN
                
                # Get timestamp from the segment boundary
                timestamp = segments[i + 1].start_time
                confidence = 1.0 - current_sim  # Lower similarity = higher confidence in boundary
                
                boundary = SegmentBoundary(
                    timestamp=timestamp,
                    boundary_type=boundary_type,
                    confidence=confidence,
                    segment_type=SegmentType.TOPIC,
                    description=f"Topic change detected (similarity: {current_sim:.3f})"
                )
                boundaries.append(boundary)
        
        return boundaries
    
    async def _create_topic_segments(
        self, 
        segments: List[TranscriptSegment], 
        boundaries: List[SegmentBoundary]
    ) -> List[TopicSegment]:
        """Create topic segments based on detected boundaries."""
        topic_segments = []
        
        if not segments:
            return topic_segments
        
        # Add start and end boundaries
        boundary_times = [0.0] + [b.timestamp for b in boundaries] + [segments[-1].end_time]
        
        # Create segments between boundaries
        for i in range(len(boundary_times) - 1):
            start_time = boundary_times[i]
            end_time = boundary_times[i + 1]
            
            # Find segments within this time range
            segment_texts = []
            for segment in segments:
                if (segment.start_time >= start_time and 
                    segment.end_time <= end_time):
                    segment_texts.append(segment.text)
            
            if segment_texts:
                # Combine text and analyze
                combined_text = " ".join(segment_texts)
                
                # Extract keywords and topic summary
                keywords = await self._extract_keywords(combined_text)
                topic_summary = await self._generate_topic_summary(combined_text, keywords)
                coherence_score = await self._calculate_coherence_score(segment_texts)
                
                topic_segment = TopicSegment(
                    start_time=start_time,
                    end_time=end_time,
                    topic_summary=topic_summary,
                    keywords=keywords,
                    coherence_score=coherence_score,
                    entities=[],  # Will be filled by entity recognition
                    metadata={
                        "segment_count": len(segment_texts),
                        "word_count": len(combined_text.split())
                    }
                )
                topic_segments.append(topic_segment)
        
        return topic_segments
    
    async def _extract_keywords(self, text: str, top_k: int = 10) -> List[str]:
        """Extract keywords from text using TF-IDF."""
        try:
            # Simple keyword extraction using word frequency
            words = word_tokenize(text.lower())
            stop_words = set(stopwords.words('english'))
            words = [w for w in words if w.isalpha() and w not in stop_words]
            
            # Count word frequencies
            word_counts = Counter(words)
            
            # Get top keywords
            keywords = [word for word, count in word_counts.most_common(top_k)]
            return keywords
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []
    
    async def _generate_topic_summary(self, text: str, keywords: List[str]) -> str:
        """Generate a topic summary from text and keywords."""
        # Simple summary using first sentence and top keywords
        try:
            sentences = sent_tokenize(text)
            first_sentence = sentences[0] if sentences else ""
            
            # Create summary with keywords
            top_keywords = ", ".join(keywords[:5])
            summary = f"{first_sentence[:100]}..." if len(first_sentence) > 100 else first_sentence
            
            if top_keywords:
                summary += f" (Keywords: {top_keywords})"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating topic summary: {e}")
            return "Topic summary unavailable"
    
    async def _calculate_coherence_score(self, segment_texts: List[str]) -> float:
        """Calculate coherence score for a group of segments."""
        if not segment_texts or len(segment_texts) < 2:
            return 1.0
        
        try:
            # Calculate average pairwise similarity
            embeddings = self.sentence_model.encode(segment_texts)
            similarities = cosine_similarity(embeddings)
            
            # Calculate average similarity (excluding diagonal)
            total_similarity = 0.0
            count = 0
            
            for i in range(len(similarities)):
                for j in range(i + 1, len(similarities)):
                    total_similarity += similarities[i][j]
                    count += 1
            
            return total_similarity / count if count > 0 else 0.5
            
        except Exception as e:
            logger.error(f"Error calculating coherence score: {e}")
            return 0.5
    
    def _calculate_overall_confidence(self, boundaries: List[SegmentBoundary]) -> float:
        """Calculate overall confidence in the segmentation."""
        if not boundaries:
            return 0.0
        
        total_confidence = sum(b.confidence for b in boundaries)
        return total_confidence / len(boundaries) 