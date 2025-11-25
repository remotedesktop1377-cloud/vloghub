"""
Tests for the YouTube API client.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json

from googleapiclient.errors import HttpError
from google.auth.exceptions import GoogleAuthError

from backend.services.youtube.client import YouTubeAPIClient
from backend.services.youtube.auth import APIKeyManager
from backend.services.youtube.cache import RequestCache


@pytest.fixture
def mock_api_key_manager():
    """Fixture for a mock API key manager."""
    mock_manager = MagicMock(spec=APIKeyManager)
    mock_manager.get_available_key.return_value = "test_key"
    mock_manager.get_api_key.return_value = "test_key"
    mock_manager.rotate_key.return_value = "test_key_2"
    return mock_manager


@pytest.fixture
def mock_cache():
    """Fixture for a mock request cache."""
    mock_cache = MagicMock(spec=RequestCache)
    mock_cache.get.return_value = None  # No cache hits by default
    return mock_cache


@pytest.fixture
def mock_youtube_service():
    """Fixture for a mock YouTube service."""
    mock_service = MagicMock()
    
    # Mock search
    mock_search = MagicMock()
    mock_search.list.return_value.execute.return_value = {
        "items": [
            {"id": {"videoId": "test1"}, "snippet": {"title": "Test Video 1"}},
            {"id": {"videoId": "test2"}, "snippet": {"title": "Test Video 2"}}
        ],
        "nextPageToken": "next_token",
        "pageInfo": {"totalResults": 2, "resultsPerPage": 2}
    }
    mock_service.search.return_value = mock_search
    
    # Mock videos
    mock_videos = MagicMock()
    mock_videos.list.return_value.execute.return_value = {
        "items": [
            {"id": "test1", "snippet": {"title": "Test Video 1"}, "contentDetails": {}, "statistics": {}},
            {"id": "test2", "snippet": {"title": "Test Video 2"}, "contentDetails": {}, "statistics": {}}
        ]
    }
    mock_service.videos.return_value = mock_videos
    
    # Mock captions
    mock_captions = MagicMock()
    mock_captions.list.return_value.execute.return_value = {
        "items": [
            {"id": "caption1", "snippet": {"language": "en"}},
            {"id": "caption2", "snippet": {"language": "fr"}}
        ]
    }
    mock_service.captions.return_value = mock_captions
    
    return mock_service


@pytest.fixture
def youtube_client(mock_api_key_manager, mock_cache, mock_youtube_service):
    """Fixture for a YouTube API client with mocked dependencies."""
    with patch("backend.services.youtube.client.build", return_value=mock_youtube_service):
        client = YouTubeAPIClient(
            api_key_manager=mock_api_key_manager,
            cache=mock_cache
        )
        yield client


def test_init(mock_api_key_manager, mock_cache):
    """Test initializing the YouTube API client."""
    client = YouTubeAPIClient(
        api_key_manager=mock_api_key_manager,
        cache=mock_cache,
        max_retries=5,
        retry_delay=2.0,
        quota_limit=5000
    )
    
    assert client.api_key_manager == mock_api_key_manager
    assert client.cache == mock_cache
    assert client.max_retries == 5
    assert client.retry_delay == 2.0
    assert client._service is None


def test_service_property(youtube_client, mock_youtube_service):
    """Test the service property."""
    # First access should create the service
    assert youtube_client.service == mock_youtube_service
    
    # Service should be cached
    assert youtube_client._service == mock_youtube_service


def test_reset_service(youtube_client, mock_youtube_service):
    """Test resetting the service."""
    # Access service to create it
    youtube_client.service
    
    # Reset service
    youtube_client._reset_service()
    
    # Service should be None
    assert youtube_client._service is None
    
    # Mock service close method should be called
    mock_youtube_service.close.assert_called_once()


def test_search_videos(youtube_client, mock_cache):
    """Test searching for videos."""
    # Mock cache to return None (cache miss)
    mock_cache.get.return_value = None
    
    # Call search_videos
    result = youtube_client.search_videos(
        query="test query",
        max_results=10,
        published_after="2020-01-01T00:00:00Z",
        published_before="2021-01-01T00:00:00Z",
        region_code="US",
        relevance_language="en",
        video_caption="closedCaption",
        video_license="creativeCommon",
        channel_id="test_channel",
        order="relevance",
        page_token="page_token"
    )
    
    # Check result
    assert "items" in result
    assert len(result["items"]) == 2
    
    # Check that cache was checked
    mock_cache.get.assert_called_once()
    
    # Check that cache was set with the result
    mock_cache.set.assert_called_once()
    
    # Check that API usage was recorded
    youtube_client.api_key_manager.record_usage.assert_called_once_with(
        "test_key", youtube_client.QUOTA_COSTS["search"]
    )


def test_search_videos_with_cache_hit(youtube_client, mock_cache):
    """Test searching for videos with a cache hit."""
    # Mock cache to return a cached result
    cached_result = {"items": [{"id": "cached"}]}
    mock_cache.get.return_value = cached_result
    
    # Call search_videos
    result = youtube_client.search_videos(query="test query")
    
    # Check result
    assert result == cached_result
    
    # Check that cache was checked
    mock_cache.get.assert_called_once()
    
    # Check that API was not called (no cache set)
    mock_cache.set.assert_not_called()
    
    # Check that API usage was not recorded
    youtube_client.api_key_manager.record_usage.assert_not_called()


def test_get_videos(youtube_client):
    """Test getting video details."""
    # Call get_videos
    result = youtube_client.get_videos(
        video_ids=["test1", "test2"],
        parts=["snippet", "contentDetails"]
    )
    
    # Check result
    assert "items" in result
    assert len(result["items"]) == 2
    
    # Check that API usage was recorded
    youtube_client.api_key_manager.record_usage.assert_called_once_with(
        "test_key", youtube_client.QUOTA_COSTS["videos"]
    )


def test_get_videos_empty_ids(youtube_client):
    """Test getting video details with empty IDs."""
    # Call get_videos with empty IDs
    result = youtube_client.get_videos(video_ids=[])
    
    # Check result
    assert result == {"items": []}
    
    # Check that API was not called
    youtube_client.service.videos.assert_not_called()


def test_get_videos_too_many_ids(youtube_client):
    """Test getting video details with too many IDs."""
    # Call get_videos with 51 IDs (over the limit)
    video_ids = [f"id{i}" for i in range(51)]
    result = youtube_client.get_videos(video_ids=video_ids)
    
    # Check that only 50 IDs were used
    youtube_client.service.videos.return_value.list.assert_called_once()
    call_args = youtube_client.service.videos.return_value.list.call_args[1]
    assert "id" in call_args
    assert len(call_args["id"].split(",")) == 50


def test_get_captions(youtube_client):
    """Test getting video captions."""
    # Call get_captions
    result = youtube_client.get_captions(video_id="test_video")
    
    # Check result
    assert "items" in result
    assert len(result["items"]) == 2
    
    # Check that API usage was recorded
    youtube_client.api_key_manager.record_usage.assert_called_once_with(
        "test_key", youtube_client.QUOTA_COSTS["captions"]
    )


@patch("backend.services.youtube.client.httpx")
def test_download_caption(mock_httpx, youtube_client, mock_cache):
    """Test downloading a caption track."""
    # Mock httpx response
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.text = "Caption content"
    mock_httpx.get.return_value = mock_response
    
    # Mock cache to return None (cache miss)
    mock_cache.get.return_value = None
    
    # Call download_caption
    result = youtube_client.download_caption(caption_id="caption1", format="srt")
    
    # Check result
    assert result == "Caption content"
    
    # Check that httpx was called with the correct URL and params
    mock_httpx.get.assert_called_once()
    call_args = mock_httpx.get.call_args
    assert "https://www.googleapis.com/youtube/v3/captions/caption1" in call_args[0]
    assert call_args[1]["params"]["tfmt"] == "srt"
    assert call_args[1]["params"]["key"] == "test_key"
    
    # Check that API usage was recorded
    youtube_client.api_key_manager.record_usage.assert_called_once_with(
        "test_key", youtube_client.QUOTA_COSTS["captions"]
    )
    
    # Check that cache was set with the result
    mock_cache.set.assert_called_once()


@patch("backend.services.youtube.client.httpx")
def test_download_caption_with_cache_hit(mock_httpx, youtube_client, mock_cache):
    """Test downloading a caption track with a cache hit."""
    # Mock cache to return a cached result
    mock_cache.get.return_value = "Cached caption content"
    
    # Call download_caption
    result = youtube_client.download_caption(caption_id="caption1")
    
    # Check result
    assert result == "Cached caption content"
    
    # Check that cache was checked
    mock_cache.get.assert_called_once()
    
    # Check that httpx was not called
    mock_httpx.get.assert_not_called()
    
    # Check that API usage was not recorded
    youtube_client.api_key_manager.record_usage.assert_not_called()


@patch("backend.services.youtube.client.time.sleep")
def test_execute_with_retry_http_error(mock_sleep, youtube_client):
    """Test retry logic with HTTP errors."""
    # Mock request function to raise HttpError
    mock_request = MagicMock()
    mock_response = MagicMock()
    mock_response.status = 500
    mock_error = HttpError(resp=mock_response, content=b"Server error")
    mock_request.side_effect = [mock_error, mock_error, {"result": "success"}]
    
    # Call _execute_with_retry
    result = youtube_client._execute_with_retry(
        "search",
        mock_request,
        {"q": "test"}
    )
    
    # Check result
    assert result == {"result": "success"}
    
    # Check that request was called 3 times
    assert mock_request.call_count == 3
    
    # Check that sleep was called twice
    assert mock_sleep.call_count == 2
    
    # Check that errors were recorded
    assert youtube_client.api_key_manager.record_error.call_count == 2


@patch("backend.services.youtube.client.time.sleep")
def test_execute_with_retry_quota_exceeded(mock_sleep, youtube_client):
    """Test retry logic with quota exceeded errors."""
    # Mock request function to raise HttpError with quota exceeded
    mock_request = MagicMock()
    mock_response = MagicMock()
    mock_response.status = 403
    mock_error = HttpError(resp=mock_response, content=b"Quota exceeded")
    mock_request.side_effect = [mock_error, {"result": "success"}]
    
    # Call _execute_with_retry
    result = youtube_client._execute_with_retry(
        "search",
        mock_request,
        {"q": "test"}
    )
    
    # Check result
    assert result == {"result": "success"}
    
    # Check that request was called twice
    assert mock_request.call_count == 2
    
    # Check that API key was rotated
    youtube_client.api_key_manager.rotate_key.assert_called_once()
    
    # Check that service was reset
    assert youtube_client._service is None


@patch("backend.services.youtube.client.time.sleep")
def test_execute_with_retry_auth_error(mock_sleep, youtube_client):
    """Test retry logic with authentication errors."""
    # Mock request function to raise GoogleAuthError
    mock_request = MagicMock()
    mock_error = GoogleAuthError("Auth error")
    mock_request.side_effect = [mock_error, {"result": "success"}]
    
    # Call _execute_with_retry
    result = youtube_client._execute_with_retry(
        "search",
        mock_request,
        {"q": "test"}
    )
    
    # Check result
    assert result == {"result": "success"}
    
    # Check that request was called twice
    assert mock_request.call_count == 2
    
    # Check that API key was rotated
    youtube_client.api_key_manager.rotate_key.assert_called_once()
    
    # Check that service was reset
    assert youtube_client._service is None


@patch("backend.services.youtube.client.time.sleep")
def test_execute_with_retry_max_retries(mock_sleep, youtube_client):
    """Test retry logic with maximum retries exceeded."""
    # Mock request function to always raise HttpError
    mock_request = MagicMock()
    mock_response = MagicMock()
    mock_response.status = 500
    mock_error = HttpError(resp=mock_response, content=b"Server error")
    mock_request.side_effect = mock_error
    
    # Set max_retries to 2
    youtube_client.max_retries = 2
    
    # Call _execute_with_retry and expect an error
    with pytest.raises(HttpError):
        youtube_client._execute_with_retry(
            "search",
            mock_request,
            {"q": "test"}
        )
    
    # Check that request was called 3 times (initial + 2 retries)
    assert mock_request.call_count == 3
    
    # Check that sleep was called twice
    assert mock_sleep.call_count == 2 