"""
Base class for named entity recognizers.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from collections import defaultdict

from .models import Entity, EntityType, EntityResult, SegmentEntities, VideoEntities
from src.services.transcription.models import TranscriptSegment, Transcript


class BaseEntityRecognizer(ABC):
    """Base class for named entity recognition implementations."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the entity recognizer.
        
        Args:
            config: Configuration parameters for the recognizer.
        """
        self.config = config or {}
    
    @abstractmethod
    async def extract_entities(self, text: str) -> EntityResult:
        """
        Extract entities from a single text.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Entity recognition result.
        """
        pass
    
    async def extract_from_segment(self, segment: TranscriptSegment) -> SegmentEntities:
        """
        Extract entities from a transcript segment.
        
        Args:
            segment: Transcript segment to analyze.
            
        Returns:
            Segment entity recognition result.
        """
        entity_result = await self.extract_entities(segment.text)
        
        # Add timing information to entities
        for entity in entity_result.entities:
            entity.start_time = segment.start_time
            entity.end_time = segment.end_time
        
        # Count entities by type
        entity_counts = defaultdict(int)
        for entity in entity_result.entities:
            entity_counts[entity.type] += 1
        
        return SegmentEntities(
            segment_id=f"{segment.start_time}_{segment.end_time}",
            start_time=segment.start_time,
            end_time=segment.end_time,
            text=segment.text,
            entities=entity_result.entities,
            entity_counts=dict(entity_counts),
            confidence=entity_result.confidence
        )
    
    async def extract_from_transcript(self, transcript: Transcript) -> VideoEntities:
        """
        Extract entities from all segments in a transcript.
        
        Args:
            transcript: Transcript to analyze.
            
        Returns:
            Video entity recognition result.
        """
        segments = []
        all_entities = []
        
        for segment in transcript.segments:
            segment_entities = await self.extract_from_segment(segment)
            segments.append(segment_entities)
            all_entities.extend(segment_entities.entities)
        
        # Group entities by type
        entity_summary = defaultdict(list)
        for entity in all_entities:
            entity_summary[entity.type].append(entity)
        
        # Calculate overall confidence
        if segments:
            avg_confidence = sum(seg.confidence for seg in segments) / len(segments)
        else:
            avg_confidence = 0.0
        
        return VideoEntities(
            video_id=transcript.video_id,
            segments=segments,
            all_entities=all_entities,
            entity_summary=dict(entity_summary),
            confidence=avg_confidence,
            language=transcript.language
        )
    
    def filter_entities_by_type(self, entities: List[Entity], entity_types: List[EntityType]) -> List[Entity]:
        """
        Filter entities by their types.
        
        Args:
            entities: List of entities to filter.
            entity_types: Types to include.
            
        Returns:
            Filtered list of entities.
        """
        return [entity for entity in entities if entity.type in entity_types]
    
    def get_entities_by_confidence(self, entities: List[Entity], min_confidence: float = 0.5) -> List[Entity]:
        """
        Filter entities by minimum confidence threshold.
        
        Args:
            entities: List of entities to filter.
            min_confidence: Minimum confidence threshold.
            
        Returns:
            Filtered list of entities.
        """
        return [entity for entity in entities if entity.confidence >= min_confidence]
    
    def merge_duplicate_entities(self, entities: List[Entity]) -> List[Entity]:
        """
        Merge duplicate entities based on text and type.
        
        Args:
            entities: List of entities to merge.
            
        Returns:
            List of merged entities.
        """
        entity_map = {}
        
        for entity in entities:
            key = (entity.text.lower(), entity.type)
            if key in entity_map:
                # Keep the entity with higher confidence
                if entity.confidence > entity_map[key].confidence:
                    entity_map[key] = entity
            else:
                entity_map[key] = entity
        
        return list(entity_map.values()) 