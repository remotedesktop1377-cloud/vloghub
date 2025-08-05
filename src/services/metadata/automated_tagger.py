"""
Automated tagging system that processes AI analysis results and generates tags.
"""
import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from src.models.metadata import (
    TagType, ConfidenceLevel, MetadataSource, SentimentData, EntityData,
    TagSuggestion, MetadataAnalysisResult
)
from src.services.metadata.tag_service import TagService
from src.ai.sentiment.sentiment_analyzer import SentimentAnalyzer
from src.ai.entity_recognition.entity_recognizer import EntityRecognizer
from src.services.transcription.models import Transcript

logger = logging.getLogger(__name__)


class AutomatedTagger:
    """Service for automated tag generation from AI analysis."""
    
    def __init__(self, db: Session):
        """
        Initialize automated tagger.
        
        Args:
            db: Database session.
        """
        self.db = db
        self.tag_service = TagService(db)
        
        # Initialize AI components
        try:
            self.sentiment_analyzer = SentimentAnalyzer()
            self.entity_recognizer = EntityRecognizer()
        except Exception as e:
            logger.warning(f"AI components not available: {e}")
            self.sentiment_analyzer = None
            self.entity_recognizer = None
        
        # Configuration
        self.confidence_thresholds = {
            TagType.SENTIMENT: 0.6,
            TagType.PERSON: 0.7,
            TagType.LOCATION: 0.7,
            TagType.ORGANIZATION: 0.7,
            TagType.EVENT: 0.5,
            TagType.TOPIC: 0.5,
            TagType.LANGUAGE: 0.8
        }
        
        # Predefined sentiment mappings
        self.sentiment_mappings = {
            "positive": ["positive", "optimistic", "hopeful", "happy", "encouraging"],
            "negative": ["negative", "pessimistic", "sad", "angry", "discouraging"],
            "neutral": ["neutral", "balanced", "objective"],
            "inspiring": ["inspiring", "motivational", "uplifting"],
            "defiant": ["defiant", "rebellious", "resistant"],
            "determined": ["determined", "resolute", "focused"],
            "somber": ["somber", "serious", "grave", "solemn"]
        }
        
        # Historical context patterns
        self.historical_patterns = {
            r"(\d{4})s?\b": TagType.EVENT,  # Years like "1960s", "1994"
            r"\b(apartheid|liberation|freedom|independence|democracy)\b": TagType.EVENT,
            r"\b(speech|address|statement|declaration|proclamation)\b": TagType.EVENT,
            r"\b(prison|jail|incarceration|release)\b": TagType.EVENT,
            r"\b(trial|court|legal|verdict)\b": TagType.EVENT,
            r"\b(president|leader|minister|commissioner)\b": TagType.PERSON,
        }
    
    async def analyze_and_tag_clip(
        self,
        clip_id: str,
        transcript: Optional[Transcript] = None,
        text: Optional[str] = None,
        existing_analysis: Optional[Dict[str, Any]] = None
    ) -> MetadataAnalysisResult:
        """
        Analyze clip content and generate automated tags.
        
        Args:
            clip_id: Clip identifier.
            transcript: Transcript data.
            text: Raw text content.
            existing_analysis: Previously computed analysis results.
            
        Returns:
            Analysis results with suggested tags.
        """
        start_time = datetime.now()
        
        # Extract text content
        content_text = self._extract_text_content(transcript, text)
        
        if not content_text:
            logger.warning(f"No text content available for clip {clip_id}")
            return MetadataAnalysisResult(
                clip_id=clip_id,
                processing_time=0.0,
                confidence_score=0.0
            )
        
        result = MetadataAnalysisResult(clip_id=clip_id)
        
        # Sentiment analysis
        if self.sentiment_analyzer and not existing_analysis:
            try:
                sentiment_result = await self.sentiment_analyzer.analyze_sentiment(content_text)
                result.sentiment_data = SentimentData(
                    label=sentiment_result.get("label", "neutral"),
                    score=sentiment_result.get("score", 0.0),
                    confidence=sentiment_result.get("confidence", 0.0),
                    emotions=sentiment_result.get("emotions", {})
                )
            except Exception as e:
                logger.error(f"Sentiment analysis failed: {e}")
        
        # Named entity recognition
        if self.entity_recognizer and not existing_analysis:
            try:
                entities = await self.entity_recognizer.extract_entities(content_text)
                result.named_entities = [
                    EntityData(
                        text=entity.get("text", ""),
                        label=entity.get("label", ""),
                        start_char=entity.get("start", 0),
                        end_char=entity.get("end", 0),
                        confidence=entity.get("confidence", 0.0)
                    )
                    for entity in entities
                ]
            except Exception as e:
                logger.error(f"Entity recognition failed: {e}")
        
        # Use existing analysis if available
        if existing_analysis:
            if "sentiment" in existing_analysis:
                result.sentiment_data = self._convert_sentiment_data(existing_analysis["sentiment"])
            if "entities" in existing_analysis:
                result.named_entities = self._convert_entity_data(existing_analysis["entities"])
        
        # Extract keywords and topics
        result.keywords = self._extract_keywords(content_text)
        result.topic_labels = self._extract_topics(content_text)
        
        # Generate tag suggestions
        result.suggested_tags = await self._generate_tag_suggestions(result, content_text)
        
        # Calculate overall confidence
        result.confidence_score = self._calculate_overall_confidence(result)
        
        # Record processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        result.processing_time = processing_time
        
        logger.info(f"Generated {len(result.suggested_tags)} tag suggestions for clip {clip_id}")
        return result
    
    def _extract_text_content(
        self,
        transcript: Optional[Transcript] = None,
        text: Optional[str] = None
    ) -> str:
        """Extract text content from transcript or direct text."""
        if text:
            return text
        
        if transcript and transcript.segments:
            return " ".join(segment.text for segment in transcript.segments)
        
        return ""
    
    def _convert_sentiment_data(self, sentiment_dict: Dict[str, Any]) -> SentimentData:
        """Convert sentiment dictionary to SentimentData model."""
        return SentimentData(
            label=sentiment_dict.get("label", "neutral"),
            score=sentiment_dict.get("score", 0.0),
            confidence=sentiment_dict.get("confidence", 0.0),
            emotions=sentiment_dict.get("emotions", {})
        )
    
    def _convert_entity_data(self, entities_list: List[Dict[str, Any]]) -> List[EntityData]:
        """Convert entity list to EntityData models."""
        return [
            EntityData(
                text=entity.get("text", ""),
                label=entity.get("label", ""),
                confidence=entity.get("confidence", 0.0),
                additional_info=entity.get("additional_info", {})
            )
            for entity in entities_list
        ]
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text using simple heuristics."""
        # Remove common words and extract meaningful terms
        common_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "up", "about", "into", "through", "during",
            "before", "after", "above", "below", "over", "under", "again", "further",
            "then", "once", "here", "there", "when", "where", "why", "how", "all",
            "any", "both", "each", "few", "more", "most", "other", "some", "such",
            "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
            "can", "will", "just", "should", "now", "i", "you", "he", "she", "it",
            "we", "they", "them", "this", "that", "these", "those", "am", "is", "are",
            "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
            "did", "will", "would", "could", "should", "may", "might", "must", "shall"
        }
        
        # Extract words and filter
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        keywords = [word for word in words if word not in common_words]
        
        # Count frequency and return top keywords
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Return top 10 most frequent keywords
        sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_keywords[:10] if freq > 1]
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract topic labels using pattern matching."""
        topics = set()
        text_lower = text.lower()
        
        # Historical/political topics
        if any(term in text_lower for term in ["apartheid", "segregation", "racism"]):
            topics.add("Apartheid")
        
        if any(term in text_lower for term in ["freedom", "liberation", "independence"]):
            topics.add("Freedom Movement")
        
        if any(term in text_lower for term in ["prison", "jail", "robben island"]):
            topics.add("Imprisonment")
        
        if any(term in text_lower for term in ["speech", "address", "statement"]):
            topics.add("Public Speaking")
        
        if any(term in text_lower for term in ["education", "school", "university"]):
            topics.add("Education")
        
        if any(term in text_lower for term in ["democracy", "election", "vote"]):
            topics.add("Democracy")
        
        if any(term in text_lower for term in ["peace", "reconciliation", "unity"]):
            topics.add("Reconciliation")
        
        return list(topics)
    
    async def _generate_tag_suggestions(
        self,
        analysis_result: MetadataAnalysisResult,
        text: str
    ) -> List[TagSuggestion]:
        """Generate tag suggestions based on analysis results."""
        suggestions = []
        
        # Sentiment tags
        if analysis_result.sentiment_data:
            sentiment_tags = self._suggest_sentiment_tags(analysis_result.sentiment_data)
            suggestions.extend(sentiment_tags)
        
        # Entity tags
        for entity in analysis_result.named_entities:
            entity_tags = self._suggest_entity_tags(entity)
            suggestions.extend(entity_tags)
        
        # Topic tags
        for topic in analysis_result.topic_labels:
            suggestions.append(TagSuggestion(
                name=topic,
                tag_type=TagType.TOPIC,
                confidence=0.7,
                source=MetadataSource.AI_ANALYSIS,
                context=f"Detected topic: {topic}"
            ))
        
        # Historical context tags
        historical_tags = self._suggest_historical_tags(text)
        suggestions.extend(historical_tags)
        
        # Language tags
        language_tags = self._suggest_language_tags(text)
        suggestions.extend(language_tags)
        
        # Remove duplicates and filter by confidence
        unique_suggestions = self._deduplicate_suggestions(suggestions)
        filtered_suggestions = self._filter_by_confidence(unique_suggestions)
        
        return filtered_suggestions
    
    def _suggest_sentiment_tags(self, sentiment_data: SentimentData) -> List[TagSuggestion]:
        """Suggest sentiment-based tags."""
        suggestions = []
        
        # Primary sentiment
        if sentiment_data.confidence >= self.confidence_thresholds[TagType.SENTIMENT]:
            suggestions.append(TagSuggestion(
                name=sentiment_data.label.title(),
                tag_type=TagType.SENTIMENT,
                confidence=sentiment_data.confidence,
                source=MetadataSource.AI_ANALYSIS,
                context=f"Sentiment analysis: {sentiment_data.label} (score: {sentiment_data.score:.2f})"
            ))
        
        # Emotion-based tags
        for emotion, score in sentiment_data.emotions.items():
            if score > 0.7:  # High emotion score
                suggestions.append(TagSuggestion(
                    name=emotion.title(),
                    tag_type=TagType.SENTIMENT,
                    confidence=score,
                    source=MetadataSource.AI_ANALYSIS,
                    context=f"Emotion detection: {emotion}"
                ))
        
        return suggestions
    
    def _suggest_entity_tags(self, entity: EntityData) -> List[TagSuggestion]:
        """Suggest tags based on named entities."""
        suggestions = []
        
        # Map entity labels to tag types
        entity_type_mapping = {
            "PERSON": TagType.PERSON,
            "ORG": TagType.ORGANIZATION,
            "GPE": TagType.LOCATION,  # Geopolitical entity
            "LOC": TagType.LOCATION,
            "EVENT": TagType.EVENT,
            "FAC": TagType.LOCATION,  # Facility
            "LANGUAGE": TagType.LANGUAGE
        }
        
        tag_type = entity_type_mapping.get(entity.label, TagType.CUSTOM)
        
        if entity.confidence >= self.confidence_thresholds.get(tag_type, 0.5):
            suggestions.append(TagSuggestion(
                name=entity.text,
                tag_type=tag_type,
                confidence=entity.confidence,
                source=MetadataSource.AI_ANALYSIS,
                context=f"Named entity: {entity.label}"
            ))
        
        return suggestions
    
    def _suggest_historical_tags(self, text: str) -> List[TagSuggestion]:
        """Suggest tags based on historical context patterns."""
        suggestions = []
        
        for pattern, tag_type in self.historical_patterns.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                matched_text = match.group(0)
                
                # Calculate confidence based on context
                confidence = 0.6
                if len(matched_text) > 4:  # Longer matches are more confident
                    confidence = 0.8
                
                suggestions.append(TagSuggestion(
                    name=matched_text.title(),
                    tag_type=tag_type,
                    confidence=confidence,
                    source=MetadataSource.AI_ANALYSIS,
                    context=f"Historical pattern match: {pattern}"
                ))
        
        return suggestions
    
    def _suggest_language_tags(self, text: str) -> List[TagSuggestion]:
        """Suggest language tags based on text analysis."""
        suggestions = []
        
        # Simple language detection patterns
        afrikaans_words = ["die", "van", "en", "het", "is", "was", "sy", "hy", "dit"]
        xhosa_words = ["ubuntu", "abantu", "umntu", "izwe"]
        zulu_words = ["umuntu", "abantu", "ukuphila", "inkululeko"]
        
        text_lower = text.lower()
        words = text_lower.split()
        
        # Count language-specific words
        afrikaans_count = sum(1 for word in afrikaans_words if word in words)
        xhosa_count = sum(1 for word in xhosa_words if word in words)
        zulu_count = sum(1 for word in zulu_words if word in words)
        
        # Suggest language tags based on word presence
        if afrikaans_count > 2:
            suggestions.append(TagSuggestion(
                name="Afrikaans",
                tag_type=TagType.LANGUAGE,
                confidence=min(0.9, afrikaans_count / 10),
                source=MetadataSource.AI_ANALYSIS,
                context=f"Detected {afrikaans_count} Afrikaans words"
            ))
        
        if xhosa_count > 0:
            suggestions.append(TagSuggestion(
                name="Xhosa",
                tag_type=TagType.LANGUAGE,
                confidence=min(0.9, xhosa_count / 5),
                source=MetadataSource.AI_ANALYSIS,
                context=f"Detected {xhosa_count} Xhosa words"
            ))
        
        if zulu_count > 0:
            suggestions.append(TagSuggestion(
                name="Zulu",
                tag_type=TagType.LANGUAGE,
                confidence=min(0.9, zulu_count / 5),
                source=MetadataSource.AI_ANALYSIS,
                context=f"Detected {zulu_count} Zulu words"
            ))
        
        return suggestions
    
    def _deduplicate_suggestions(self, suggestions: List[TagSuggestion]) -> List[TagSuggestion]:
        """Remove duplicate tag suggestions."""
        seen = set()
        unique_suggestions = []
        
        for suggestion in suggestions:
            key = (suggestion.name.lower(), suggestion.tag_type)
            if key not in seen:
                seen.add(key)
                unique_suggestions.append(suggestion)
            else:
                # Keep the one with higher confidence
                for i, existing in enumerate(unique_suggestions):
                    if (existing.name.lower() == suggestion.name.lower() and 
                        existing.tag_type == suggestion.tag_type):
                        if suggestion.confidence > existing.confidence:
                            unique_suggestions[i] = suggestion
                        break
        
        return unique_suggestions
    
    def _filter_by_confidence(self, suggestions: List[TagSuggestion]) -> List[TagSuggestion]:
        """Filter suggestions by confidence thresholds."""
        filtered = []
        
        for suggestion in suggestions:
            min_confidence = self.confidence_thresholds.get(suggestion.tag_type, 0.5)
            if suggestion.confidence >= min_confidence:
                filtered.append(suggestion)
        
        return sorted(filtered, key=lambda x: x.confidence, reverse=True)
    
    def _calculate_overall_confidence(self, result: MetadataAnalysisResult) -> float:
        """Calculate overall confidence score for the analysis."""
        confidence_scores = []
        
        if result.sentiment_data:
            confidence_scores.append(result.sentiment_data.confidence)
        
        if result.named_entities:
            entity_confidences = [entity.confidence for entity in result.named_entities]
            if entity_confidences:
                confidence_scores.append(sum(entity_confidences) / len(entity_confidences))
        
        if result.suggested_tags:
            tag_confidences = [tag.confidence for tag in result.suggested_tags]
            if tag_confidences:
                confidence_scores.append(sum(tag_confidences) / len(tag_confidences))
        
        if confidence_scores:
            return sum(confidence_scores) / len(confidence_scores)
        
        return 0.0
    
    async def auto_apply_tags(
        self,
        clip_id: str,
        suggestions: List[TagSuggestion],
        min_confidence: float = 0.8
    ) -> List[str]:
        """
        Automatically apply high-confidence tag suggestions.
        
        Args:
            clip_id: Clip identifier.
            suggestions: List of tag suggestions.
            min_confidence: Minimum confidence for auto-application.
            
        Returns:
            List of applied tag IDs.
        """
        applied_tag_ids = []
        
        for suggestion in suggestions:
            if suggestion.confidence >= min_confidence:
                try:
                    # Check if tag already exists
                    existing_tag = self.tag_service.get_tag_by_name(
                        suggestion.name,
                        suggestion.tag_type
                    )
                    
                    if not existing_tag:
                        # Create new tag
                        tag = self.tag_service.create_tag(
                            name=suggestion.name,
                            tag_type=suggestion.tag_type,
                            confidence=suggestion.confidence,
                            confidence_level=self._get_confidence_level(suggestion.confidence),
                            source=suggestion.source
                        )
                        tag_id = str(tag.id)
                    else:
                        tag_id = str(existing_tag.id)
                        # Increment usage count
                        self.tag_service.increment_tag_usage(tag_id)
                    
                    applied_tag_ids.append(tag_id)
                    
                except Exception as e:
                    logger.error(f"Failed to apply tag '{suggestion.name}': {e}")
        
        logger.info(f"Auto-applied {len(applied_tag_ids)} tags for clip {clip_id}")
        return applied_tag_ids
    
    def _get_confidence_level(self, confidence: float) -> ConfidenceLevel:
        """Convert confidence score to confidence level."""
        if confidence >= 0.8:
            return ConfidenceLevel.HIGH
        elif confidence >= 0.5:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW 