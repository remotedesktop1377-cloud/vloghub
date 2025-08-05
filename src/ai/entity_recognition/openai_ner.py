"""
OpenAI-based named entity recognizer.
"""
import json
import logging
import time
from typing import Dict, Any, Optional, List

from openai import AsyncOpenAI

from .base import BaseEntityRecognizer
from .models import Entity, EntityType, EntityResult

logger = logging.getLogger(__name__)


class OpenAIEntityRecognizer(BaseEntityRecognizer):
    """OpenAI-based named entity recognizer."""
    
    def __init__(self, api_key: str, model: str = "gpt-4", config: Optional[Dict[str, Any]] = None):
        """
        Initialize the OpenAI entity recognizer.
        
        Args:
            api_key: OpenAI API key.
            model: OpenAI model to use.
            config: Additional configuration parameters.
        """
        super().__init__(config)
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
    
    async def extract_entities(self, text: str) -> EntityResult:
        """
        Extract entities from text using OpenAI.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Entity recognition result.
        """
        start_time = time.time()
        
        system_prompt = """
        You are an expert named entity recognizer. Extract all named entities from the given text.
        Focus on people, organizations, locations, dates, times, events, concepts, and other important entities.
        
        For each entity, determine:
        - The exact text span
        - The entity type (person, organization, location, date, time, event, concept, product, money, quantity, language, nationality, other)
        - Confidence score (0.0 to 1.0)
        - Character positions in the original text
        - Normalized value if applicable (e.g., "Nelson Mandela" -> "nelson_mandela")
        
        Return the result as JSON with this structure:
        {
            "entities": [
                {
                    "text": "exact text from input",
                    "type": "entity type",
                    "confidence": float between 0 and 1,
                    "start_char": starting character position,
                    "end_char": ending character position,
                    "normalized_value": "normalized form if applicable"
                }
            ],
            "language": "detected language code",
            "overall_confidence": float between 0 and 1
        }
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract named entities from this text: {text}"}
                ]
            )
            
            result = json.loads(response.choices[0].message.content)
            processing_time = time.time() - start_time
            
            # Convert to our Entity objects
            entities = []
            for entity_data in result.get("entities", []):
                try:
                    entity_type = EntityType(entity_data["type"].lower())
                except ValueError:
                    entity_type = EntityType.OTHER
                
                entity = Entity(
                    text=entity_data["text"],
                    type=entity_type,
                    confidence=entity_data.get("confidence", 0.5),
                    start_char=entity_data.get("start_char"),
                    end_char=entity_data.get("end_char"),
                    normalized_value=entity_data.get("normalized_value")
                )
                entities.append(entity)
            
            return EntityResult(
                text=text,
                entities=entities,
                language=result.get("language"),
                confidence=result.get("overall_confidence", 0.5),
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            processing_time = time.time() - start_time
            
            # Return empty result on error
            return EntityResult(
                text=text,
                entities=[],
                confidence=0.0,
                processing_time=processing_time
            )
    
    async def extract_persons(self, text: str) -> List[Entity]:
        """
        Extract only person entities from text.
        
        Args:
            text: Text to analyze.
            
        Returns:
            List of person entities.
        """
        result = await self.extract_entities(text)
        return self.filter_entities_by_type(result.entities, [EntityType.PERSON])
    
    async def extract_locations(self, text: str) -> List[Entity]:
        """
        Extract only location entities from text.
        
        Args:
            text: Text to analyze.
            
        Returns:
            List of location entities.
        """
        result = await self.extract_entities(text)
        return self.filter_entities_by_type(result.entities, [EntityType.LOCATION])
    
    async def extract_dates_and_times(self, text: str) -> List[Entity]:
        """
        Extract only date and time entities from text.
        
        Args:
            text: Text to analyze.
            
        Returns:
            List of date and time entities.
        """
        result = await self.extract_entities(text)
        return self.filter_entities_by_type(result.entities, [EntityType.DATE, EntityType.TIME]) 