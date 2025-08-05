"""
YouTube API key manager for authentication and key rotation.
"""
import os
import random
import time
import logging
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)


class APIKeyManager:
    """
    Manages YouTube API keys with rotation capability to handle quota limitations.
    """
    
    def __init__(self, api_keys: Optional[List[str]] = None, quota_limit: int = 10000):
        """
        Initialize the API key manager.
        
        Args:
            api_keys: List of API keys. If None, will try to load from environment variables.
            quota_limit: Daily quota limit per API key (default: 10,000 units).
        """
        self.api_keys = api_keys or self._load_api_keys_from_env()
        if not self.api_keys:
            raise ValueError("No API keys provided or found in environment variables")
        
        self.quota_limit = quota_limit
        self.current_key_index = 0
        self.usage_tracking: Dict[str, Dict[str, Any]] = {
            key: {
                "quota_used": 0,
                "last_reset": time.time(),
                "error_count": 0,
                "last_error": None
            } for key in self.api_keys
        }
    
    def _load_api_keys_from_env(self) -> List[str]:
        """
        Load API keys from environment variables.
        
        Returns:
            List of API keys.
        """
        # Try to load a single API key
        api_key = os.getenv("YOUTUBE_API_KEY")
        if api_key:
            return [api_key]
        
        # Try to load multiple API keys (YOUTUBE_API_KEY_1, YOUTUBE_API_KEY_2, etc.)
        keys = []
        i = 1
        while True:
            key = os.getenv(f"YOUTUBE_API_KEY_{i}")
            if not key:
                break
            keys.append(key)
            i += 1
        
        return keys
    
    def get_api_key(self) -> str:
        """
        Get the current API key.
        
        Returns:
            Current API key.
        """
        return self.api_keys[self.current_key_index]
    
    def rotate_key(self) -> str:
        """
        Rotate to the next available API key.
        
        Returns:
            New API key after rotation.
        """
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        logger.info(f"Rotated to API key index {self.current_key_index}")
        return self.get_api_key()
    
    def get_random_key(self) -> str:
        """
        Get a random API key.
        
        Returns:
            Random API key.
        """
        self.current_key_index = random.randint(0, len(self.api_keys) - 1)
        return self.get_api_key()
    
    def record_usage(self, key: str, units: int = 1) -> None:
        """
        Record API usage for a specific key.
        
        Args:
            key: API key.
            units: Number of quota units used.
        """
        if key not in self.usage_tracking:
            logger.warning(f"Attempted to record usage for unknown API key: {key}")
            return
        
        # Check if we need to reset the counter (new day)
        now = time.time()
        last_reset = self.usage_tracking[key]["last_reset"]
        if (now - last_reset) > 86400:  # 24 hours in seconds
            self.usage_tracking[key]["quota_used"] = 0
            self.usage_tracking[key]["last_reset"] = now
        
        self.usage_tracking[key]["quota_used"] += units
        
        # Log if approaching quota limit
        quota_used = self.usage_tracking[key]["quota_used"]
        if quota_used > self.quota_limit * 0.8:
            logger.warning(f"API key {key[:5]}... has used {quota_used}/{self.quota_limit} units (>80%)")
    
    def record_error(self, key: str, error: Exception) -> None:
        """
        Record an API error for a specific key.
        
        Args:
            key: API key.
            error: The error that occurred.
        """
        if key not in self.usage_tracking:
            logger.warning(f"Attempted to record error for unknown API key: {key}")
            return
        
        self.usage_tracking[key]["error_count"] += 1
        self.usage_tracking[key]["last_error"] = str(error)
        
        # If quota exceeded, mark as used up
        if "quota" in str(error).lower():
            self.usage_tracking[key]["quota_used"] = self.quota_limit
            logger.error(f"API key {key[:5]}... has exceeded its quota")
    
    def get_available_key(self) -> str:
        """
        Get an available API key with remaining quota.
        
        Returns:
            Available API key.
            
        Raises:
            RuntimeError: If no API keys with remaining quota are available.
        """
        for _ in range(len(self.api_keys)):
            key = self.get_api_key()
            if self.usage_tracking[key]["quota_used"] < self.quota_limit:
                return key
            self.rotate_key()
        
        # If we get here, all keys have reached their quota
        raise RuntimeError("All API keys have reached their quota limit")
    
    def get_usage_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        Get usage statistics for all API keys.
        
        Returns:
            Dictionary with usage statistics.
        """
        return {
            f"{key[:5]}...": {
                "quota_used": stats["quota_used"],
                "quota_remaining": self.quota_limit - stats["quota_used"],
                "error_count": stats["error_count"]
            } for key, stats in self.usage_tracking.items()
        } 