"""
Main clip detection service that integrates transcription, sentiment analysis,
entity recognition, and segment detection.
"""
import logging
import time
import os
from typing import List, Dict, Any, Optional
import asyncio

from .models import (
    ClipDetectionRequest, ClipDetectionResponse, ClipAnalysisResult,
    ClipMetadata, ClipRanking
)
from src.services.transcription import TranscriptionService
from src.ai.sentiment import OpenAISentimentAnalyzer, TransformersSentimentAnalyzer
from src.ai.entity_recognition import OpenAIEntityRecognizer, SpacyEntityRecognizer
from src.ai.segment_detection import TopicChangeDetector
from src.ai.segment_detection.models import ClipCandidate

logger = logging.getLogger(__name__)


class ClipDetectionService:
    """Service for detecting and analyzing video clips."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the clip detection service.
        
        Args:
            config: Configuration parameters.
        """
        self.config = config or {}
        
        # Initialize services
        self.transcription_service = TranscriptionService()
        
        # Initialize AI components
        self._initialize_ai_components()
    
    def _initialize_ai_components(self):
        """Initialize AI analysis components."""
        try:
            # Get OpenAI API key
            openai_api_key = os.getenv("OPENAI_API_KEY")
            
            # Initialize sentiment analyzers
            if openai_api_key:
                self.sentiment_analyzer = OpenAISentimentAnalyzer(openai_api_key)
            else:
                try:
                    self.sentiment_analyzer = TransformersSentimentAnalyzer()
                except ImportError:
                    logger.warning("No sentiment analyzer available")
                    self.sentiment_analyzer = None
            
            # Initialize entity recognizers
            if openai_api_key:
                self.entity_recognizer = OpenAIEntityRecognizer(openai_api_key)
            else:
                try:
                    self.entity_recognizer = SpacyEntityRecognizer()
                except ImportError:
                    logger.warning("No entity recognizer available")
                    self.entity_recognizer = None
            
            # Initialize segment detector
            try:
                self.segment_detector = TopicChangeDetector(self.config.get("segment_detection", {}))
            except ImportError:
                logger.warning("Segment detector not available")
                self.segment_detector = None
                
        except Exception as e:
            logger.error(f"Error initializing AI components: {e}")
            self.sentiment_analyzer = None
            self.entity_recognizer = None
            self.segment_detector = None
    
    async def detect_clips(self, request: ClipDetectionRequest) -> ClipDetectionResponse:
        """
        Detect and analyze clips in a video.
        
        Args:
            request: Clip detection request.
            
        Returns:
            Clip detection response with analyzed clips.
        """
        start_time = time.time()
        
        try:
            # Step 1: Get or create transcript
            transcript = await self.transcription_service.get_transcript(request.video_id)
            if not transcript:
                logger.info(f"No transcript found for video {request.video_id}, creating one...")
                transcription_job = await self.transcription_service.transcribe_video(
                    request.video_id
                )
                # For now, assume transcription completes immediately
                # In production, you'd poll for completion
                transcript = await self.transcription_service.get_transcript(request.video_id)
            
            if not transcript:
                raise ValueError(f"Could not get transcript for video {request.video_id}")
            
            # Step 2: Detect segments
            segmentation_result = None
            if self.segment_detector:
                segmentation_result = await self.segment_detector.detect_segments(transcript)
                
                # Extract clip candidates
                clip_candidates = await self.segment_detector.extract_clip_candidates(
                    segmentation_result,
                    min_duration=request.min_duration,
                    max_duration=request.max_duration,
                    min_relevance=request.min_relevance
                )
            else:
                # Fallback: create basic clips from transcript segments
                clip_candidates = self._create_fallback_clips(transcript, request)
            
            # Step 3: Analyze each clip candidate
            clip_analyses = []
            for candidate in clip_candidates[:request.max_clips]:
                analysis = await self._analyze_clip(candidate, transcript, request)
                if analysis:
                    clip_analyses.append(analysis)
            
            # Step 4: Rank and filter clips
            clip_analyses = self._rank_clips(clip_analyses, request)
            clip_analyses = self._filter_clips(clip_analyses, request)
            
            processing_time = time.time() - start_time
            
            # Calculate overall confidence
            if clip_analyses:
                avg_confidence = sum(clip.analysis_confidence for clip in clip_analyses) / len(clip_analyses)
            else:
                avg_confidence = 0.0
            
            return ClipDetectionResponse(
                video_id=request.video_id,
                query=request.query,
                clips=clip_analyses,
                total_clips_found=len(clip_candidates),
                processing_time=processing_time,
                confidence=avg_confidence,
                metadata={
                    "transcript_segments": len(transcript.segments),
                    "segment_detector_used": self.segment_detector is not None,
                    "sentiment_analyzer_used": self.sentiment_analyzer is not None,
                    "entity_recognizer_used": self.entity_recognizer is not None
                }
            )
            
        except Exception as e:
            logger.error(f"Error detecting clips: {e}")
            processing_time = time.time() - start_time
            
            return ClipDetectionResponse(
                video_id=request.video_id,
                query=request.query,
                clips=[],
                total_clips_found=0,
                processing_time=processing_time,
                confidence=0.0,
                metadata={"error": str(e)}
            )
    
    def _create_fallback_clips(self, transcript, request: ClipDetectionRequest) -> List[ClipCandidate]:
        """Create basic clip candidates when segment detection is not available."""
        candidates = []
        
        # Group segments into clips of appropriate duration
        current_start = 0.0
        current_segments = []
        current_duration = 0.0
        
        for i, segment in enumerate(transcript.segments):
            segment_duration = segment.end_time - segment.start_time
            
            if current_duration + segment_duration <= request.max_duration:
                current_segments.append(segment)
                current_duration += segment_duration
            else:
                # Create clip from current segments
                if current_duration >= request.min_duration and current_segments:
                    clip_text = " ".join([seg.text for seg in current_segments])
                    candidate = ClipCandidate(
                        clip_id=f"fallback_{len(candidates)}",
                        start_time=current_segments[0].start_time,
                        end_time=current_segments[-1].end_time,
                        duration=current_duration,
                        title=f"Clip {len(candidates) + 1}",
                        description=clip_text[:100] + "...",
                        relevance_score=0.5,  # Default relevance
                        quality_score=0.5,
                        keywords=[]
                    )
                    candidates.append(candidate)
                
                # Start new clip
                current_segments = [segment]
                current_duration = segment_duration
        
        # Handle last clip
        if current_duration >= request.min_duration and current_segments:
            clip_text = " ".join([seg.text for seg in current_segments])
            candidate = ClipCandidate(
                clip_id=f"fallback_{len(candidates)}",
                start_time=current_segments[0].start_time,
                end_time=current_segments[-1].end_time,
                duration=current_duration,
                title=f"Clip {len(candidates) + 1}",
                description=clip_text[:100] + "...",
                relevance_score=0.5,
                quality_score=0.5,
                keywords=[]
            )
            candidates.append(candidate)
        
        return candidates
    
    async def _analyze_clip(
        self, 
        candidate: ClipCandidate, 
        transcript, 
        request: ClipDetectionRequest
    ) -> Optional[ClipAnalysisResult]:
        """Analyze a clip candidate with sentiment, entities, etc."""
        try:
            # Get transcript segments for this clip
            clip_segments = [
                segment for segment in transcript.segments
                if (segment.start_time >= candidate.start_time and 
                    segment.end_time <= candidate.end_time)
            ]
            
            if not clip_segments:
                return None
            
            # Combine text from segments
            clip_text = " ".join([segment.text for segment in clip_segments])
            
            # Run analyses in parallel
            analyses = await asyncio.gather(
                self._analyze_sentiment(clip_text) if self.sentiment_analyzer else None,
                self._analyze_entities(clip_text) if self.entity_recognizer else None,
                return_exceptions=True
            )
            
            sentiment_analysis = analyses[0] if not isinstance(analyses[0], Exception) else None
            entity_analysis = analyses[1] if not isinstance(analyses[1], Exception) else None
            
            # Create metadata
            metadata = ClipMetadata(
                title=candidate.title or f"Clip at {candidate.start_time:.1f}s",
                description=candidate.description or clip_text[:200] + "...",
                keywords=candidate.keywords,
                entities=[entity.text for entity in entity_analysis.entities] if entity_analysis else [],
                sentiment=sentiment_analysis.sentiment.label.value if sentiment_analysis else None,
                emotion=sentiment_analysis.emotions.primary_emotion.value if sentiment_analysis and sentiment_analysis.emotions else None
            )
            
            # Create ranking
            ranking = self._calculate_ranking(candidate, sentiment_analysis, entity_analysis, request)
            
            # Calculate overall confidence
            confidence_factors = []
            if sentiment_analysis:
                confidence_factors.append(sentiment_analysis.sentiment.confidence)
            if entity_analysis:
                confidence_factors.append(entity_analysis.confidence)
            confidence_factors.append(candidate.relevance_score)
            
            analysis_confidence = sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.5
            
            return ClipAnalysisResult(
                clip_id=candidate.clip_id,
                video_id=transcript.video_id,
                start_time=candidate.start_time,
                end_time=candidate.end_time,
                duration=candidate.duration,
                metadata=metadata,
                ranking=ranking,
                sentiment_analysis=sentiment_analysis,
                entity_analysis=entity_analysis,
                topic_segments=candidate.topic_segments,
                candidate=candidate,
                analysis_confidence=analysis_confidence
            )
            
        except Exception as e:
            logger.error(f"Error analyzing clip {candidate.clip_id}: {e}")
            return None
    
    async def _analyze_sentiment(self, text: str):
        """Analyze sentiment of text."""
        if not self.sentiment_analyzer:
            return None
        
        try:
            # Create a mock segment for analysis
            from src.services.transcription.models import TranscriptSegment
            segment = TranscriptSegment(
                start_time=0.0,
                end_time=1.0,
                text=text
            )
            return await self.sentiment_analyzer.analyze_segment(segment)
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return None
    
    async def _analyze_entities(self, text: str):
        """Analyze entities in text."""
        if not self.entity_recognizer:
            return None
        
        try:
            # Create a mock segment for analysis
            from src.services.transcription.models import TranscriptSegment
            segment = TranscriptSegment(
                start_time=0.0,
                end_time=1.0,
                text=text
            )
            return await self.entity_recognizer.extract_from_segment(segment)
        except Exception as e:
            logger.error(f"Error in entity analysis: {e}")
            return None
    
    def _calculate_ranking(self, candidate, sentiment_analysis, entity_analysis, request) -> ClipRanking:
        """Calculate ranking scores for a clip."""
        # Base scores from candidate
        relevance_score = candidate.relevance_score
        quality_score = candidate.quality_score
        
        # Sentiment scoring
        sentiment_score = 0.5
        if sentiment_analysis:
            sentiment_score = sentiment_analysis.sentiment.confidence
            # Boost score for target sentiment
            if (request.target_sentiment and 
                sentiment_analysis.sentiment.label.value == request.target_sentiment):
                sentiment_score = min(1.0, sentiment_score + 0.2)
        
        # Entity scoring
        entity_score = 0.5
        if entity_analysis:
            entity_score = entity_analysis.confidence
            # Boost score for required entities
            if request.required_entities:
                entity_texts = [entity.text.lower() for entity in entity_analysis.entities]
                matches = sum(1 for req_entity in request.required_entities 
                            if any(req_entity.lower() in entity_text for entity_text in entity_texts))
                entity_bonus = (matches / len(request.required_entities)) * 0.3
                entity_score = min(1.0, entity_score + entity_bonus)
        
        # Coherence score (from topic segmentation)
        coherence_score = 0.8  # Default value
        if candidate.topic_segments:
            coherence_scores = [segment.coherence_score for segment in candidate.topic_segments]
            coherence_score = sum(coherence_scores) / len(coherence_scores)
        
        # Uniqueness score (placeholder - could be improved with similarity comparison)
        uniqueness_score = 0.7
        
        # Calculate overall score
        weights = {
            'relevance': 0.3,
            'quality': 0.2,
            'sentiment': 0.15,
            'entity': 0.15,
            'coherence': 0.1,
            'uniqueness': 0.1
        }
        
        overall_score = (
            weights['relevance'] * relevance_score +
            weights['quality'] * quality_score +
            weights['sentiment'] * sentiment_score +
            weights['entity'] * entity_score +
            weights['coherence'] * coherence_score +
            weights['uniqueness'] * uniqueness_score
        )
        
        return ClipRanking(
            overall_score=overall_score,
            relevance_score=relevance_score,
            quality_score=quality_score,
            sentiment_score=sentiment_score,
            entity_score=entity_score,
            coherence_score=coherence_score,
            uniqueness_score=uniqueness_score,
            ranking_factors=weights
        )
    
    def _rank_clips(self, clips: List[ClipAnalysisResult], request: ClipDetectionRequest) -> List[ClipAnalysisResult]:
        """Rank clips by their overall scores."""
        return sorted(clips, key=lambda clip: clip.ranking.overall_score, reverse=True)
    
    def _filter_clips(self, clips: List[ClipAnalysisResult], request: ClipDetectionRequest) -> List[ClipAnalysisResult]:
        """Filter clips based on request criteria."""
        filtered = []
        
        for clip in clips:
            # Check required keywords
            if request.required_keywords:
                clip_keywords = [kw.lower() for kw in clip.metadata.keywords]
                clip_text = clip.metadata.description.lower()
                
                has_required_keywords = any(
                    keyword.lower() in clip_text or keyword.lower() in clip_keywords
                    for keyword in request.required_keywords
                )
                
                if not has_required_keywords:
                    continue
            
            # Check required entities
            if request.required_entities:
                clip_entities = [entity.lower() for entity in clip.metadata.entities]
                
                has_required_entities = any(
                    any(req_entity.lower() in entity for entity in clip_entities)
                    for req_entity in request.required_entities
                )
                
                if not has_required_entities:
                    continue
            
            # Check target sentiment
            if (request.target_sentiment and clip.metadata.sentiment and 
                clip.metadata.sentiment != request.target_sentiment):
                continue
            
            filtered.append(clip)
        
        return filtered 