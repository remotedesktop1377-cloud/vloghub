"""
Performance tests using Locust for load testing the YouTube Clip Searcher API.
"""
import random
import json
from locust import HttpUser, task, between


class YouTubeClipSearcherUser(HttpUser):
    """Simulates a user interacting with the YouTube Clip Searcher application."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Called when a user starts. Setup test data."""
        self.test_video_id = "test_video_123"
        self.test_clip_id = "test_clip_123"
        self.auth_headers = {"Authorization": "Bearer test_token"}
        
        # Create some test data
        self.setup_test_data()
    
    def setup_test_data(self):
        """Create test data for performance testing."""
        # Create test tags
        tag_data = {
            "name": f"Test Tag {random.randint(1, 1000)}",
            "tag_type": "topic",
            "description": "Performance test tag"
        }
        
        response = self.client.post("/api/metadata/tags", json=tag_data)
        if response.status_code == 200:
            self.test_tag_id = response.json().get("id")
        else:
            self.test_tag_id = None
    
    @task(3)
    def search_tags(self):
        """Test tag search performance."""
        search_params = {
            "query": random.choice(["freedom", "democracy", "mandela", "africa"]),
            "limit": random.randint(10, 50),
            "offset": random.randint(0, 100)
        }
        
        with self.client.get(
            "/api/metadata/tags", 
            params=search_params,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    response.success()
                else:
                    response.failure("Invalid response format")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def get_popular_tags(self):
        """Test popular tags endpoint performance."""
        params = {
            "tag_type": random.choice(["person", "location", "topic", "event"]),
            "limit": random.randint(5, 20)
        }
        
        with self.client.get(
            "/api/metadata/tags/popular",
            params=params,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    response.success()
                else:
                    response.failure("Invalid response format")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def get_tag_statistics(self):
        """Test tag statistics endpoint performance."""
        with self.client.get(
            "/api/metadata/tags/statistics",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                required_keys = ["total_tags", "by_type", "by_source", "top_used"]
                if all(key in data for key in required_keys):
                    response.success()
                else:
                    response.failure("Missing required statistics")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(4)
    def search_clips(self):
        """Test clip search performance."""
        search_filters = {
            "sentiment": random.choice(["positive", "negative", "neutral"]),
            "min_duration": random.randint(10, 30),
            "max_duration": random.randint(60, 120),
            "is_favorite": random.choice([True, False])
        }
        
        params = {
            "page": random.randint(1, 5),
            "page_size": random.randint(10, 50)
        }
        
        with self.client.post(
            "/api/metadata/clips/search",
            json=search_filters,
            params=params,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                required_keys = ["clips", "total_count", "page", "page_size"]
                if all(key in data for key in required_keys):
                    response.success()
                else:
                    response.failure("Invalid search response format")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def create_clip_metadata(self):
        """Test clip metadata creation performance."""
        clip_data = {
            "clip_id": f"perf_test_clip_{random.randint(1, 10000)}",
            "video_id": self.test_video_id,
            "title": f"Performance Test Clip {random.randint(1, 1000)}",
            "description": "This is a performance test clip",
            "start_time": random.uniform(0, 100),
            "end_time": random.uniform(101, 200),
            "transcript_text": "This is a test transcript for performance testing",
            "sentiment_data": {
                "label": random.choice(["positive", "negative", "neutral"]),
                "score": random.uniform(-1, 1),
                "confidence": random.uniform(0.5, 1.0),
                "emotions": {"joy": random.uniform(0, 1)}
            },
            "topic_labels": [random.choice(["freedom", "democracy", "politics"])],
            "keywords": ["test", "performance", "clip"],
            "speaker_name": f"Test Speaker {random.randint(1, 10)}"
        }
        
        with self.client.post(
            "/api/metadata/clips",
            json=clip_data,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "clip_id" in data and data["clip_id"] == clip_data["clip_id"]:
                    response.success()
                else:
                    response.failure("Invalid clip creation response")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def create_tag(self):
        """Test tag creation performance."""
        tag_data = {
            "name": f"Perf Test Tag {random.randint(1, 10000)}",
            "tag_type": random.choice(["person", "location", "topic", "event"]),
            "description": "Performance test tag",
            "confidence": random.uniform(0.5, 1.0)
        }
        
        with self.client.post(
            "/api/metadata/tags",
            json=tag_data,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "name" in data and data["name"] == tag_data["name"]:
                    response.success()
                else:
                    response.failure("Invalid tag creation response")
            elif response.status_code == 400 and "already exists" in response.text:
                # Duplicate tag is acceptable in performance test
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def search_locations(self):
        """Test location search performance."""
        queries = ["cape", "africa", "london", "new york", "johannesburg"]
        
        params = {
            "query": random.choice(queries),
            "limit": random.randint(5, 20)
        }
        
        with self.client.get(
            "/api/metadata/locations/search",
            params=params,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    response.success()
                else:
                    response.failure("Invalid location search response")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def get_metadata_statistics(self):
        """Test metadata statistics performance."""
        with self.client.get(
            "/api/metadata/statistics",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                required_keys = ["total_clips", "total_videos", "sentiment_distribution", "tags"]
                if all(key in data for key in required_keys):
                    response.success()
                else:
                    response.failure("Missing required metadata statistics")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def youtube_search(self):
        """Test YouTube search performance."""
        search_queries = [
            "Nelson Mandela speech",
            "South Africa freedom",
            "democracy history",
            "political speech"
        ]
        
        params = {
            "q": random.choice(search_queries),
            "max_results": random.randint(5, 25),
            "order": random.choice(["relevance", "date", "viewCount"])
        }
        
        with self.client.get(
            "/api/youtube/search",
            params=params,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "items" in data and isinstance(data["items"], list):
                    response.success()
                else:
                    response.failure("Invalid YouTube search response")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def analyze_clip_content(self):
        """Test clip content analysis performance."""
        test_texts = [
            "Nelson Mandela spoke about freedom and democracy in South Africa",
            "The fight for liberation was long and difficult",
            "Democracy requires the participation of all citizens",
            "Freedom is not something that one people can bestow on another"
        ]
        
        params = {
            "text": random.choice(test_texts),
            "auto_apply": False,
            "min_confidence": 0.8
        }
        
        with self.client.post(
            f"/api/metadata/clips/{self.test_clip_id}/analyze",
            params=params,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "analysis_result" in data and "auto_applied_tags" in data:
                    response.success()
                else:
                    response.failure("Invalid analysis response")
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def health_check(self):
        """Test health check endpoint."""
        with self.client.get("/health", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed with status {response.status_code}")


class AdminUser(HttpUser):
    """Simulates admin users performing administrative tasks."""
    
    wait_time = between(2, 5)
    weight = 1  # Lower weight means fewer admin users
    
    @task
    def get_all_statistics(self):
        """Get comprehensive statistics."""
        endpoints = [
            "/api/metadata/statistics",
            "/api/metadata/tags/statistics",
            "/api/metadata/locations/statistics"
        ]
        
        for endpoint in endpoints:
            with self.client.get(endpoint, catch_response=True) as response:
                if response.status_code == 200:
                    response.success()
                else:
                    response.failure(f"Failed to get statistics from {endpoint}")
    
    @task
    def bulk_tag_operations(self):
        """Perform bulk tag operations."""
        # Get many tags
        with self.client.get(
            "/api/metadata/tags",
            params={"limit": 100},
            catch_response=True
        ) as response:
            if response.status_code == 200:
                tags = response.json()
                
                # Test getting related tags for multiple tags
                for tag in tags[:5]:  # Test first 5 tags
                    tag_id = tag.get("id")
                    if tag_id:
                        self.client.get(f"/api/metadata/tags/{tag_id}/related")


class MobileUser(HttpUser):
    """Simulates mobile users with different usage patterns."""
    
    wait_time = between(3, 8)  # Mobile users tend to be slower
    weight = 2  # More mobile users
    
    def on_start(self):
        """Set mobile user agent."""
        self.client.headers.update({
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
        })
    
    @task(5)
    def mobile_search(self):
        """Mobile-optimized search with smaller page sizes."""
        params = {
            "query": random.choice(["mandela", "freedom", "africa"]),
            "limit": random.randint(5, 15),  # Smaller page sizes for mobile
            "offset": 0
        }
        
        self.client.get("/api/metadata/tags", params=params)
    
    @task(2)
    def mobile_clip_browse(self):
        """Browse clips with mobile-friendly pagination."""
        search_filters = {
            "sentiment": "positive",
            "min_duration": 30,
            "max_duration": 180
        }
        
        params = {
            "page": 1,
            "page_size": 10  # Smaller page size for mobile
        }
        
        self.client.post("/api/metadata/clips/search", json=search_filters, params=params)


# Custom test scenarios
class StressTestUser(HttpUser):
    """High-intensity user for stress testing."""
    
    wait_time = between(0.1, 0.5)  # Very short wait times
    weight = 1  # Few stress test users
    
    @task(10)
    def rapid_searches(self):
        """Rapid consecutive searches."""
        for i in range(5):
            self.client.get(f"/api/metadata/tags?query=test{i}&limit=10")
    
    @task(5)
    def concurrent_operations(self):
        """Simulate concurrent operations."""
        import threading
        
        def search_operation():
            self.client.get("/api/metadata/tags?limit=50")
        
        def stats_operation():
            self.client.get("/api/metadata/statistics")
        
        # Create multiple threads for concurrent requests
        threads = []
        for i in range(3):
            t1 = threading.Thread(target=search_operation)
            t2 = threading.Thread(target=stats_operation)
            threads.extend([t1, t2])
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()


# Performance test configuration
class PerformanceTestSettings:
    """Configuration for different performance test scenarios."""
    
    # Light load test
    LIGHT_LOAD = {
        "users": 10,
        "spawn_rate": 2,
        "run_time": "5m"
    }
    
    # Normal load test
    NORMAL_LOAD = {
        "users": 50,
        "spawn_rate": 5,
        "run_time": "10m"
    }
    
    # Heavy load test
    HEAVY_LOAD = {
        "users": 100,
        "spawn_rate": 10,
        "run_time": "15m"
    }
    
    # Stress test
    STRESS_TEST = {
        "users": 200,
        "spawn_rate": 20,
        "run_time": "20m"
    }
    
    # Spike test
    SPIKE_TEST = {
        "users": 500,
        "spawn_rate": 50,
        "run_time": "5m"
    } 