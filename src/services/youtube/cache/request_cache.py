"""
Caching system for YouTube API requests to minimize quota usage.
"""
import json
import hashlib
import time
import os
import logging
from typing import Dict, Any, Optional, Tuple, Union
from pathlib import Path

logger = logging.getLogger(__name__)


class RequestCache:
    """
    Cache for YouTube API requests to minimize quota usage.
    """
    
    def __init__(self, cache_dir: Optional[str] = None, ttl: int = 3600):
        """
        Initialize the request cache.
        
        Args:
            cache_dir: Directory to store cache files. If None, uses './cache/youtube_api'.
            ttl: Time-to-live for cache entries in seconds (default: 1 hour).
        """
        self.cache_dir = Path(cache_dir or os.path.join("cache", "youtube_api"))
        self.ttl = ttl
        
        # Create cache directory if it doesn't exist
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # In-memory cache for frequently accessed items
        self.memory_cache: Dict[str, Tuple[Any, float]] = {}
        
        logger.info(f"Initialized YouTube API request cache at {self.cache_dir}")
    
    def _generate_key(self, endpoint: str, params: Dict[str, Any]) -> str:
        """
        Generate a unique cache key for a request.
        
        Args:
            endpoint: API endpoint.
            params: Request parameters.
            
        Returns:
            Cache key.
        """
        # Sort params to ensure consistent keys
        sorted_params = json.dumps(params, sort_keys=True)
        key_string = f"{endpoint}:{sorted_params}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _get_cache_path(self, key: str) -> Path:
        """
        Get the file path for a cache key.
        
        Args:
            key: Cache key.
            
        Returns:
            Path to the cache file.
        """
        return self.cache_dir / f"{key}.json"
    
    def get(self, endpoint: str, params: Dict[str, Any]) -> Optional[Any]:
        """
        Get a cached response if available and not expired.
        
        Args:
            endpoint: API endpoint.
            params: Request parameters.
            
        Returns:
            Cached response or None if not found or expired.
        """
        key = self._generate_key(endpoint, params)
        
        # Check memory cache first
        if key in self.memory_cache:
            data, timestamp = self.memory_cache[key]
            if time.time() - timestamp <= self.ttl:
                logger.debug(f"Memory cache hit for {endpoint}")
                return data
            else:
                # Expired, remove from memory cache
                del self.memory_cache[key]
        
        # Check file cache
        cache_path = self._get_cache_path(key)
        if cache_path.exists():
            try:
                with open(cache_path, 'r') as f:
                    cache_data = json.load(f)
                
                timestamp = cache_data.get("timestamp", 0)
                if time.time() - timestamp <= self.ttl:
                    logger.debug(f"File cache hit for {endpoint}")
                    # Add to memory cache for faster access next time
                    self.memory_cache[key] = (cache_data["data"], timestamp)
                    return cache_data["data"]
                else:
                    logger.debug(f"Expired cache for {endpoint}")
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"Error reading cache file {cache_path}: {e}")
        
        return None
    
    def set(self, endpoint: str, params: Dict[str, Any], data: Any) -> None:
        """
        Cache a response.
        
        Args:
            endpoint: API endpoint.
            params: Request parameters.
            data: Response data to cache.
        """
        key = self._generate_key(endpoint, params)
        timestamp = time.time()
        
        # Add to memory cache
        self.memory_cache[key] = (data, timestamp)
        
        # Add to file cache
        cache_path = self._get_cache_path(key)
        try:
            with open(cache_path, 'w') as f:
                json.dump({
                    "timestamp": timestamp,
                    "endpoint": endpoint,
                    "params": params,
                    "data": data
                }, f)
            logger.debug(f"Cached response for {endpoint}")
        except Exception as e:
            logger.error(f"Error writing to cache file {cache_path}: {e}")
    
    def invalidate(self, endpoint: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> int:
        """
        Invalidate cache entries.
        
        Args:
            endpoint: Optional endpoint to invalidate. If None, all endpoints are considered.
            params: Optional parameters to match. If None, all parameters are matched.
            
        Returns:
            Number of invalidated cache entries.
        """
        count = 0
        
        # If both endpoint and params are provided, invalidate specific entry
        if endpoint and params:
            key = self._generate_key(endpoint, params)
            if key in self.memory_cache:
                del self.memory_cache[key]
                count += 1
            
            cache_path = self._get_cache_path(key)
            if cache_path.exists():
                cache_path.unlink()
                count += 1
            
            return count
        
        # Otherwise, scan all cache files
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                with open(cache_file, 'r') as f:
                    cache_data = json.load(f)
                
                # Check if this entry matches the filter
                if endpoint and cache_data.get("endpoint") != endpoint:
                    continue
                
                if params:
                    cache_params = cache_data.get("params", {})
                    if not all(cache_params.get(k) == v for k, v in params.items()):
                        continue
                
                # If we get here, the entry matches the filter
                key = cache_file.stem
                if key in self.memory_cache:
                    del self.memory_cache[key]
                
                cache_file.unlink()
                count += 1
            except Exception as e:
                logger.warning(f"Error processing cache file {cache_file}: {e}")
        
        return count
    
    def clear(self) -> int:
        """
        Clear all cache entries.
        
        Returns:
            Number of cleared cache entries.
        """
        count = len(self.memory_cache)
        self.memory_cache.clear()
        
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
                count += 1
            except Exception as e:
                logger.warning(f"Error deleting cache file {cache_file}: {e}")
        
        return count
    
    def get_stats(self) -> Dict[str, Union[int, str]]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache statistics.
        """
        file_count = len(list(self.cache_dir.glob("*.json")))
        memory_count = len(self.memory_cache)
        
        total_size = 0
        for cache_file in self.cache_dir.glob("*.json"):
            total_size += cache_file.stat().st_size
        
        # Convert to human-readable size
        if total_size < 1024:
            size_str = f"{total_size} B"
        elif total_size < 1024 * 1024:
            size_str = f"{total_size / 1024:.2f} KB"
        else:
            size_str = f"{total_size / (1024 * 1024):.2f} MB"
        
        return {
            "file_entries": file_count,
            "memory_entries": memory_count,
            "total_size": size_str,
            "cache_dir": str(self.cache_dir),
            "ttl": self.ttl
        } 