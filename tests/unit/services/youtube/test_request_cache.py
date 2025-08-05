"""
Tests for the YouTube API request cache.
"""
import pytest
import json
import time
import os
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.services.youtube.cache.request_cache import RequestCache


@pytest.fixture
def test_cache_dir():
    """Fixture for a temporary cache directory."""
    cache_dir = Path("test_cache")
    cache_dir.mkdir(exist_ok=True)
    
    yield cache_dir
    
    # Clean up
    shutil.rmtree(cache_dir, ignore_errors=True)


def test_init(test_cache_dir):
    """Test initializing the cache."""
    cache = RequestCache(cache_dir=str(test_cache_dir), ttl=3600)
    
    assert cache.cache_dir == test_cache_dir
    assert cache.ttl == 3600
    assert cache.memory_cache == {}
    assert test_cache_dir.exists()


def test_generate_key():
    """Test generating a cache key."""
    cache = RequestCache()
    
    # Generate key for a simple endpoint and params
    key1 = cache._generate_key("search", {"q": "test", "maxResults": 10})
    assert isinstance(key1, str)
    assert len(key1) == 32  # MD5 hash length
    
    # Generate key for the same endpoint and params
    key2 = cache._generate_key("search", {"q": "test", "maxResults": 10})
    assert key1 == key2  # Keys should be the same
    
    # Generate key for the same endpoint but different params
    key3 = cache._generate_key("search", {"q": "different", "maxResults": 10})
    assert key1 != key3  # Keys should be different
    
    # Generate key for different endpoint but same params
    key4 = cache._generate_key("videos", {"q": "test", "maxResults": 10})
    assert key1 != key4  # Keys should be different
    
    # Test that param order doesn't matter
    key5 = cache._generate_key("search", {"maxResults": 10, "q": "test"})
    assert key1 == key5  # Keys should be the same


def test_get_cache_path(test_cache_dir):
    """Test getting a cache file path."""
    cache = RequestCache(cache_dir=str(test_cache_dir))
    
    key = "testkey123"
    path = cache._get_cache_path(key)
    
    assert path == test_cache_dir / "testkey123.json"


def test_set_and_get_memory_cache():
    """Test setting and getting from memory cache."""
    cache = RequestCache(ttl=3600)
    
    endpoint = "search"
    params = {"q": "test"}
    data = {"items": [{"id": 1, "title": "Test"}]}
    
    # Set cache
    cache.set(endpoint, params, data)
    
    # Get from cache
    cached_data = cache.get(endpoint, params)
    
    assert cached_data == data
    
    # Check memory cache
    key = cache._generate_key(endpoint, params)
    assert key in cache.memory_cache
    assert cache.memory_cache[key][0] == data


def test_set_and_get_file_cache(test_cache_dir):
    """Test setting and getting from file cache."""
    cache = RequestCache(cache_dir=str(test_cache_dir), ttl=3600)
    
    endpoint = "search"
    params = {"q": "test"}
    data = {"items": [{"id": 1, "title": "Test"}]}
    
    # Set cache
    cache.set(endpoint, params, data)
    
    # Clear memory cache to force file read
    key = cache._generate_key(endpoint, params)
    cache.memory_cache.clear()
    
    # Get from cache
    cached_data = cache.get(endpoint, params)
    
    assert cached_data == data
    
    # Check file cache
    cache_path = cache._get_cache_path(key)
    assert cache_path.exists()
    
    # Check memory cache was updated
    assert key in cache.memory_cache
    assert cache.memory_cache[key][0] == data


def test_cache_expiration():
    """Test cache expiration."""
    cache = RequestCache(ttl=1)  # 1 second TTL
    
    endpoint = "search"
    params = {"q": "test"}
    data = {"items": [{"id": 1, "title": "Test"}]}
    
    # Set cache
    cache.set(endpoint, params, data)
    
    # Get from cache immediately
    cached_data = cache.get(endpoint, params)
    assert cached_data == data
    
    # Wait for expiration
    time.sleep(1.1)
    
    # Get from cache after expiration
    cached_data = cache.get(endpoint, params)
    assert cached_data is None


def test_invalidate_specific(test_cache_dir):
    """Test invalidating a specific cache entry."""
    cache = RequestCache(cache_dir=str(test_cache_dir))
    
    # Set up cache entries
    cache.set("search", {"q": "test1"}, {"data": "test1"})
    cache.set("search", {"q": "test2"}, {"data": "test2"})
    cache.set("videos", {"id": "123"}, {"data": "video123"})
    
    # Invalidate specific entry
    count = cache.invalidate("search", {"q": "test1"})
    
    # Check count
    assert count == 2  # Memory + file
    
    # Check that the entry is removed
    assert cache.get("search", {"q": "test1"}) is None
    
    # Check that other entries still exist
    assert cache.get("search", {"q": "test2"}) is not None
    assert cache.get("videos", {"id": "123"}) is not None


def test_invalidate_by_endpoint(test_cache_dir):
    """Test invalidating all entries for a specific endpoint."""
    cache = RequestCache(cache_dir=str(test_cache_dir))
    
    # Set up cache entries
    cache.set("search", {"q": "test1"}, {"data": "test1"})
    cache.set("search", {"q": "test2"}, {"data": "test2"})
    cache.set("videos", {"id": "123"}, {"data": "video123"})
    
    # Invalidate all search entries
    count = cache.invalidate("search")
    
    # Check that search entries are removed
    assert cache.get("search", {"q": "test1"}) is None
    assert cache.get("search", {"q": "test2"}) is None
    
    # Check that videos entry still exists
    assert cache.get("videos", {"id": "123"}) is not None


def test_clear(test_cache_dir):
    """Test clearing all cache entries."""
    cache = RequestCache(cache_dir=str(test_cache_dir))
    
    # Set up cache entries
    cache.set("search", {"q": "test1"}, {"data": "test1"})
    cache.set("videos", {"id": "123"}, {"data": "video123"})
    
    # Clear cache
    count = cache.clear()
    
    # Check that all entries are removed
    assert cache.get("search", {"q": "test1"}) is None
    assert cache.get("videos", {"id": "123"}) is None
    assert len(cache.memory_cache) == 0
    
    # Check that no cache files exist
    assert len(list(test_cache_dir.glob("*.json"))) == 0


def test_get_stats(test_cache_dir):
    """Test getting cache statistics."""
    cache = RequestCache(cache_dir=str(test_cache_dir), ttl=3600)
    
    # Set up cache entries
    cache.set("search", {"q": "test1"}, {"data": "test1"})
    cache.set("videos", {"id": "123"}, {"data": "video123"})
    
    # Get stats
    stats = cache.get_stats()
    
    assert stats["file_entries"] == 2
    assert stats["memory_entries"] == 2
    assert "total_size" in stats
    assert stats["cache_dir"] == str(test_cache_dir)
    assert stats["ttl"] == 3600


def test_file_cache_error_handling(test_cache_dir):
    """Test handling errors when reading cache files."""
    cache = RequestCache(cache_dir=str(test_cache_dir))
    
    # Create an invalid cache file
    key = "invalid_key"
    cache_path = cache._get_cache_path(key)
    with open(cache_path, "w") as f:
        f.write("invalid json")
    
    # Try to read the invalid cache file
    result = cache.get("endpoint", {"key": key})
    
    # Should return None for invalid cache
    assert result is None 