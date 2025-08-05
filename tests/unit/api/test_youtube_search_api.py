"""
Tests for the YouTube search API routes.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json

from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.ai.prompt_enhancer.models import EnhancedPrompt
from src.services.youtube import YouTubeAPIClient, YouTubeSearchService


@pytest.fixture
def mock_prompt_enhancer():
    """Fixture for a mock prompt enhancer."""
    mock_enhancer = MagicMock()
    mock_enhancer.enhance = AsyncMock()
    
    # Create a mock enhanced prompt
    mock_prompt = MagicMock(spec=EnhancedPrompt)
    mock_prompt.original_prompt = "test prompt"
    mock_prompt.primary_query = "test query"
    mock_prompt.alternative_queries = ["alt query 1", "alt query 2"]
    mock_prompt.entities = []
    mock_prompt.temporal_references = []
    mock_prompt.location_references = []
    mock_prompt.related_terms = []
    mock_prompt.search_params = {"publishedAfter": "2020-01-01T00:00:00Z"}
    
    # Configure mock to return the enhanced prompt
    mock_enhancer.enhance.return_value = mock_prompt
    
    return mock_enhancer


@pytest.fixture
def mock_youtube_search_service():
    """Fixture for a mock YouTube search service."""
    mock_service = MagicMock(spec=YouTubeSearchService)
    
    # Mock search_with_enhanced_prompt
    mock_service.search_with_enhanced_prompt = AsyncMock(return_value={
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {"title": "Test Video 1"}
            },
            {
                "id": {"videoId": "test2"},
                "snippet": {"title": "Test Video 2"}
            }
        ],
        "nextPageToken": "next_token",
        "prevPageToken": "prev_token",
        "pageInfo": {"totalResults": 2, "resultsPerPage": 2}
    })
    
    # Mock try_alternative_queries
    mock_service.try_alternative_queries = AsyncMock(return_value={
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {"title": "Test Video 1"}
            },
            {
                "id": {"videoId": "test2"},
                "snippet": {"title": "Test Video 2"}
            },
            {
                "id": {"videoId": "test3"},
                "snippet": {"title": "Test Video 3"}
            }
        ],
        "pageInfo": {"totalResults": 3, "resultsPerPage": 3}
    })
    
    # Mock filter_results
    mock_service.filter_results = MagicMock(return_value={
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {"title": "Test Video 1"}
            }
        ],
        "pageInfo": {"totalResults": 1, "resultsPerPage": 1}
    })
    
    # Mock sort_results
    mock_service.sort_results = MagicMock(return_value={
        "items": [
            {
                "id": {"videoId": "test2"},
                "snippet": {"title": "Test Video 2"}
            },
            {
                "id": {"videoId": "test1"},
                "snippet": {"title": "Test Video 1"}
            }
        ],
        "pageInfo": {"totalResults": 2, "resultsPerPage": 2}
    })
    
    return mock_service


@pytest.fixture
def mock_youtube_client():
    """Fixture for a mock YouTube API client."""
    mock_client = MagicMock(spec=YouTubeAPIClient)
    
    # Mock get_videos
    mock_client.get_videos.return_value = {
        "items": [
            {
                "id": "test1",
                "snippet": {"title": "Test Video 1"},
                "contentDetails": {"duration": "PT1H30M"},
                "statistics": {"viewCount": "1000"}
            }
        ]
    }
    
    # Mock get_captions
    mock_client.get_captions.return_value = {
        "items": [
            {
                "id": "caption1",
                "snippet": {"language": "en"}
            },
            {
                "id": "caption2",
                "snippet": {"language": "fr"}
            }
        ]
    }
    
    # Mock download_caption
    mock_client.download_caption.return_value = "Caption content"
    
    return mock_client


@pytest.mark.asyncio
async def test_search_youtube_endpoint(test_client, mock_prompt_enhancer, mock_youtube_search_service):
    """Test the search YouTube endpoint."""
    # Mock the get_prompt_enhancer and get_youtube_search_service dependencies
    with patch('src.api.routes.youtube_search.get_prompt_enhancer', return_value=mock_prompt_enhancer), \
         patch('src.api.routes.youtube_search.get_youtube_search_service', return_value=mock_youtube_search_service):
        
        # Make the request
        response = test_client.post(
            "/api/youtube/search",
            json={
                "prompt": "test prompt",
                "max_results": 10,
                "use_alternative_queries": False,
                "filters": None,
                "sort_by": "relevance",
                "sort_reverse": False
            }
        )
        
        # Check response
        assert response.status_code == 200
        result = response.json()
        
        # Check that the prompt enhancer was called
        mock_prompt_enhancer.enhance.assert_called_once_with("test prompt")
        
        # Check that the search service was called
        mock_youtube_search_service.search_with_enhanced_prompt.assert_called_once()
        
        # Check result structure
        assert "items" in result
        assert len(result["items"]) == 2
        assert result["next_page_token"] == "next_token"
        assert result["prev_page_token"] == "prev_token"
        assert result["total_results"] == 2
        assert result["results_per_page"] == 2


@pytest.mark.asyncio
async def test_search_youtube_with_alternative_queries(test_client, mock_prompt_enhancer, mock_youtube_search_service):
    """Test the search YouTube endpoint with alternative queries."""
    # Mock the get_prompt_enhancer and get_youtube_search_service dependencies
    with patch('src.api.routes.youtube_search.get_prompt_enhancer', return_value=mock_prompt_enhancer), \
         patch('src.api.routes.youtube_search.get_youtube_search_service', return_value=mock_youtube_search_service):
        
        # Make the request
        response = test_client.post(
            "/api/youtube/search",
            json={
                "prompt": "test prompt",
                "max_results": 10,
                "use_alternative_queries": True,
                "filters": None,
                "sort_by": "relevance",
                "sort_reverse": False
            }
        )
        
        # Check response
        assert response.status_code == 200
        result = response.json()
        
        # Check that the try_alternative_queries method was called
        mock_youtube_search_service.try_alternative_queries.assert_called_once()
        
        # Check result structure
        assert "items" in result
        assert len(result["items"]) == 3


@pytest.mark.asyncio
async def test_search_youtube_with_filters(test_client, mock_prompt_enhancer, mock_youtube_search_service):
    """Test the search YouTube endpoint with filters."""
    # Mock the get_prompt_enhancer and get_youtube_search_service dependencies
    with patch('src.api.routes.youtube_search.get_prompt_enhancer', return_value=mock_prompt_enhancer), \
         patch('src.api.routes.youtube_search.get_youtube_search_service', return_value=mock_youtube_search_service):
        
        # Make the request
        response = test_client.post(
            "/api/youtube/search",
            json={
                "prompt": "test prompt",
                "max_results": 10,
                "use_alternative_queries": False,
                "filters": {
                    "duration": {
                        "min": 600,
                        "max": 1200
                    }
                },
                "sort_by": "relevance",
                "sort_reverse": False
            }
        )
        
        # Check response
        assert response.status_code == 200
        result = response.json()
        
        # Check that the filter_results method was called
        mock_youtube_search_service.filter_results.assert_called_once()
        
        # Check result structure
        assert "items" in result
        assert len(result["items"]) == 1


@pytest.mark.asyncio
async def test_search_youtube_with_sorting(test_client, mock_prompt_enhancer, mock_youtube_search_service):
    """Test the search YouTube endpoint with sorting."""
    # Mock the get_prompt_enhancer and get_youtube_search_service dependencies
    with patch('src.api.routes.youtube_search.get_prompt_enhancer', return_value=mock_prompt_enhancer), \
         patch('src.api.routes.youtube_search.get_youtube_search_service', return_value=mock_youtube_search_service):
        
        # Make the request
        response = test_client.post(
            "/api/youtube/search",
            json={
                "prompt": "test prompt",
                "max_results": 10,
                "use_alternative_queries": False,
                "filters": None,
                "sort_by": "viewCount",
                "sort_reverse": True
            }
        )
        
        # Check response
        assert response.status_code == 200
        result = response.json()
        
        # Check that the sort_results method was called
        mock_youtube_search_service.sort_results.assert_called_once_with(
            search_results=mock_youtube_search_service.search_with_enhanced_prompt.return_value,
            sort_by="viewCount",
            reverse=True
        )
        
        # Check result structure
        assert "items" in result
        assert len(result["items"]) == 2
        assert result["items"][0]["id"]["videoId"] == "test2"  # Sorted order


@pytest.mark.asyncio
async def test_search_youtube_error(test_client, mock_prompt_enhancer):
    """Test the search YouTube endpoint with an error."""
    # Mock the get_prompt_enhancer dependency to raise an exception
    mock_prompt_enhancer.enhance.side_effect = Exception("Test error")
    
    with patch('src.api.routes.youtube_search.get_prompt_enhancer', return_value=mock_prompt_enhancer):
        
        # Make the request
        response = test_client.post(
            "/api/youtube/search",
            json={
                "prompt": "test prompt",
                "max_results": 10
            }
        )
        
        # Check response
        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "Error searching YouTube" in result["detail"]


@pytest.mark.asyncio
async def test_get_video_details(test_client, mock_youtube_client):
    """Test the get video details endpoint."""
    # Mock the get_youtube_client dependency
    with patch('src.api.routes.youtube_search.get_youtube_client', return_value=mock_youtube_client):
        
        # Make the request
        response = test_client.get("/api/youtube/video/test1")
        
        # Check response
        assert response.status_code == 200
        result = response.json()
        
        # Check that the get_videos method was called
        mock_youtube_client.get_videos.assert_called_once_with(
            video_ids=["test1"],
            parts=["snippet", "contentDetails", "statistics"]
        )
        
        # Check result structure
        assert result["id"] == "test1"
        assert "snippet" in result
        assert "contentDetails" in result
        assert "statistics" in result


@pytest.mark.asyncio
async def test_get_video_details_not_found(test_client, mock_youtube_client):
    """Test the get video details endpoint with a video not found."""
    # Mock the get_youtube_client dependency
    mock_youtube_client.get_videos.return_value = {"items": []}
    
    with patch('src.api.routes.youtube_search.get_youtube_client', return_value=mock_youtube_client):
        
        # Make the request
        response = test_client.get("/api/youtube/video/nonexistent")
        
        # Check response
        assert response.status_code == 404
        result = response.json()
        assert "detail" in result
        assert "not found" in result["detail"]


@pytest.mark.asyncio
async def test_get_video_captions(test_client, mock_youtube_client):
    """Test the get video captions endpoint."""
    # Mock the get_youtube_client dependency
    with patch('src.api.routes.youtube_search.get_youtube_client', return_value=mock_youtube_client):
        
        # Make the request
        response = test_client.get("/api/youtube/captions/test1")
        
        # Check response
        assert response.status_code == 200
        result = response.json()
        
        # Check that the get_captions method was called
        mock_youtube_client.get_captions.assert_called_once_with(video_id="test1")
        
        # Check result structure
        assert "items" in result
        assert len(result["items"]) == 2
        assert result["items"][0]["id"] == "caption1"
        assert result["items"][1]["id"] == "caption2"


@pytest.mark.asyncio
async def test_download_caption(test_client, mock_youtube_client):
    """Test the download caption endpoint."""
    # Mock the get_youtube_client dependency
    with patch('src.api.routes.youtube_search.get_youtube_client', return_value=mock_youtube_client):
        
        # Make the request
        response = test_client.get("/api/youtube/caption/caption1?format=srt")
        
        # Check response
        assert response.status_code == 200
        result = response.text
        
        # Check that the download_caption method was called
        mock_youtube_client.download_caption.assert_called_once_with(
            caption_id="caption1",
            format="srt"
        )
        
        # Check result
        assert result == "Caption content"


@pytest.mark.asyncio
async def test_download_caption_error(test_client, mock_youtube_client):
    """Test the download caption endpoint with an error."""
    # Mock the get_youtube_client dependency to raise an exception
    mock_youtube_client.download_caption.side_effect = Exception("Test error")
    
    with patch('src.api.routes.youtube_search.get_youtube_client', return_value=mock_youtube_client):
        
        # Make the request
        response = test_client.get("/api/youtube/caption/caption1")
        
        # Check response
        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "Error downloading caption" in result["detail"] 