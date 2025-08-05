"""
Pytest configuration and shared fixtures for the YouTube Clip Searcher project.
"""
import pytest
import asyncio
import tempfile
import os
from typing import Generator, AsyncGenerator
from unittest.mock import MagicMock, AsyncMock

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import app and dependencies
from src.app import app
from src.db.database import get_db, Base
from src.models.metadata import (
    Tag, TagCategory, ClipMetadata, VideoMetadata, 
    GeoLocation, MetadataVersion
)
from src.services.metadata import TagService, MetadataService
from src.services.youtube.client import YouTubeClient
from src.ai.sentiment.sentiment_analyzer import SentimentAnalyzer
from src.ai.entity_recognition.entity_recognizer import EntityRecognizer


# Test Database Configuration
@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine."""
    engine = create_engine(
        "sqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_session(test_engine):
    """Create test database session."""
    TestingSessionLocal = sessionmaker(
        autocommit=False, 
        autoflush=False, 
        bind=test_engine
    )
    
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_app(test_session):
    """Create test FastAPI app with test database."""
    def override_get_db():
        try:
            yield test_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield app
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_app):
    """Create test client."""
    return TestClient(test_app)


# Mock fixtures for external services
@pytest.fixture
def mock_youtube_client():
    """Mock YouTube client."""
    mock_client = MagicMock(spec=YouTubeClient)
    
    # Mock search results
    mock_client.search_videos.return_value = {
        "items": [
            {
                "id": {"videoId": "test_video_1"},
                "snippet": {
                    "title": "Test Video 1",
                    "description": "Test description",
                    "channelTitle": "Test Channel",
                    "publishedAt": "2023-01-01T00:00:00Z"
                }
            }
        ]
    }
    
    # Mock video details
    mock_client.get_video_details.return_value = {
        "id": "test_video_1",
        "snippet": {
            "title": "Test Video 1",
            "description": "Test description",
            "channelTitle": "Test Channel"
        },
        "statistics": {
            "viewCount": "1000",
            "likeCount": "100"
        }
    }
    
    return mock_client


@pytest.fixture
def mock_sentiment_analyzer():
    """Mock sentiment analyzer."""
    mock_analyzer = AsyncMock(spec=SentimentAnalyzer)
    
    mock_analyzer.analyze_sentiment.return_value = {
        "label": "positive",
        "score": 0.8,
        "confidence": 0.9,
        "emotions": {
            "joy": 0.7,
            "optimism": 0.6
        }
    }
    
    return mock_analyzer


@pytest.fixture
def mock_entity_recognizer():
    """Mock entity recognizer."""
    mock_recognizer = AsyncMock(spec=EntityRecognizer)
    
    mock_recognizer.extract_entities.return_value = [
        {
            "text": "Nelson Mandela",
            "label": "PERSON",
            "start": 0,
            "end": 13,
            "confidence": 0.95
        },
        {
            "text": "South Africa",
            "label": "GPE",
            "start": 20,
            "end": 32,
            "confidence": 0.9
        }
    ]
    
    return mock_recognizer


# Test data fixtures
@pytest.fixture
def sample_tag_category(test_session):
    """Create sample tag category."""
    category = TagCategory(
        name="Test Category",
        description="Test category for testing",
        color="#FF0000"
    )
    test_session.add(category)
    test_session.commit()
    test_session.refresh(category)
    return category


@pytest.fixture
def sample_tag(test_session, sample_tag_category):
    """Create sample tag."""
    tag = Tag(
        name="Test Tag",
        tag_type="person",
        category_id=sample_tag_category.id,
        description="Test tag for testing",
        confidence=0.9,
        confidence_level="high",
        source="user_input"
    )
    test_session.add(tag)
    test_session.commit()
    test_session.refresh(tag)
    return tag


@pytest.fixture
def sample_geo_location(test_session):
    """Create sample geographic location."""
    location = GeoLocation(
        name="Cape Town",
        latitude=-33.9249,
        longitude=18.4241,
        country="South Africa",
        region="Western Cape",
        city="Cape Town",
        confidence=1.0
    )
    test_session.add(location)
    test_session.commit()
    test_session.refresh(location)
    return location


@pytest.fixture
def sample_video_metadata(test_session):
    """Create sample video metadata."""
    video = VideoMetadata(
        video_id="test_video_1",
        title="Test Video",
        description="Test video description",
        channel_title="Test Channel",
        published_at="2023-01-01T00:00:00Z",
        duration=180,
        view_count=1000,
        like_count=100
    )
    test_session.add(video)
    test_session.commit()
    test_session.refresh(video)
    return video


@pytest.fixture
def sample_clip_metadata(test_session, sample_video_metadata, sample_geo_location):
    """Create sample clip metadata."""
    clip = ClipMetadata(
        clip_id="test_clip_1",
        video_id=sample_video_metadata.id,
        title="Test Clip",
        description="Test clip description",
        start_time=10.0,
        end_time=30.0,
        duration=20.0,
        transcript_text="This is a test transcript",
        sentiment_score=0.8,
        sentiment_label="positive",
        topic_labels=["freedom", "democracy"],
        keywords=["test", "clip", "example"],
        speaker_name="Test Speaker",
        geo_location_id=sample_geo_location.id,
        relevance_score=0.9
    )
    test_session.add(clip)
    test_session.commit()
    test_session.refresh(clip)
    return clip


# Service fixtures
@pytest.fixture
def tag_service(test_session):
    """Create tag service instance."""
    return TagService(test_session)


@pytest.fixture
def metadata_service(test_session):
    """Create metadata service instance."""
    return MetadataService(test_session)


# File system fixtures
@pytest.fixture
def temp_dir():
    """Create temporary directory."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


