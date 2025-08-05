"""
YouTube API client with error handling and retry logic.
"""
import time
import logging
from typing import Dict, Any, Optional, List, Callable, TypeVar, Generic, Union, cast

import httpx
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.exceptions import GoogleAuthError

from src.services.youtube.auth import APIKeyManager
from src.services.youtube.cache import RequestCache

logger = logging.getLogger(__name__)

T = TypeVar('T')


class YouTubeAPIClient:
    """
    YouTube API client with error handling, retry logic, and caching.
    """
    
    # YouTube API endpoints
    ENDPOINT_SEARCH = "search"
    ENDPOINT_VIDEOS = "videos"
    ENDPOINT_CHANNELS = "channels"
    ENDPOINT_PLAYLISTS = "playlists"
    ENDPOINT_PLAYLIST_ITEMS = "playlistItems"
    ENDPOINT_CAPTIONS = "captions"
    
    # Cost in quota units for different operations
    QUOTA_COSTS = {
        ENDPOINT_SEARCH: 100,
        ENDPOINT_VIDEOS: 1,
        ENDPOINT_CHANNELS: 1,
        ENDPOINT_PLAYLISTS: 1,
        ENDPOINT_PLAYLIST_ITEMS: 1,
        ENDPOINT_CAPTIONS: 50
    }
    
    def __init__(
        self,
        api_key_manager: Optional[APIKeyManager] = None,
        cache: Optional[RequestCache] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        quota_limit: int = 10000
    ):
        """
        Initialize the YouTube API client.
        
        Args:
            api_key_manager: API key manager for authentication.
            cache: Request cache for minimizing API usage.
            max_retries: Maximum number of retries for failed requests.
            retry_delay: Delay between retries in seconds.
            quota_limit: Daily quota limit per API key.
        """
        self.api_key_manager = api_key_manager or APIKeyManager(quota_limit=quota_limit)
        self.cache = cache or RequestCache()
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self._service = None
        
        logger.info("Initialized YouTube API client")
    
    @property
    def service(self):
        """
        Get or create the YouTube API service.
        
        Returns:
            YouTube API service.
        """
        if self._service is None:
            api_key = self.api_key_manager.get_available_key()
            self._service = build('youtube', 'v3', developerKey=api_key)
        return self._service
    
    def _reset_service(self):
        """Reset the YouTube API service."""
        if self._service is not None:
            self._service.close()
            self._service = None
    
    def _execute_with_retry(
        self,
        endpoint: str,
        request_fn: Callable[[], T],
        params: Dict[str, Any]
    ) -> T:
        """
        Execute a request with retry logic and caching.
        
        Args:
            endpoint: API endpoint name.
            request_fn: Function to execute the request.
            params: Request parameters for caching.
            
        Returns:
            API response.
            
        Raises:
            HttpError: If the request fails after all retries.
        """
        # Check cache first
        cached_response = self.cache.get(endpoint, params)
        if cached_response is not None:
            return cached_response
        
        # Get quota cost for this endpoint
        quota_cost = self.QUOTA_COSTS.get(endpoint, 1)
        
        retries = 0
        current_delay = self.retry_delay
        
        while True:
            try:
                # Get current API key
                api_key = self.api_key_manager.get_available_key()
                
                # Execute the request
                response = request_fn()
                
                # Record usage
                self.api_key_manager.record_usage(api_key, quota_cost)
                
                # Cache the response
                self.cache.set(endpoint, params, response)
                
                return response
            
            except HttpError as e:
                # Record the error
                api_key = self.api_key_manager.get_api_key()
                self.api_key_manager.record_error(api_key, e)
                
                # Check if we should retry
                if retries >= self.max_retries:
                    logger.error(f"Request failed after {retries} retries: {e}")
                    raise
                
                # Check error type
                status_code = e.resp.status
                
                # Handle specific error codes
                if status_code == 403:
                    # Quota exceeded or access denied
                    if "quota" in str(e).lower():
                        logger.warning(f"Quota exceeded for API key, rotating to next key")
                        self.api_key_manager.rotate_key()
                        self._reset_service()
                    else:
                        # Other 403 error, may need to wait
                        logger.warning(f"Access denied: {e}")
                        time.sleep(current_delay)
                
                elif status_code == 429:
                    # Rate limiting, wait and retry
                    logger.warning(f"Rate limited, waiting {current_delay}s before retry")
                    time.sleep(current_delay)
                    current_delay *= 2  # Exponential backoff
                
                elif status_code >= 500:
                    # Server error, wait and retry
                    logger.warning(f"Server error ({status_code}), waiting {current_delay}s before retry")
                    time.sleep(current_delay)
                    current_delay *= 1.5  # Exponential backoff
                
                else:
                    # Client error, likely won't be resolved by retrying
                    logger.error(f"Client error ({status_code}): {e}")
                    raise
                
                retries += 1
                logger.info(f"Retrying request (attempt {retries}/{self.max_retries})")
            
            except GoogleAuthError as e:
                # Authentication error, rotate key
                api_key = self.api_key_manager.get_api_key()
                self.api_key_manager.record_error(api_key, e)
                logger.warning(f"Authentication error, rotating API key: {e}")
                
                self.api_key_manager.rotate_key()
                self._reset_service()
                
                if retries >= self.max_retries:
                    logger.error(f"Authentication failed after {retries} retries")
                    raise
                
                retries += 1
            
            except Exception as e:
                # Unexpected error
                logger.error(f"Unexpected error: {e}")
                
                if retries >= self.max_retries:
                    logger.error(f"Request failed after {retries} retries")
                    raise
                
                time.sleep(current_delay)
                retries += 1
    
    def search_videos(
        self,
        query: str,
        max_results: int = 25,
        published_after: Optional[str] = None,
        published_before: Optional[str] = None,
        region_code: Optional[str] = None,
        relevance_language: Optional[str] = None,
        video_caption: Optional[str] = None,
        video_license: Optional[str] = None,
        channel_id: Optional[str] = None,
        order: str = "relevance",
        page_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for videos on YouTube.
        
        Args:
            query: Search query.
            max_results: Maximum number of results to return (default: 25, max: 50).
            published_after: ISO 8601 timestamp (e.g., 2020-01-01T00:00:00Z).
            published_before: ISO 8601 timestamp (e.g., 2021-01-01T00:00:00Z).
            region_code: ISO 3166-1 alpha-2 country code (e.g., US).
            relevance_language: ISO 639-1 two-letter language code (e.g., en).
            video_caption: Whether videos should have captions ("any", "closedCaption", "none").
            video_license: License filter ("any", "creativeCommon", "youtube").
            channel_id: Limit results to a specific channel.
            order: Order of results ("relevance", "date", "rating", "viewCount", "title").
            page_token: Token for pagination.
            
        Returns:
            Search results.
        """
        # Build parameters
        params = {
            "q": query,
            "part": "snippet",
            "maxResults": min(max_results, 50),  # API limit is 50
            "type": "video",
            "order": order
        }
        
        # Add optional parameters
        if published_after:
            params["publishedAfter"] = published_after
        if published_before:
            params["publishedBefore"] = published_before
        if region_code:
            params["regionCode"] = region_code
        if relevance_language:
            params["relevanceLanguage"] = relevance_language
        if video_caption:
            params["videoCaption"] = video_caption
        if video_license:
            params["videoLicense"] = video_license
        if channel_id:
            params["channelId"] = channel_id
        if page_token:
            params["pageToken"] = page_token
        
        # Execute the request
        return self._execute_with_retry(
            self.ENDPOINT_SEARCH,
            lambda: self.service.search().list(**params).execute(),
            params
        )
    
    def get_videos(
        self,
        video_ids: List[str],
        parts: List[str] = ["snippet", "contentDetails", "statistics"]
    ) -> Dict[str, Any]:
        """
        Get details for specific videos.
        
        Args:
            video_ids: List of video IDs.
            parts: Parts of the video to retrieve.
            
        Returns:
            Video details.
        """
        if not video_ids:
            return {"items": []}
        
        # API has a limit of 50 video IDs per request
        if len(video_ids) > 50:
            logger.warning(f"More than 50 video IDs provided, truncating to 50")
            video_ids = video_ids[:50]
        
        params = {
            "id": ",".join(video_ids),
            "part": ",".join(parts)
        }
        
        return self._execute_with_retry(
            self.ENDPOINT_VIDEOS,
            lambda: self.service.videos().list(**params).execute(),
            params
        )
    
    def get_captions(self, video_id: str) -> Dict[str, Any]:
        """
        Get available captions for a video.
        
        Args:
            video_id: Video ID.
            
        Returns:
            Available captions.
        """
        params = {
            "videoId": video_id,
            "part": "snippet"
        }
        
        return self._execute_with_retry(
            self.ENDPOINT_CAPTIONS,
            lambda: self.service.captions().list(**params).execute(),
            params
        )
    
    def download_caption(self, caption_id: str, format: str = "srt") -> str:
        """
        Download a specific caption track.
        
        Args:
            caption_id: Caption ID.
            format: Caption format ("srt" or "vtt").
            
        Returns:
            Caption content as text.
        """
        params = {
            "id": caption_id,
            "tfmt": format
        }
        
        # This endpoint doesn't support caching through the regular mechanism
        # because it returns raw text, not JSON
        cache_key = f"caption_{caption_id}_{format}"
        cached_caption = self.cache.get("caption_download", {"key": cache_key})
        if cached_caption:
            return cached_caption
        
        # We need to handle this request differently since it returns raw text
        api_key = self.api_key_manager.get_available_key()
        
        url = f"https://www.googleapis.com/youtube/v3/captions/{caption_id}"
        params = {
            "tfmt": format,
            "key": api_key
        }
        
        retries = 0
        current_delay = self.retry_delay
        
        while True:
            try:
                response = httpx.get(url, params=params)
                response.raise_for_status()
                
                # Record usage
                self.api_key_manager.record_usage(api_key, self.QUOTA_COSTS[self.ENDPOINT_CAPTIONS])
                
                caption_text = response.text
                
                # Cache the response
                self.cache.set("caption_download", {"key": cache_key}, caption_text)
                
                return caption_text
            
            except httpx.HTTPStatusError as e:
                # Record the error
                self.api_key_manager.record_error(api_key, e)
                
                # Check if we should retry
                if retries >= self.max_retries:
                    logger.error(f"Caption download failed after {retries} retries: {e}")
                    raise
                
                # Handle specific error codes
                status_code = e.response.status_code
                
                if status_code == 403:
                    # Quota exceeded or access denied
                    if "quota" in str(e).lower():
                        logger.warning(f"Quota exceeded for API key, rotating to next key")
                        api_key = self.api_key_manager.rotate_key()
                        params["key"] = api_key
                    else:
                        # Other 403 error, may need to wait
                        logger.warning(f"Access denied: {e}")
                        time.sleep(current_delay)
                
                elif status_code == 429:
                    # Rate limiting, wait and retry
                    logger.warning(f"Rate limited, waiting {current_delay}s before retry")
                    time.sleep(current_delay)
                    current_delay *= 2  # Exponential backoff
                
                elif status_code >= 500:
                    # Server error, wait and retry
                    logger.warning(f"Server error ({status_code}), waiting {current_delay}s before retry")
                    time.sleep(current_delay)
                    current_delay *= 1.5  # Exponential backoff
                
                else:
                    # Client error, likely won't be resolved by retrying
                    logger.error(f"Client error ({status_code}): {e}")
                    raise
                
                retries += 1
                logger.info(f"Retrying caption download (attempt {retries}/{self.max_retries})")
            
            except Exception as e:
                # Unexpected error
                logger.error(f"Unexpected error during caption download: {e}")
                
                if retries >= self.max_retries:
                    logger.error(f"Caption download failed after {retries} retries")
                    raise
                
                time.sleep(current_delay)
                retries += 1 