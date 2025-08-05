"""
API routes for YouTube search.
"""
import os
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from src.ai.prompt_enhancer import OpenAIPromptEnhancer
from src.services.youtube import YouTubeAPIClient, YouTubeSearchService


router = APIRouter(prefix="/youtube", tags=["youtube"])


class SearchRequest(BaseModel):
    """Request model for YouTube search."""
    prompt: str
    max_results: int = Field(default=25, ge=1, le=50)
    use_alternative_queries: bool = Field(default=False)
    filters: Optional[Dict[str, Any]] = None
    sort_by: str = Field(default="relevance")
    sort_reverse: bool = Field(default=False)
    page_token: Optional[str] = None


class SearchResponse(BaseModel):
    """Response model for YouTube search results."""
    items: List[Dict[str, Any]]
    next_page_token: Optional[str] = None
    prev_page_token: Optional[str] = None
    total_results: int
    results_per_page: int
    enhanced_prompt: Dict[str, Any]


async def get_prompt_enhancer() -> OpenAIPromptEnhancer:
    """
    Dependency to get the prompt enhancer.
    
    Returns:
        An instance of OpenAIPromptEnhancer.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    return OpenAIPromptEnhancer(api_key=api_key)


async def get_youtube_client() -> YouTubeAPIClient:
    """
    Dependency to get the YouTube API client.
    
    Returns:
        An instance of YouTubeAPIClient.
    """
    return YouTubeAPIClient()


async def get_youtube_search_service(
    youtube_client: YouTubeAPIClient = Depends(get_youtube_client)
) -> YouTubeSearchService:
    """
    Dependency to get the YouTube search service.
    
    Args:
        youtube_client: YouTube API client.
        
    Returns:
        An instance of YouTubeSearchService.
    """
    return YouTubeSearchService(youtube_client=youtube_client)


@router.post("/search", response_model=SearchResponse)
async def search_youtube(
    request: SearchRequest,
    prompt_enhancer: OpenAIPromptEnhancer = Depends(get_prompt_enhancer),
    search_service: YouTubeSearchService = Depends(get_youtube_search_service)
) -> Dict[str, Any]:
    """
    Search YouTube videos using enhanced prompts.
    
    Args:
        request: Search request.
        prompt_enhancer: Prompt enhancer instance.
        search_service: YouTube search service instance.
        
    Returns:
        Search results.
    """
    try:
        # Enhance the prompt
        enhanced_prompt = await prompt_enhancer.enhance(request.prompt)
        
        # Search YouTube
        if request.use_alternative_queries:
            search_results = await search_service.try_alternative_queries(
                enhanced_prompt=enhanced_prompt,
                max_results=request.max_results
            )
        else:
            search_results = await search_service.search_with_enhanced_prompt(
                enhanced_prompt=enhanced_prompt,
                max_results=request.max_results,
                page_token=request.page_token
            )
        
        # Apply filters if provided
        if request.filters:
            search_results = search_service.filter_results(
                search_results=search_results,
                filters=request.filters
            )
        
        # Sort results if requested
        if request.sort_by != "relevance":
            search_results = search_service.sort_results(
                search_results=search_results,
                sort_by=request.sort_by,
                reverse=request.sort_reverse
            )
        
        # Prepare response
        return {
            "items": search_results.get("items", []),
            "next_page_token": search_results.get("nextPageToken"),
            "prev_page_token": search_results.get("prevPageToken"),
            "total_results": search_results.get("pageInfo", {}).get("totalResults", len(search_results.get("items", []))),
            "results_per_page": search_results.get("pageInfo", {}).get("resultsPerPage", len(search_results.get("items", []))),
            "enhanced_prompt": search_results.get("enhanced_prompt", {})
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching YouTube: {str(e)}")


@router.get("/video/{video_id}")
async def get_video_details(
    video_id: str,
    youtube_client: YouTubeAPIClient = Depends(get_youtube_client)
) -> Dict[str, Any]:
    """
    Get details for a specific video.
    
    Args:
        video_id: YouTube video ID.
        youtube_client: YouTube API client instance.
        
    Returns:
        Video details.
    """
    try:
        video_details = youtube_client.get_videos(
            video_ids=[video_id],
            parts=["snippet", "contentDetails", "statistics"]
        )
        
        if not video_details.get("items"):
            raise HTTPException(status_code=404, detail=f"Video {video_id} not found")
        
        return video_details["items"][0]
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Error getting video details: {str(e)}")


@router.get("/captions/{video_id}")
async def get_video_captions(
    video_id: str,
    youtube_client: YouTubeAPIClient = Depends(get_youtube_client)
) -> Dict[str, Any]:
    """
    Get available captions for a video.
    
    Args:
        video_id: YouTube video ID.
        youtube_client: YouTube API client instance.
        
    Returns:
        Available captions.
    """
    try:
        captions = youtube_client.get_captions(video_id=video_id)
        return captions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting captions: {str(e)}")


@router.get("/caption/{caption_id}")
async def download_caption(
    caption_id: str,
    format: str = Query("srt", pattern="^(srt|vtt)$"),
    youtube_client: YouTubeAPIClient = Depends(get_youtube_client)
) -> str:
    """
    Download a specific caption track.
    
    Args:
        caption_id: Caption ID.
        format: Caption format (srt or vtt).
        youtube_client: YouTube API client instance.
        
    Returns:
        Caption content as text.
    """
    try:
        caption_text = youtube_client.download_caption(
            caption_id=caption_id,
            format=format
        )
        return caption_text
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading caption: {str(e)}") 