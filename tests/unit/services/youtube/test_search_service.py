"""
Tests for the YouTube search service.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from src.services.youtube import YouTubeAPIClient
from src.services.youtube.search import YouTubeSearchService
from src.ai.prompt_enhancer.models import (
    EnhancedPrompt, Entity, TemporalReference, LocationReference, RelatedTerm
)


@pytest.fixture
def mock_youtube_client():
    """Fixture for a mock YouTube API client."""
    mock_client = MagicMock(spec=YouTubeAPIClient)
    
    # Mock search_videos
    mock_client.search_videos.return_value = {
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {
                    "title": "Test Video 1",
                    "description": "Test description 1",
                    "publishedAt": "2020-01-01T00:00:00Z"
                }
            },
            {
                "id": {"videoId": "test2"},
                "snippet": {
                    "title": "Test Video 2",
                    "description": "Test description 2",
                    "publishedAt": "2020-02-01T00:00:00Z"
                }
            }
        ],
        "nextPageToken": "next_token",
        "pageInfo": {"totalResults": 2, "resultsPerPage": 2}
    }
    
    # Mock get_videos
    mock_client.get_videos.return_value = {
        "items": [
            {
                "id": "test1",
                "snippet": {"title": "Test Video 1"},
                "contentDetails": {"duration": "PT1H30M"},
                "statistics": {"viewCount": "1000"}
            },
            {
                "id": "test2",
                "snippet": {"title": "Test Video 2"},
                "contentDetails": {"duration": "PT45M"},
                "statistics": {"viewCount": "2000"}
            }
        ]
    }
    
    return mock_client


@pytest.fixture
def enhanced_prompt():
    """Fixture for an enhanced prompt."""
    return EnhancedPrompt(
        original_prompt="Nelson Mandela speech after prison release in 1990",
        primary_query="Nelson Mandela speech after prison release 1990",
        alternative_queries=[
            "Mandela freedom speech 1990",
            "Nelson Mandela first speech after imprisonment"
        ],
        entities=[
            Entity(
                text="Nelson Mandela",
                type="person",
                confidence=0.95,
                start_char=0,
                end_char=13
            )
        ],
        temporal_references=[
            TemporalReference(
                text="1990",
                type="year",
                normalized_value="1990",
                start_date="1990-01-01",
                end_date="1990-12-31",
                confidence=0.9
            )
        ],
        location_references=[
            LocationReference(
                text="South Africa",
                normalized_name="South Africa",
                country_code="ZA",
                confidence=0.95
            )
        ],
        related_terms=[
            RelatedTerm(
                text="ANC",
                relation_type="organization",
                source_entity="Nelson Mandela",
                confidence=0.9
            )
        ],
        search_params={
            "publishedAfter": "1990-01-01T00:00:00Z",
            "publishedBefore": "1990-12-31T23:59:59Z",
            "regionCode": "ZA",
            "order": "relevance"
        }
    )


@pytest.fixture
def search_service(mock_youtube_client):
    """Fixture for a YouTube search service."""
    return YouTubeSearchService(youtube_client=mock_youtube_client)


@pytest.mark.asyncio
async def test_search_with_enhanced_prompt(search_service, mock_youtube_client, enhanced_prompt):
    """Test searching with an enhanced prompt."""
    # Call search_with_enhanced_prompt
    result = await search_service.search_with_enhanced_prompt(
        enhanced_prompt=enhanced_prompt,
        max_results=10,
        page_token="page_token"
    )
    
    # Check that YouTube client was called with correct parameters
    mock_youtube_client.search_videos.assert_called_once_with(
        query="Nelson Mandela speech after prison release 1990",
        max_results=10,
        published_after="1990-01-01T00:00:00Z",
        published_before="1990-12-31T23:59:59Z",
        region_code="ZA",
        relevance_language=None,
        video_caption=None,
        video_license=None,
        channel_id=None,
        order="relevance",
        page_token="page_token"
    )
    
    # Check that video details were fetched
    mock_youtube_client.get_videos.assert_called_once_with(
        video_ids=["test1", "test2"],
        parts=["snippet", "contentDetails", "statistics"]
    )
    
    # Check result
    assert "items" in result
    assert len(result["items"]) == 2
    assert "details" in result["items"][0]
    assert "enhanced_prompt" in result
    assert result["enhanced_prompt"]["original_prompt"] == enhanced_prompt.original_prompt


@pytest.mark.asyncio
async def test_try_alternative_queries_enough_results(search_service, enhanced_prompt):
    """Test trying alternative queries when there are already enough results."""
    # Mock search_with_enhanced_prompt to return enough results
    search_service.search_with_enhanced_prompt = AsyncMock(return_value={
        "items": [{"id": {"videoId": f"test{i}"}} for i in range(30)],
        "pageInfo": {"totalResults": 30, "resultsPerPage": 30}
    })
    
    # Call try_alternative_queries
    result = await search_service.try_alternative_queries(
        enhanced_prompt=enhanced_prompt,
        max_results=10,
        min_total_results=25
    )
    
    # Check that search_with_enhanced_prompt was called once with primary query
    search_service.search_with_enhanced_prompt.assert_called_once()
    
    # Check result
    assert "items" in result
    assert len(result["items"]) == 30


@pytest.mark.asyncio
async def test_try_alternative_queries_not_enough_results(search_service, enhanced_prompt):
    """Test trying alternative queries when there are not enough results."""
    # Mock search_with_enhanced_prompt to return different results for different queries
    async def mock_search(enhanced_prompt, max_results, page_token=None):
        query = enhanced_prompt.primary_query
        if "freedom" in query:
            return {
                "items": [{"id": {"videoId": f"alt1_{i}"}} for i in range(10)],
                "pageInfo": {"totalResults": 10, "resultsPerPage": 10}
            }
        elif "first speech" in query:
            return {
                "items": [{"id": {"videoId": f"alt2_{i}"}} for i in range(10)],
                "pageInfo": {"totalResults": 10, "resultsPerPage": 10}
            }
        else:
            return {
                "items": [{"id": {"videoId": f"primary_{i}"}} for i in range(10)],
                "pageInfo": {"totalResults": 10, "resultsPerPage": 10}
            }
    
    search_service.search_with_enhanced_prompt = AsyncMock(side_effect=mock_search)
    
    # Call try_alternative_queries
    result = await search_service.try_alternative_queries(
        enhanced_prompt=enhanced_prompt,
        max_results=10,
        min_total_results=25
    )
    
    # Check that search_with_enhanced_prompt was called for each query
    assert search_service.search_with_enhanced_prompt.call_count == 3
    
    # Check result
    assert "items" in result
    assert len(result["items"]) == 30  # 10 from each query


def test_filter_results_duration(search_service):
    """Test filtering results by duration."""
    # Create search results with video details
    search_results = {
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {"title": "Test Video 1"},
                "details": {
                    "contentDetails": {"duration": "PT30M"},  # 30 minutes
                    "statistics": {"viewCount": "1000"}
                }
            },
            {
                "id": {"videoId": "test2"},
                "snippet": {"title": "Test Video 2"},
                "details": {
                    "contentDetails": {"duration": "PT1H30M"},  # 1 hour 30 minutes
                    "statistics": {"viewCount": "2000"}
                }
            },
            {
                "id": {"videoId": "test3"},
                "snippet": {"title": "Test Video 3"},
                "details": {
                    "contentDetails": {"duration": "PT10M"},  # 10 minutes
                    "statistics": {"viewCount": "3000"}
                }
            }
        ]
    }
    
    # Filter by duration (15-60 minutes)
    filters = {
        "duration": {
            "min": 15 * 60,  # 15 minutes in seconds
            "max": 60 * 60   # 60 minutes in seconds
        }
    }
    
    filtered_results = search_service.filter_results(search_results, filters)
    
    # Check result
    assert len(filtered_results["items"]) == 1
    assert filtered_results["items"][0]["id"]["videoId"] == "test1"


def test_filter_results_view_count(search_service):
    """Test filtering results by view count."""
    # Create search results with video details
    search_results = {
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {"title": "Test Video 1"},
                "details": {
                    "contentDetails": {"duration": "PT30M"},
                    "statistics": {"viewCount": "1000"}
                }
            },
            {
                "id": {"videoId": "test2"},
                "snippet": {"title": "Test Video 2"},
                "details": {
                    "contentDetails": {"duration": "PT1H30M"},
                    "statistics": {"viewCount": "2000"}
                }
            },
            {
                "id": {"videoId": "test3"},
                "snippet": {"title": "Test Video 3"},
                "details": {
                    "contentDetails": {"duration": "PT10M"},
                    "statistics": {"viewCount": "3000"}
                }
            }
        ]
    }
    
    # Filter by view count (1500-2500)
    filters = {
        "viewCount": {
            "min": 1500,
            "max": 2500
        }
    }
    
    filtered_results = search_service.filter_results(search_results, filters)
    
    # Check result
    assert len(filtered_results["items"]) == 1
    assert filtered_results["items"][0]["id"]["videoId"] == "test2"


def test_filter_results_publication_date(search_service):
    """Test filtering results by publication date."""
    # Create search results
    search_results = {
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {
                    "title": "Test Video 1",
                    "publishedAt": "2020-01-01T00:00:00Z"
                }
            },
            {
                "id": {"videoId": "test2"},
                "snippet": {
                    "title": "Test Video 2",
                    "publishedAt": "2021-01-01T00:00:00Z"
                }
            },
            {
                "id": {"videoId": "test3"},
                "snippet": {
                    "title": "Test Video 3",
                    "publishedAt": "2022-01-01T00:00:00Z"
                }
            }
        ]
    }
    
    # Filter by publication date (2020-06-01 to 2021-06-01)
    filters = {
        "publishedAt": {
            "min": "2020-06-01T00:00:00Z",
            "max": "2021-06-01T00:00:00Z"
        }
    }
    
    filtered_results = search_service.filter_results(search_results, filters)
    
    # Check result
    assert len(filtered_results["items"]) == 1
    assert filtered_results["items"][0]["id"]["videoId"] == "test2"


def test_sort_results_by_date(search_service):
    """Test sorting results by publication date."""
    # Create search results
    search_results = {
        "items": [
            {
                "id": {"videoId": "test1"},
                "snippet": {
                    "title": "Test Video 1",
                    "publishedAt": "2021-01-01T00:00:00Z"
                }
            },
            {
                "id": {"videoId": "test2"},
                "snippet": {
                    "title": "Test Video 2",
                    "publishedAt": "2020-01-01T00:00:00Z"
                }
            },
            {
                "id": {"videoId": "test3"},
                "snippet": {
                    "title": "Test Video 3",
                    "publishedAt": "2022-01-01T00:00:00Z"
                }
            }
        ]
    }
    
    # Sort by date (ascending)
    sorted_results = search_service.sort_results(
        search_results=search_results,
        sort_by="date",
        reverse=False
    )
    
    # Check result
    assert sorted_results["items"][0]["id"]["videoId"] == "test2"  # 2020
    assert sorted_results["items"][1]["id"]["videoId"] == "test1"  # 2021
    assert sorted_results["items"][2]["id"]["videoId"] == "test3"  # 2022
    
    # Sort by date (descending)
    sorted_results = search_service.sort_results(
        search_results=search_results,
        sort_by="date",
        reverse=True
    )
    
    # Check result
    assert sorted_results["items"][0]["id"]["videoId"] == "test3"  # 2022
    assert sorted_results["items"][1]["id"]["videoId"] == "test1"  # 2021
    assert sorted_results["items"][2]["id"]["videoId"] == "test2"  # 2020


def test_sort_results_by_view_count(search_service):
    """Test sorting results by view count."""
    # Create search results with video details
    search_results = {
        "items": [
            {
                "id": {"videoId": "test1"},
                "details": {
                    "statistics": {"viewCount": "2000"}
                }
            },
            {
                "id": {"videoId": "test2"},
                "details": {
                    "statistics": {"viewCount": "1000"}
                }
            },
            {
                "id": {"videoId": "test3"},
                "details": {
                    "statistics": {"viewCount": "3000"}
                }
            }
        ]
    }
    
    # Sort by view count (ascending)
    sorted_results = search_service.sort_results(
        search_results=search_results,
        sort_by="viewCount",
        reverse=False
    )
    
    # Check result
    assert sorted_results["items"][0]["id"]["videoId"] == "test2"  # 1000
    assert sorted_results["items"][1]["id"]["videoId"] == "test1"  # 2000
    assert sorted_results["items"][2]["id"]["videoId"] == "test3"  # 3000
    
    # Sort by view count (descending)
    sorted_results = search_service.sort_results(
        search_results=search_results,
        sort_by="viewCount",
        reverse=True
    )
    
    # Check result
    assert sorted_results["items"][0]["id"]["videoId"] == "test3"  # 3000
    assert sorted_results["items"][1]["id"]["videoId"] == "test1"  # 2000
    assert sorted_results["items"][2]["id"]["videoId"] == "test2"  # 1000


def test_sort_results_by_duration(search_service):
    """Test sorting results by duration."""
    # Create search results with video details
    search_results = {
        "items": [
            {
                "id": {"videoId": "test1"},
                "details": {
                    "contentDetails": {"duration": "PT30M"}  # 30 minutes
                }
            },
            {
                "id": {"videoId": "test2"},
                "details": {
                    "contentDetails": {"duration": "PT10M"}  # 10 minutes
                }
            },
            {
                "id": {"videoId": "test3"},
                "details": {
                    "contentDetails": {"duration": "PT1H"}  # 1 hour
                }
            }
        ]
    }
    
    # Sort by duration (ascending)
    sorted_results = search_service.sort_results(
        search_results=search_results,
        sort_by="duration",
        reverse=False
    )
    
    # Check result
    assert sorted_results["items"][0]["id"]["videoId"] == "test2"  # 10 minutes
    assert sorted_results["items"][1]["id"]["videoId"] == "test1"  # 30 minutes
    assert sorted_results["items"][2]["id"]["videoId"] == "test3"  # 1 hour
    
    # Sort by duration (descending)
    sorted_results = search_service.sort_results(
        search_results=search_results,
        sort_by="duration",
        reverse=True
    )
    
    # Check result
    assert sorted_results["items"][0]["id"]["videoId"] == "test3"  # 1 hour
    assert sorted_results["items"][1]["id"]["videoId"] == "test1"  # 30 minutes
    assert sorted_results["items"][2]["id"]["videoId"] == "test2"  # 10 minutes


def test_parse_duration():
    """Test parsing ISO 8601 duration strings."""
    # Create a search service instance with a mocked YouTube client
    with patch('src.services.youtube.client.YouTubeAPIClient') as mock_client, \
         patch('src.services.youtube.auth.api_key_manager.APIKeyManager._load_api_keys_from_env', return_value=["test_key"]):
        search_service = YouTubeSearchService()
        
        # Test various duration formats
        assert search_service._parse_duration("PT10S") == 10  # 10 seconds
        assert search_service._parse_duration("PT5M") == 300  # 5 minutes
        assert search_service._parse_duration("PT1H") == 3600  # 1 hour
        assert search_service._parse_duration("PT1H30M15S") == 5415  # 1 hour, 30 minutes, 15 seconds
        assert search_service._parse_duration("PT") == 0  # Empty duration
        assert search_service._parse_duration("") == 0  # Empty string 