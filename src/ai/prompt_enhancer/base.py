"""
Base class for prompt enhancers.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from .models import EnhancedPrompt


class BasePromptEnhancer(ABC):
    """Base class for prompt enhancers."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the prompt enhancer.
        
        Args:
            config: Configuration parameters for the enhancer.
        """
        self.config = config or {}
    
    @abstractmethod
    async def enhance(self, prompt: str) -> EnhancedPrompt:
        """
        Enhance a prompt with additional context and information.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            An EnhancedPrompt object containing the original prompt,
            extracted information, and expanded queries.
        """
        pass
    
    @abstractmethod
    async def extract_entities(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Extract entities from a prompt.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            A list of extracted entities with their types and positions.
        """
        pass
    
    @abstractmethod
    async def extract_temporal_references(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Extract temporal references from a prompt.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            A list of temporal references with normalized values.
        """
        pass
    
    @abstractmethod
    async def extract_location_references(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Extract location references from a prompt.
        
        Args:
            prompt: The original user prompt.
            
        Returns:
            A list of location references with normalized values.
        """
        pass
    
    @abstractmethod
    async def generate_related_terms(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate terms related to the extracted entities.
        
        Args:
            entities: A list of extracted entities.
            
        Returns:
            A list of related terms with their relation types.
        """
        pass
    
    @abstractmethod
    async def generate_search_queries(self, 
                                     prompt: str,
                                     entities: List[Dict[str, Any]],
                                     temporal_refs: List[Dict[str, Any]],
                                     location_refs: List[Dict[str, Any]],
                                     related_terms: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate search queries based on the extracted information.
        
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
        pass 