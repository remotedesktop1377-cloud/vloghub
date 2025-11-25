"""
Tests for the YouTube API key manager.
"""
import pytest
from unittest.mock import patch, MagicMock
import time

from backend.services.youtube.auth.api_key_manager import APIKeyManager


def test_init_with_api_keys():
    """Test initializing with provided API keys."""
    api_keys = ["key1", "key2", "key3"]
    manager = APIKeyManager(api_keys=api_keys)
    
    assert manager.api_keys == api_keys
    assert manager.current_key_index == 0
    assert len(manager.usage_tracking) == 3


def test_init_with_no_api_keys():
    """Test initializing with no API keys raises an error."""
    with pytest.raises(ValueError):
        APIKeyManager(api_keys=[])


@patch("os.getenv")
def test_load_api_keys_from_env_single_key(mock_getenv):
    """Test loading a single API key from environment variables."""
    mock_getenv.side_effect = lambda key: "test_key" if key == "YOUTUBE_API_KEY" else None
    
    manager = APIKeyManager()
    
    assert manager.api_keys == ["test_key"]
    mock_getenv.assert_called_with("YOUTUBE_API_KEY")


@patch("os.getenv")
def test_load_api_keys_from_env_multiple_keys(mock_getenv):
    """Test loading multiple API keys from environment variables."""
    def mock_getenv_side_effect(key):
        if key == "YOUTUBE_API_KEY":
            return None
        elif key == "YOUTUBE_API_KEY_1":
            return "key1"
        elif key == "YOUTUBE_API_KEY_2":
            return "key2"
        elif key == "YOUTUBE_API_KEY_3":
            return "key3"
        else:
            return None
    
    mock_getenv.side_effect = mock_getenv_side_effect
    
    manager = APIKeyManager()
    
    assert manager.api_keys == ["key1", "key2", "key3"]
    assert mock_getenv.call_count >= 4  # YOUTUBE_API_KEY + 3 numbered keys + 1 that returns None


def test_get_api_key():
    """Test getting the current API key."""
    api_keys = ["key1", "key2", "key3"]
    manager = APIKeyManager(api_keys=api_keys)
    
    assert manager.get_api_key() == "key1"
    
    # Change the current key index
    manager.current_key_index = 1
    assert manager.get_api_key() == "key2"


def test_rotate_key():
    """Test rotating to the next API key."""
    api_keys = ["key1", "key2", "key3"]
    manager = APIKeyManager(api_keys=api_keys)
    
    assert manager.get_api_key() == "key1"
    
    # Rotate key
    new_key = manager.rotate_key()
    assert new_key == "key2"
    assert manager.current_key_index == 1
    
    # Rotate again
    new_key = manager.rotate_key()
    assert new_key == "key3"
    assert manager.current_key_index == 2
    
    # Rotate again, should wrap around
    new_key = manager.rotate_key()
    assert new_key == "key1"
    assert manager.current_key_index == 0


def test_get_random_key():
    """Test getting a random API key."""
    api_keys = ["key1"]  # Use a single key to ensure deterministic behavior
    manager = APIKeyManager(api_keys=api_keys)
    
    random_key = manager.get_random_key()
    assert random_key == "key1"


def test_record_usage():
    """Test recording API usage."""
    api_keys = ["key1", "key2"]
    manager = APIKeyManager(api_keys=api_keys)
    
    # Record usage for key1
    manager.record_usage("key1", 100)
    assert manager.usage_tracking["key1"]["quota_used"] == 100
    
    # Record additional usage for key1
    manager.record_usage("key1", 50)
    assert manager.usage_tracking["key1"]["quota_used"] == 150
    
    # Record usage for key2
    manager.record_usage("key2", 200)
    assert manager.usage_tracking["key2"]["quota_used"] == 200
    
    # Record usage for unknown key
    manager.record_usage("unknown_key", 100)
    assert "unknown_key" not in manager.usage_tracking


def test_record_usage_reset():
    """Test resetting usage counter after 24 hours."""
    api_keys = ["key1"]
    manager = APIKeyManager(api_keys=api_keys)
    
    # Record usage
    manager.record_usage("key1", 100)
    assert manager.usage_tracking["key1"]["quota_used"] == 100
    
    # Simulate time passing (> 24 hours)
    original_time = manager.usage_tracking["key1"]["last_reset"]
    manager.usage_tracking["key1"]["last_reset"] = original_time - 86401  # 24 hours + 1 second
    
    # Record more usage, should reset counter first
    manager.record_usage("key1", 50)
    assert manager.usage_tracking["key1"]["quota_used"] == 50


def test_record_error():
    """Test recording API errors."""
    api_keys = ["key1"]
    manager = APIKeyManager(api_keys=api_keys)
    
    # Record an error
    error = Exception("Test error")
    manager.record_error("key1", error)
    
    assert manager.usage_tracking["key1"]["error_count"] == 1
    assert manager.usage_tracking["key1"]["last_error"] == "Test error"
    
    # Record a quota exceeded error
    quota_error = Exception("Quota exceeded")
    manager.record_error("key1", quota_error)
    
    assert manager.usage_tracking["key1"]["error_count"] == 2
    assert manager.usage_tracking["key1"]["last_error"] == "Quota exceeded"
    assert manager.usage_tracking["key1"]["quota_used"] == manager.quota_limit
    
    # Record error for unknown key
    manager.record_error("unknown_key", error)
    assert "unknown_key" not in manager.usage_tracking


def test_get_available_key():
    """Test getting an available API key with remaining quota."""
    api_keys = ["key1", "key2", "key3"]
    manager = APIKeyManager(api_keys=api_keys)
    
    # Mark key1 as used up
    manager.usage_tracking["key1"]["quota_used"] = manager.quota_limit
    
    # Get available key, should be key2
    available_key = manager.get_available_key()
    assert available_key == "key2"
    
    # Mark key2 as used up
    manager.usage_tracking["key2"]["quota_used"] = manager.quota_limit
    
    # Get available key, should be key3
    available_key = manager.get_available_key()
    assert available_key == "key3"
    
    # Mark key3 as used up
    manager.usage_tracking["key3"]["quota_used"] = manager.quota_limit
    
    # Get available key, should raise an error
    with pytest.raises(RuntimeError):
        manager.get_available_key()


def test_get_usage_stats():
    """Test getting usage statistics."""
    api_keys = ["key1", "key2"]
    manager = APIKeyManager(api_keys=api_keys, quota_limit=1000)
    
    # Record usage and errors
    manager.record_usage("key1", 200)
    manager.record_error("key1", Exception("Test error"))
    manager.record_usage("key2", 500)
    
    # Get usage stats
    stats = manager.get_usage_stats()
    
    assert "key1..." in stats
    assert stats["key1..."]["quota_used"] == 200
    assert stats["key1..."]["quota_remaining"] == 800
    assert stats["key1..."]["error_count"] == 1
    
    assert "key2..." in stats
    assert stats["key2..."]["quota_used"] == 500
    assert stats["key2..."]["quota_remaining"] == 500
    assert stats["key2..."]["error_count"] == 0 