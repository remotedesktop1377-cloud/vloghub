"""
YouTube search service that integrates with the prompt enhancer.
"""
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta

from src.ai.prompt_enhancer import EnhancedPrompt
from src.services.youtube.client import YouTubeAPIClient

logger = logging.getLogger(__name__)


class YouTubeSearchService:
    """
    Service for searching YouTube videos using enhanced prompts.
    """
    
    def __init__(self, youtube_client: Optional[YouTubeAPIClient] = None):
        """
        Initialize the YouTube search service.
        
        Args:
            youtube_client: YouTube API client.
        """
        self.youtube_client = youtube_client or YouTubeAPIClient()
        logger.info("Initialized YouTube search service")
    
    async def search_with_enhanced_prompt(
        self,
        enhanced_prompt: EnhancedPrompt,
        max_results: int = 25,
        page_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search YouTube using an enhanced prompt.
        
        Args:
            enhanced_prompt: Enhanced prompt from the prompt enhancer.
            max_results: Maximum number of results to return.
            page_token: Token for pagination.
            
        Returns:
            Search results with additional metadata.
        """
        # Extract search parameters from the enhanced prompt
        search_params = enhanced_prompt.search_params.copy()
        
        # Use the primary query from the enhanced prompt
        query = enhanced_prompt.primary_query
        
        # Extract specific parameters
        published_after = search_params.pop("publishedAfter", None)
        published_before = search_params.pop("publishedBefore", None)
        region_code = search_params.pop("regionCode", None)
        relevance_language = search_params.pop("relevanceLanguage", None)
        video_caption = search_params.pop("videoCaption", None)
        video_license = search_params.pop("videoLicense", None)
        channel_id = search_params.pop("channelId", None)
        order = search_params.pop("order", "relevance")
        
        # Perform the search
        logger.info(f"Searching YouTube with query: {query}")
        search_results = self.youtube_client.search_videos(
            query=query,
            max_results=max_results,
            published_after=published_after,
            published_before=published_before,
            region_code=region_code,
            relevance_language=relevance_language,
            video_caption=video_caption,
            video_license=video_license,
            channel_id=channel_id,
            order=order,
            page_token=page_token
        )
        
        # Extract video IDs from search results
        video_ids = [item["id"]["videoId"] for item in search_results.get("items", [])]
        
        # Get detailed video information
        if video_ids:
            video_details = self.youtube_client.get_videos(
                video_ids=video_ids,
                parts=["snippet", "contentDetails", "statistics"]
            )
            
            # Create a mapping of video IDs to their details
            video_details_map = {
                item["id"]: item for item in video_details.get("items", [])
            }
            
            # Enhance search results with detailed information
            for item in search_results.get("items", []):
                video_id = item["id"]["videoId"]
                if video_id in video_details_map:
                    item["details"] = video_details_map[video_id]
        
        # Add enhanced prompt information to the results
        search_results["enhanced_prompt"] = {
            "original_prompt": enhanced_prompt.original_prompt,
            "primary_query": enhanced_prompt.primary_query,
            "alternative_queries": enhanced_prompt.alternative_queries,
            "entities": [entity.model_dump() for entity in enhanced_prompt.entities],
            "temporal_references": [ref.model_dump() for ref in enhanced_prompt.temporal_references],
            "location_references": [ref.model_dump() for ref in enhanced_prompt.location_references],
            "related_terms": [term.model_dump() for term in enhanced_prompt.related_terms]
        }
        
        return search_results
    
    async def try_alternative_queries(
        self,
        enhanced_prompt: EnhancedPrompt,
        max_results: int = 10,
        min_total_results: int = 25
    ) -> Dict[str, Any]:
        """
        Try alternative queries if the primary query doesn't return enough results.
        
        Args:
            enhanced_prompt: Enhanced prompt from the prompt enhancer.
            max_results: Maximum number of results per query.
            min_total_results: Minimum total results desired.
            
        Returns:
            Combined search results.
        """
        # First, search with the primary query
        primary_results = await self.search_with_enhanced_prompt(
            enhanced_prompt=enhanced_prompt,
            max_results=max_results
        )
        
        # Check if we have enough results
        total_results = len(primary_results.get("items", []))
        if total_results >= min_total_results:
            return primary_results
        
        # If not, try alternative queries
        all_results = primary_results.get("items", [])
        seen_video_ids = {item["id"]["videoId"] for item in all_results}
        
        # Try each alternative query
        for alt_query in enhanced_prompt.alternative_queries:
            # Skip if we already have enough results
            if len(all_results) >= min_total_results:
                break
            
            # Create a modified enhanced prompt with the alternative query
            alt_prompt = EnhancedPrompt(
                original_prompt=enhanced_prompt.original_prompt,
                primary_query=alt_query,
                alternative_queries=[],
                entities=enhanced_prompt.entities,
                temporal_references=enhanced_prompt.temporal_references,
                location_references=enhanced_prompt.location_references,
                related_terms=enhanced_prompt.related_terms,
                search_params=enhanced_prompt.search_params
            )
            
            # Search with the alternative query
            alt_results = await self.search_with_enhanced_prompt(
                enhanced_prompt=alt_prompt,
                max_results=max_results
            )
            
            # Add new results to the combined results
            for item in alt_results.get("items", []):
                video_id = item["id"]["videoId"]
                if video_id not in seen_video_ids:
                    all_results.append(item)
                    seen_video_ids.add(video_id)
        
        # Update the primary results with the combined results
        primary_results["items"] = all_results
        primary_results["totalResults"] = len(all_results)
        
        return primary_results
    
    def filter_results(
        self,
        search_results: Dict[str, Any],
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Filter search results based on various criteria.
        
        Args:
            search_results: Search results from YouTube API.
            filters: Filter criteria.
            
        Returns:
            Filtered search results.
        """
        filtered_items = search_results.get("items", [])
        
        # Filter by duration
        if "duration" in filters:
            duration_range = filters["duration"]
            filtered_items = [
                item for item in filtered_items
                if "details" in item and self._check_duration(
                    item["details"]["contentDetails"]["duration"],
                    duration_range
                )
            ]
        
        # Filter by view count
        if "viewCount" in filters:
            min_views = filters["viewCount"].get("min")
            max_views = filters["viewCount"].get("max")
            
            if min_views is not None or max_views is not None:
                filtered_items = [
                    item for item in filtered_items
                    if "details" in item and self._check_view_count(
                        item["details"]["statistics"].get("viewCount", "0"),
                        min_views,
                        max_views
                    )
                ]
        
        # Filter by publication date
        if "publishedAt" in filters:
            date_range = filters["publishedAt"]
            filtered_items = [
                item for item in filtered_items
                if self._check_publication_date(
                    item["snippet"]["publishedAt"],
                    date_range.get("min"),
                    date_range.get("max")
                )
            ]
        
        # Create a new result object with filtered items
        filtered_results = search_results.copy()
        filtered_results["items"] = filtered_items
        filtered_results["totalResults"] = len(filtered_items)
        
        return filtered_results
    
    def sort_results(
        self,
        search_results: Dict[str, Any],
        sort_by: str = "relevance",
        reverse: bool = False
    ) -> Dict[str, Any]:
        """
        Sort search results.
        
        Args:
            search_results: Search results from YouTube API.
            sort_by: Field to sort by.
            reverse: Whether to reverse the sort order.
            
        Returns:
            Sorted search results.
        """
        items = search_results.get("items", [])
        
        if sort_by == "relevance":
            # Already sorted by relevance by the API
            pass
        
        elif sort_by == "date":
            items.sort(
                key=lambda item: item["snippet"]["publishedAt"],
                reverse=reverse
            )
        
        elif sort_by == "viewCount":
            items.sort(
                key=lambda item: int(item.get("details", {}).get("statistics", {}).get("viewCount", 0)),
                reverse=reverse
            )
        
        elif sort_by == "duration":
            items.sort(
                key=lambda item: self._parse_duration(
                    item.get("details", {}).get("contentDetails", {}).get("duration", "PT0S")
                ),
                reverse=reverse
            )
        
        # Create a new result object with sorted items
        sorted_results = search_results.copy()
        sorted_results["items"] = items
        
        return sorted_results
    
    def _check_duration(self, duration_str: str, duration_range: Dict[str, Any]) -> bool:
        """
        Check if a video duration is within the specified range.
        
        Args:
            duration_str: ISO 8601 duration string (e.g., PT1H30M15S).
            duration_range: Dictionary with min and max duration in seconds.
            
        Returns:
            Whether the duration is within range.
        """
        duration_seconds = self._parse_duration(duration_str)
        
        min_duration = duration_range.get("min")
        max_duration = duration_range.get("max")
        
        if min_duration is not None and duration_seconds < min_duration:
            return False
        
        if max_duration is not None and duration_seconds > max_duration:
            return False
        
        return True
    
    def _parse_duration(self, duration_str: str) -> int:
        """
        Parse an ISO 8601 duration string to seconds.
        
        Args:
            duration_str: ISO 8601 duration string (e.g., PT1H30M15S).
            
        Returns:
            Duration in seconds.
        """
        if not duration_str:
            return 0
        
        # Remove the PT prefix
        duration_str = duration_str[2:]
        
        hours = 0
        minutes = 0
        seconds = 0
        
        # Parse hours
        if "H" in duration_str:
            hours_str, duration_str = duration_str.split("H")
            hours = int(hours_str)
        
        # Parse minutes
        if "M" in duration_str:
            minutes_str, duration_str = duration_str.split("M")
            minutes = int(minutes_str)
        
        # Parse seconds
        if "S" in duration_str:
            seconds_str = duration_str.split("S")[0]
            seconds = int(seconds_str)
        
        return hours * 3600 + minutes * 60 + seconds
    
    def _check_view_count(
        self,
        view_count_str: str,
        min_views: Optional[int],
        max_views: Optional[int]
    ) -> bool:
        """
        Check if a view count is within the specified range.
        
        Args:
            view_count_str: View count as a string.
            min_views: Minimum view count.
            max_views: Maximum view count.
            
        Returns:
            Whether the view count is within range.
        """
        try:
            view_count = int(view_count_str)
        except (ValueError, TypeError):
            return False
        
        if min_views is not None and view_count < min_views:
            return False
        
        if max_views is not None and view_count > max_views:
            return False
        
        return True
    
    def _check_publication_date(
        self,
        published_at: str,
        min_date: Optional[str],
        max_date: Optional[str]
    ) -> bool:
        """
        Check if a publication date is within the specified range.
        
        Args:
            published_at: ISO 8601 datetime string.
            min_date: Minimum date as ISO 8601 string.
            max_date: Maximum date as ISO 8601 string.
            
        Returns:
            Whether the date is within range.
        """
        try:
            pub_date = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            
            if min_date:
                min_datetime = datetime.fromisoformat(min_date.replace("Z", "+00:00"))
                if pub_date < min_datetime:
                    return False
            
            if max_date:
                max_datetime = datetime.fromisoformat(max_date.replace("Z", "+00:00"))
                if pub_date > max_datetime:
                    return False
            
            return True
        
        except (ValueError, TypeError):
            return False 