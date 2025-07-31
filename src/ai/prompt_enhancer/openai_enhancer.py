"""
OpenAI-based implementation of the prompt enhancer.
"""
import json
import logging
from typing import List, Dict, Any, Optional

from openai import AsyncOpenAI
from pydantic import ValidationError

from .base import BasePromptEnhancer
from .models import EnhancedPrompt, Entity, TemporalReference, LocationReference, RelatedTerm

logger = logging.getLogger(__name__)


class OpenAIPromptEnhancer(BasePromptEnhancer):
    """Prompt enhancer using OpenAI's API."""
    
    def __init__(self, api_key: str, model: str = "gpt-4o", config: Optional[Dict[str, Any]] = None):
        """
        Initialize the OpenAI prompt enhancer.
        
        Args:
            api_key: OpenAI API key.
            model: OpenAI model to use.
            config: Additional configuration parameters.
        """
        super().__init__(config)
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
    
    async def enhance(self, prompt: str) -> EnhancedPrompt:
        """
        Enhance a prompt using OpenAI's API.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            An EnhancedPrompt object.
        """
        try:
            # Extract information from the prompt
            entities = await self.extract_entities(prompt)
            temporal_refs = await self.extract_temporal_references(prompt)
            location_refs = await self.extract_location_references(prompt)
            
            # Generate related terms
            related_terms = await self.generate_related_terms(entities)
            
            # Generate search queries
            search_info = await self.generate_search_queries(
                prompt, entities, temporal_refs, location_refs, related_terms
            )
            
            # Create and return the enhanced prompt
            return EnhancedPrompt(
                original_prompt=prompt,
                entities=[Entity(**e) for e in entities],
                temporal_references=[TemporalReference(**t) for t in temporal_refs],
                location_references=[LocationReference(**l) for l in location_refs],
                related_terms=[RelatedTerm(**r) for r in related_terms],
                primary_query=search_info["primary_query"],
                alternative_queries=search_info["alternative_queries"],
                search_params=search_info["search_params"]
            )
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            raise
        except Exception as e:
            logger.error(f"Error enhancing prompt: {e}")
            raise
    
    async def extract_entities(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Extract entities from a prompt using OpenAI's API.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            A list of extracted entities.
        """
        system_prompt = """
        You are an expert entity extractor. Extract all named entities from the given text.
        Focus on people, organizations, events, concepts, and other proper nouns.
        Return the results as a JSON array of objects with the following structure:
        [
            {
                "text": "entity text",
                "type": "entity type (person, organization, event, concept, etc.)",
                "confidence": float between 0 and 1,
                "start_char": starting character position in the original text,
                "end_char": ending character position in the original text
            }
        ]
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("entities", [])
    
    async def extract_temporal_references(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Extract temporal references from a prompt using OpenAI's API.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            A list of temporal references.
        """
        system_prompt = """
        You are an expert at extracting temporal references from text. Extract all dates, time periods, 
        decades, etc. from the given text. Normalize dates to ISO format (YYYY-MM-DD) when possible.
        For periods, provide start_date and end_date in ISO format when possible.
        Return the results as a JSON array of objects with the following structure:
        [
            {
                "text": "original text of the temporal reference",
                "type": "date, period, decade, etc.",
                "normalized_value": "normalized representation",
                "start_date": "ISO date string for the start (if applicable)",
                "end_date": "ISO date string for the end (if applicable)",
                "confidence": float between 0 and 1
            }
        ]
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("temporal_references", [])
    
    async def extract_location_references(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Extract location references from a prompt using OpenAI's API.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            A list of location references.
        """
        system_prompt = """
        You are an expert at extracting location references from text. Extract all locations 
        (countries, cities, regions, etc.) from the given text. Provide the normalized name
        and country code (ISO 3166-1 alpha-2) when possible.
        Return the results as a JSON array of objects with the following structure:
        [
            {
                "text": "original text of the location",
                "normalized_name": "normalized name",
                "country_code": "ISO 3166-1 alpha-2 code (if applicable)",
                "confidence": float between 0 and 1
            }
        ]
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("location_references", [])
    
    async def generate_related_terms(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate terms related to the extracted entities using OpenAI's API.
        
        Args:
            entities: A list of extracted entities.
            
        Returns:
            A list of related terms.
        """
        if not entities:
            return []
        
        entity_texts = [e["text"] for e in entities]
        entity_types = [e["type"] for e in entities]
        
        system_prompt = """
        You are an expert at generating related terms for entities. For each entity provided,
        generate relevant synonyms, related entities, broader terms, etc. that would be useful
        for enhancing a search query about these entities.
        Return the results as a JSON array of objects with the following structure:
        [
            {
                "text": "related term",
                "relation_type": "synonym, related_entity, broader_term, etc.",
                "source_entity": "the original entity this term is related to",
                "confidence": float between 0 and 1
            }
        ]
        """
        
        user_prompt = f"""
        Generate related terms for the following entities:
        
        Entities: {', '.join(entity_texts)}
        Entity types: {', '.join(entity_types)}
        
        Focus on terms that would be useful for enhancing a YouTube search query.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("related_terms", [])
    
    async def generate_search_queries(self,
                                    prompt: str,
                                    entities: List[Dict[str, Any]],
                                    temporal_refs: List[Dict[str, Any]],
                                    location_refs: List[Dict[str, Any]],
                                    related_terms: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate search queries based on the extracted information using OpenAI's API.
        
        Args:
            prompt: The original user prompt.
            entities: A list of extracted entities.
            temporal_refs: A list of temporal references.
            location_refs: A list of location references.
            related_terms: A list of related terms.
            
        Returns:
            A dictionary containing the primary query, alternative queries,
            and search parameters for the YouTube API.
        """
        system_prompt = """
        You are an expert at generating optimized search queries for YouTube. Given an original prompt
        and extracted information, generate a primary search query and alternative queries that would
        yield the most relevant results on YouTube. Also provide search parameters for the YouTube API.
        Return the results as a JSON object with the following structure:
        {
            "primary_query": "the main search query",
            "alternative_queries": ["alternative query 1", "alternative query 2", ...],
            "search_params": {
                "publishedAfter": "ISO date string (if applicable)",
                "publishedBefore": "ISO date string (if applicable)",
                "regionCode": "ISO 3166-1 alpha-2 code (if applicable)",
                "relevanceLanguage": "ISO 639-1 two-letter language code (if applicable)",
                "videoCaption": "closedCaption (if searching for videos with captions)",
                "videoLicense": "creativeCommon or youtube (if applicable)"
            }
        }
        """
        
        user_prompt = f"""
        Original prompt: {prompt}
        
        Extracted entities: {json.dumps(entities)}
        
        Temporal references: {json.dumps(temporal_refs)}
        
        Location references: {json.dumps(location_refs)}
        
        Related terms: {json.dumps(related_terms)}
        
        Generate optimized search queries for YouTube and appropriate search parameters.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        return json.loads(response.choices[0].message.content) 