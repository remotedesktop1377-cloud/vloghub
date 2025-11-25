"""
Integration tests for metadata API endpoints.
"""
import pytest
import json
from fastapi.testclient import TestClient

from backend.models.metadata import TagType, ConfidenceLevel, MetadataSource


@pytest.mark.integration
@pytest.mark.api
class TestMetadataAPI:
    """Integration tests for metadata API."""
    
    def test_create_tag_api(self, client):
        """Test creating tag via API."""
        tag_data = {
            "name": "Nelson Mandela",
            "tag_type": "person",
            "description": "Former President of South Africa",
            "confidence": 0.95,
            "confidence_level": "high",
            "source": "ai_analysis"
        }
        
        response = client.post("/api/metadata/tags", json=tag_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Nelson Mandela"
        assert data["tag_type"] == "person"
        assert data["description"] == "Former President of South Africa"
        assert data["confidence"] == 0.95
        assert data["confidence_level"] == "high"
        assert data["source"] == "ai_analysis"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_create_tag_duplicate_error(self, client, sample_tag):
        """Test creating duplicate tag returns error."""
        tag_data = {
            "name": sample_tag.name,
            "tag_type": sample_tag.tag_type,
            "description": "Different description"
        }
        
        response = client.post("/api/metadata/tags", json=tag_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_create_tag_invalid_data(self, client):
        """Test creating tag with invalid data."""
        tag_data = {
            "name": "",  # Empty name
            "tag_type": "invalid_type",  # Invalid type
        }
        
        response = client.post("/api/metadata/tags", json=tag_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_search_tags_api(self, client, test_session):
        """Test searching tags via API."""
        # Create test tags directly in database
        from backend.models.metadata import Tag
        
        tag1 = Tag(name="Nelson Mandela", tag_type="person", confidence=0.9, usage_count=10)
        tag2 = Tag(name="South Africa", tag_type="location", confidence=0.8, usage_count=5)
        tag3 = Tag(name="Freedom", tag_type="topic", confidence=0.7, usage_count=15)
        
        test_session.add_all([tag1, tag2, tag3])
        test_session.commit()
        
        # Test basic search
        response = client.get("/api/metadata/tags")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 3
        
        # Test query search
        response = client.get("/api/metadata/tags?query=Mandela")
        assert response.status_code == 200
        
        data = response.json()
        mandela_found = any(tag["name"] == "Nelson Mandela" for tag in data)
        assert mandela_found
        
        # Test type filter
        response = client.get("/api/metadata/tags?tag_type=person")
        assert response.status_code == 200
        
        data = response.json()
        assert all(tag["tag_type"] == "person" for tag in data)
        
        # Test confidence filter
        response = client.get("/api/metadata/tags?min_confidence=0.85")
        assert response.status_code == 200
        
        data = response.json()
        assert all(tag["confidence"] >= 0.85 for tag in data)
        
        # Test limit
        response = client.get("/api/metadata/tags?limit=2")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 2
    
    def test_get_tag_by_id_api(self, client, sample_tag):
        """Test getting tag by ID via API."""
        response = client.get(f"/api/metadata/tags/{sample_tag.id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == str(sample_tag.id)
        assert data["name"] == sample_tag.name
        assert data["tag_type"] == sample_tag.tag_type
    
    def test_get_tag_not_found(self, client):
        """Test getting non-existent tag returns 404."""
        response = client.get("/api/metadata/tags/non-existent-id")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_update_tag_api(self, client, sample_tag):
        """Test updating tag via API."""
        update_data = {
            "name": "Updated Tag Name",
            "description": "Updated description"
        }
        
        response = client.put(f"/api/metadata/tags/{sample_tag.id}", params=update_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Updated Tag Name"
        assert data["description"] == "Updated description"
        assert data["id"] == str(sample_tag.id)
    
    def test_delete_tag_api(self, client, sample_tag):
        """Test deleting tag via API."""
        response = client.delete(f"/api/metadata/tags/{sample_tag.id}")
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify tag is marked as inactive
        get_response = client.get(f"/api/metadata/tags/{sample_tag.id}")
        assert get_response.status_code == 200
        assert get_response.json()["is_active"] is False
    
    def test_get_popular_tags_api(self, client, test_session):
        """Test getting popular tags via API."""
        from backend.models.metadata import Tag
        
        # Create tags with different usage counts
        tag1 = Tag(name="Popular Tag", tag_type="topic", usage_count=100)
        tag2 = Tag(name="Medium Tag", tag_type="person", usage_count=50)
        tag3 = Tag(name="Unpopular Tag", tag_type="location", usage_count=1)
        
        test_session.add_all([tag1, tag2, tag3])
        test_session.commit()
        
        response = client.get("/api/metadata/tags/popular?limit=2")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) <= 2
        # Should be ordered by usage count
        if len(data) >= 2:
            assert data[0]["usage_count"] >= data[1]["usage_count"]
    
    def test_get_related_tags_api(self, client, sample_tag, test_session):
        """Test getting related tags via API."""
        from backend.models.metadata import Tag
        
        # Create related tag
        related_tag = Tag(
            name="Related Tag",
            tag_type=sample_tag.tag_type,
            usage_count=5
        )
        test_session.add(related_tag)
        test_session.commit()
        
        response = client.get(f"/api/metadata/tags/{sample_tag.id}/related")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should not include the original tag
        tag_ids = [tag["id"] for tag in data]
        assert str(sample_tag.id) not in tag_ids
    
    def test_get_tag_statistics_api(self, client, test_session):
        """Test getting tag statistics via API."""
        from backend.models.metadata import Tag
        
        # Create test tags
        tag1 = Tag(name="Tag 1", tag_type="person", source="ai_analysis", usage_count=10)
        tag2 = Tag(name="Tag 2", tag_type="location", source="user_input", usage_count=5)
        
        test_session.add_all([tag1, tag2])
        test_session.commit()
        
        response = client.get("/api/metadata/tags/statistics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_tags" in data
        assert "by_type" in data
        assert "by_source" in data
        assert "top_used" in data
        
        assert data["total_tags"] >= 2
        assert "person" in data["by_type"]
        assert "location" in data["by_type"]
    
    def test_create_clip_metadata_api(self, client, sample_video_metadata, sample_geo_location):
        """Test creating clip metadata via API."""
        clip_data = {
            "clip_id": "test_clip_new",
            "video_id": str(sample_video_metadata.id),
            "title": "Test Clip via API",
            "description": "Test clip description",
            "start_time": 10.0,
            "end_time": 30.0,
            "transcript_text": "This is a test transcript",
            "sentiment_data": {
                "label": "positive",
                "score": 0.8,
                "confidence": 0.9,
                "emotions": {"joy": 0.7}
            },
            "topic_labels": ["freedom", "democracy"],
            "keywords": ["test", "clip"],
            "speaker_name": "Test Speaker",
            "geo_location": {
                "name": "Cape Town",
                "latitude": -33.9249,
                "longitude": 18.4241,
                "country": "South Africa"
            }
        }
        
        response = client.post("/api/metadata/clips", json=clip_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["clip_id"] == "test_clip_new"
        assert data["title"] == "Test Clip via API"
        assert data["start_time"] == 10.0
        assert data["end_time"] == 30.0
        assert data["duration"] == 20.0
        assert data["sentiment_label"] == "positive"
        assert data["sentiment_score"] == 0.8
        assert data["topic_labels"] == ["freedom", "democracy"]
        assert data["keywords"] == ["test", "clip"]
        assert data["speaker_name"] == "Test Speaker"
        assert data["geo_location"]["name"] == "Cape Town"
    
    def test_create_clip_metadata_duplicate_error(self, client, sample_clip_metadata):
        """Test creating duplicate clip metadata returns error."""
        clip_data = {
            "clip_id": sample_clip_metadata.clip_id,
            "video_id": str(sample_clip_metadata.video_id),
            "title": "Duplicate Clip",
            "start_time": 0.0,
            "end_time": 10.0
        }
        
        response = client.post("/api/metadata/clips", json=clip_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_get_clip_metadata_api(self, client, sample_clip_metadata):
        """Test getting clip metadata via API."""
        response = client.get(f"/api/metadata/clips/{sample_clip_metadata.clip_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["clip_id"] == sample_clip_metadata.clip_id
        assert data["title"] == sample_clip_metadata.title
        assert data["start_time"] == sample_clip_metadata.start_time
        assert data["end_time"] == sample_clip_metadata.end_time
    
    def test_get_clip_metadata_not_found(self, client):
        """Test getting non-existent clip metadata returns 404."""
        response = client.get("/api/metadata/clips/non-existent-clip")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_update_clip_metadata_api(self, client, sample_clip_metadata):
        """Test updating clip metadata via API."""
        update_data = {
            "title": "Updated Clip Title",
            "description": "Updated description",
            "sentiment_data": {
                "label": "neutral",
                "score": 0.0,
                "confidence": 0.8,
                "emotions": {}
            },
            "user_rating": 5,
            "is_favorite": True
        }
        
        response = client.put(
            f"/api/metadata/clips/{sample_clip_metadata.clip_id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["title"] == "Updated Clip Title"
        assert data["description"] == "Updated description"
        assert data["sentiment_label"] == "neutral"
        assert data["sentiment_score"] == 0.0
        assert data["user_rating"] == 5
        assert data["is_favorite"] is True
    
    def test_search_clips_api(self, client, test_session, sample_video_metadata, sample_geo_location):
        """Test searching clips via API."""
        from backend.models.metadata import ClipMetadata, Tag
        
        # Create test clips
        clip1 = ClipMetadata(
            clip_id="search_clip_1",
            video_id=sample_video_metadata.id,
            title="Nelson Mandela Speech",
            start_time=0.0,
            end_time=30.0,
            sentiment_label="positive",
            speaker_name="Nelson Mandela",
            geo_location_id=sample_geo_location.id,
            topic_labels=["freedom"],
            is_favorite=True
        )
        clip2 = ClipMetadata(
            clip_id="search_clip_2",
            video_id=sample_video_metadata.id,
            title="Different Speaker",
            start_time=30.0,
            end_time=60.0,
            sentiment_label="neutral",
            speaker_name="Different Speaker",
            topic_labels=["democracy"]
        )
        
        test_session.add_all([clip1, clip2])
        test_session.commit()
        
        # Test basic search
        search_filters = {
            "sentiment": "positive",
            "speaker": "Nelson Mandela",
            "is_favorite": True
        }
        
        response = client.post(
            "/api/metadata/clips/search",
            json=search_filters,
            params={"page": 1, "page_size": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "clips" in data
        assert "total_count" in data
        assert "page" in data
        assert "page_size" in data
        
        # Should find at least one clip matching the criteria
        matching_clips = [
            clip for clip in data["clips"]
            if clip["sentiment_label"] == "positive" and clip["speaker_name"] == "Nelson Mandela"
        ]
        assert len(matching_clips) >= 1
    
    def test_get_related_clips_api(self, client, sample_clip_metadata, test_session):
        """Test getting related clips via API."""
        from backend.models.metadata import ClipMetadata
        
        # Create related clip with same sentiment and speaker
        related_clip = ClipMetadata(
            clip_id="related_clip",
            video_id=sample_clip_metadata.video_id,
            title="Related Clip",
            start_time=60.0,
            end_time=90.0,
            sentiment_label=sample_clip_metadata.sentiment_label,
            speaker_name=sample_clip_metadata.speaker_name
        )
        test_session.add(related_clip)
        test_session.commit()
        
        response = client.get(f"/api/metadata/clips/{sample_clip_metadata.clip_id}/related")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return related clips but not the original
        clip_ids = [clip["clip_id"] for clip in data]
        assert sample_clip_metadata.clip_id not in clip_ids
    
    def test_analyze_clip_content_api(self, client, mock_sentiment_analyzer, mock_entity_recognizer):
        """Test analyzing clip content via API."""
        text = "Nelson Mandela spoke about freedom and democracy in South Africa"
        
        response = client.post(
            "/api/metadata/clips/test_clip/analyze",
            params={
                "text": text,
                "auto_apply": False,
                "min_confidence": 0.8
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["clip_id"] == "test_clip"
        assert "analysis_result" in data
        assert "auto_applied_tags" in data
        
        analysis = data["analysis_result"]
        assert "sentiment_data" in analysis
        assert "named_entities" in analysis
        assert "suggested_tags" in analysis
    
    def test_suggest_tags_for_text_api(self, client, test_session):
        """Test suggesting tags for text via API."""
        from backend.models.metadata import Tag
        
        # Create test tags
        mandela_tag = Tag(name="Nelson Mandela", tag_type="person", usage_count=10)
        freedom_tag = Tag(name="Freedom", tag_type="topic", usage_count=8)
        
        test_session.add_all([mandela_tag, freedom_tag])
        test_session.commit()
        
        response = client.post(
            "/api/metadata/tags/suggest",
            params={
                "text": "Nelson Mandela fought for freedom",
                "limit": 5
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        tag_names = [tag["name"] for tag in data]
        assert "Nelson Mandela" in tag_names
        assert "Freedom" in tag_names
    
    def test_search_locations_api(self, client, sample_geo_location):
        """Test searching locations via API."""
        response = client.get(
            "/api/metadata/locations/search",
            params={"query": "Cape", "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 1
        cape_town_found = any(loc["name"] == "Cape Town" for loc in data)
        assert cape_town_found
    
    def test_get_locations_near_api(self, client, sample_geo_location):
        """Test getting nearby locations via API."""
        response = client.get(
            "/api/metadata/locations/near",
            params={
                "latitude": -33.9,
                "longitude": 18.4,
                "radius_km": 50.0,
                "limit": 10
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find Cape Town within 50km
        assert len(data) >= 1
    
    def test_extract_locations_from_text_api(self, client):
        """Test extracting locations from text via API."""
        response = client.post(
            "/api/metadata/locations/extract",
            params={"text": "Nelson Mandela was born in Cape Town, South Africa"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should extract known locations
        location_names = [loc["name"] for loc in data]
        assert any("Cape Town" in name for name in location_names)
        assert any("South Africa" in name for name in location_names)
    
    def test_get_metadata_statistics_api(self, client, test_session):
        """Test getting metadata statistics via API."""
        from backend.models.metadata import ClipMetadata, Tag
        
        # Create test data
        clip = ClipMetadata(
            clip_id="stats_clip",
            video_id=None,  # Will be handled by the fixture
            title="Stats Test Clip",
            start_time=0.0,
            end_time=10.0,
            sentiment_label="positive"
        )
        tag = Tag(name="Stats Tag", tag_type="topic", usage_count=1)
        
        test_session.add_all([clip, tag])
        test_session.commit()
        
        response = client.get("/api/metadata/statistics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_clips" in data
        assert "total_videos" in data
        assert "sentiment_distribution" in data
        assert "tags" in data
        
        assert data["total_clips"] >= 1
    
    def test_geocode_address_api(self, client):
        """Test geocoding address via API."""
        response = client.post(
            "/api/metadata/geocode",
            params={"address": "Cape Town, South Africa"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "address" in data
        assert "latitude" in data
        assert "longitude" in data
        assert data["address"] == "Cape Town, South Africa"
    
    def test_reverse_geocode_api(self, client):
        """Test reverse geocoding via API."""
        response = client.post(
            "/api/metadata/reverse-geocode",
            params={
                "latitude": -33.9249,
                "longitude": 18.4241
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "name" in data
        assert "country" in data
    
    def test_api_error_handling(self, client):
        """Test API error handling for various scenarios."""
        # Test invalid JSON
        response = client.post(
            "/api/metadata/tags",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
        
        # Test missing required fields
        response = client.post("/api/metadata/tags", json={})
        assert response.status_code == 422
        
        # Test invalid enum values
        response = client.post("/api/metadata/tags", json={
            "name": "Test",
            "tag_type": "invalid_type"
        })
        assert response.status_code == 422
    
    def test_api_pagination(self, client, test_session):
        """Test API pagination functionality."""
        from backend.models.metadata import Tag
        
        # Create multiple tags
        tags = [
            Tag(name=f"Tag {i}", tag_type="topic", usage_count=i)
            for i in range(25)
        ]
        test_session.add_all(tags)
        test_session.commit()
        
        # Test first page
        response = client.get("/api/metadata/tags?limit=10&offset=0")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 10
        
        # Test second page
        response = client.get("/api/metadata/tags?limit=10&offset=10")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 10
    
    def test_api_performance(self, client, test_session, performance_monitor):
        """Test API performance under load."""
        from backend.models.metadata import Tag
        
        # Create test data
        tags = [
            Tag(name=f"Performance Tag {i}", tag_type="topic", usage_count=i)
            for i in range(100)
        ]
        test_session.add_all(tags)
        test_session.commit()
        
        # Monitor performance
        performance_monitor.start()
        
        # Make multiple API calls
        for i in range(10):
            response = client.get("/api/metadata/tags?limit=20")
            assert response.status_code == 200
        
        performance_monitor.stop()
        
        # Check performance metrics
        assert performance_monitor.duration < 5.0  # Should complete within 5 seconds
        assert performance_monitor.avg_memory_usage < 500  # Should use less than 500MB
    
    @pytest.mark.slow
    def test_api_stress_test(self, client, test_session):
        """Stress test API endpoints."""
        from backend.models.metadata import Tag
        
        # Create large dataset
        tags = [
            Tag(name=f"Stress Tag {i}", tag_type="topic", usage_count=i % 100)
            for i in range(1000)
        ]
        test_session.add_all(tags)
        test_session.commit()
        
        # Perform concurrent-like requests
        for i in range(50):
            response = client.get(f"/api/metadata/tags?query=Stress&limit=50&offset={i * 10}")
            assert response.status_code == 200
            
            # Verify response structure
            data = response.json()
            assert isinstance(data, list)
            assert len(data) <= 50 