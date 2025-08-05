"""
API routes for the prompt enhancer.
"""
import os
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.ai.prompt_enhancer import OpenAIPromptEnhancer, EnhancedPrompt


router = APIRouter(prefix="/prompt-enhancer", tags=["prompt-enhancer"])


class PromptRequest(BaseModel):
    """Request model for prompt enhancement."""
    prompt: str


class PromptResponse(BaseModel):
    """Response model for enhanced prompts."""
    original_prompt: str
    primary_query: str
    alternative_queries: list[str]
    entities: list[Dict[str, Any]]
    temporal_references: list[Dict[str, Any]]
    location_references: list[Dict[str, Any]]
    related_terms: list[Dict[str, Any]]
    search_params: Dict[str, Any]


async def get_enhancer() -> OpenAIPromptEnhancer:
    """
    Dependency to get the prompt enhancer.
    
    Returns:
        An instance of OpenAIPromptEnhancer.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    return OpenAIPromptEnhancer(api_key=api_key)


@router.post("/enhance", response_model=PromptResponse)
async def enhance_prompt(
    request: PromptRequest,
    enhancer: OpenAIPromptEnhancer = Depends(get_enhancer)
) -> Dict[str, Any]:
    """
    Enhance a search prompt with additional context and information.
    
    Args:
        request: The prompt request.
        enhancer: The prompt enhancer instance.
        
    Returns:
        The enhanced prompt.
    """
    try:
        enhanced_prompt: EnhancedPrompt = await enhancer.enhance(request.prompt)
        
        return {
            "original_prompt": enhanced_prompt.original_prompt,
            "primary_query": enhanced_prompt.primary_query,
            "alternative_queries": enhanced_prompt.alternative_queries,
            "entities": [entity.model_dump() for entity in enhanced_prompt.entities],
            "temporal_references": [ref.model_dump() for ref in enhanced_prompt.temporal_references],
            "location_references": [ref.model_dump() for ref in enhanced_prompt.location_references],
            "related_terms": [term.model_dump() for term in enhanced_prompt.related_terms],
            "search_params": enhanced_prompt.search_params
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing prompt: {str(e)}") 