@pytest.fixture
def temp_file():
    """Create temporary file."""
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        yield temp_file.name
    
    # Cleanup
    if os.path.exists(temp_file.name):
        os.unlink(temp_file.name)


# Video file fixtures
@pytest.fixture
def sample_video_file(temp_dir):
    """Create sample video file."""
    video_path = os.path.join(temp_dir, "test_video.mp4")
    
    # Create a dummy video file
    with open(video_path, "wb") as f:
        f.write(b"fake video content")
    
    return video_path


@pytest.fixture
def sample_audio_file(temp_dir):
    """Create sample audio file."""
    audio_path = os.path.join(temp_dir, "test_audio.wav")
    
    # Create a dummy audio file
    with open(audio_path, "wb") as f:
        f.write(b"fake audio content")
    
    return audio_path


# Environment fixtures
@pytest.fixture(autouse=True)
def test_environment():
    """Set test environment variables."""
    original_values = {}
    
    test_env_vars = {
        "TESTING": "true",
        "DATABASE_URL": "sqlite:///:memory:",
        "OPENAI_API_KEY": "test_key",
        "YOUTUBE_API_KEY": "test_youtube_key"
    }
    
    # Save original values and set test values
    for key, value in test_env_vars.items():
        original_values[key] = os.environ.get(key)
        os.environ[key] = value
    
    yield
    
    # Restore original values
    for key, original_value in original_values.items():
        if original_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = original_value


# Async fixtures
@pytest.fixture
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# Performance testing fixtures
@pytest.fixture
def performance_monitor():
    """Monitor performance during tests."""
    import time
    import psutil
    import threading
    
    class PerformanceMonitor:
        def __init__(self):
            self.start_time = None
            self.end_time = None
            self.memory_usage = []
            self.cpu_usage = []
            self.monitoring = False
            self.monitor_thread = None
        
        def start(self):
            self.start_time = time.time()
            self.monitoring = True
            self.monitor_thread = threading.Thread(target=self._monitor)
            self.monitor_thread.start()
        
        def stop(self):
            self.end_time = time.time()
            self.monitoring = False
            if self.monitor_thread:
                self.monitor_thread.join()
        
        def _monitor(self):
            process = psutil.Process()
            while self.monitoring:
                self.memory_usage.append(process.memory_info().rss / 1024 / 1024)  # MB
                self.cpu_usage.append(process.cpu_percent())
                time.sleep(0.1)
        
        @property
        def duration(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None
        
        @property
        def avg_memory_usage(self):
            return sum(self.memory_usage) / len(self.memory_usage) if self.memory_usage else 0
        
        @property
        def peak_memory_usage(self):
            return max(self.memory_usage) if self.memory_usage else 0
        
        @property
        def avg_cpu_usage(self):
            return sum(self.cpu_usage) / len(self.cpu_usage) if self.cpu_usage else 0
    
    return PerformanceMonitor()


# Error simulation fixtures
@pytest.fixture
def error_simulator():
    """Simulate various error conditions."""
    class ErrorSimulator:
        @staticmethod
        def database_error():
            from sqlalchemy.exc import SQLAlchemyError
            raise SQLAlchemyError("Simulated database error")
        
        @staticmethod
        def network_error():
            import requests.exceptions
            raise requests.exceptions.ConnectionError("Simulated network error")
        
        @staticmethod
        def timeout_error():
            import asyncio
            raise asyncio.TimeoutError("Simulated timeout error")
        
        @staticmethod
        def validation_error():
            from pydantic import ValidationError
            raise ValidationError([], type({}))
    
    return ErrorSimulator()


# Cleanup fixtures
@pytest.fixture(autouse=True)
def cleanup_after_test(test_session):
    """Clean up database after each test."""
    yield
    
    # Clear all tables
    test_session.query(MetadataVersion).delete()
    test_session.query(ClipMetadata).delete()
    test_session.query(VideoMetadata).delete()
    test_session.query(Tag).delete()
    test_session.query(TagCategory).delete()
    test_session.query(GeoLocation).delete()
    test_session.commit()


# Test markers for organization
pytest.mark.unit = pytest.mark.unit
pytest.mark.integration = pytest.mark.integration
pytest.mark.e2e = pytest.mark.e2e
pytest.mark.slow = pytest.mark.slow
pytest.mark.api = pytest.mark.api
pytest.mark.db = pytest.mark.db
pytest.mark.ai = pytest.mark.ai
pytest.mark.ui = pytest.mark.ui
pytest.mark.performance = pytest.mark.performance 