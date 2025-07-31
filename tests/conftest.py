"""
Shared test fixtures for YouTube Research Video Clip Finder tests.
"""
import os
import pytest
from fastapi.testclient import TestClient

from src.app import app


@pytest.fixture
def test_client():
    """
    Create a test client for the FastAPI application.
    
    Returns:
        TestClient: A test client for the FastAPI application.
    """
    return TestClient(app)


@pytest.fixture
def test_prompt():
    """
    Return a test prompt for testing the prompt enhancer.
    
    Returns:
        str: A test prompt.
    """
    return "Nelson Mandela speech after prison release in 1990"


@pytest.fixture
def mock_env_vars(monkeypatch):
    """
    Set up mock environment variables for testing.
    
    Args:
        monkeypatch: pytest's monkeypatch fixture.
    """
    monkeypatch.setenv("OPENAI_API_KEY", "test_key")
    monkeypatch.setenv("YOUTUBE_API_KEY", "test_key")
    monkeypatch.setenv("DEBUG", "True")
    monkeypatch.setenv("API_HOST", "127.0.0.1")
    monkeypatch.setenv("API_PORT", "8000") 