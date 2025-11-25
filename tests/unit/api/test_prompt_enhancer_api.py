"""
Tests for the prompt enhancer API endpoints.
"""
import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from fastapi import HTTPException
from backend.ai.prompt_enhancer.models import EnhancedPrompt, Entity, TemporalReference, LocationReference, RelatedTerm


@pytest.mark.asyncio
async def test_enhance_prompt_endpoint(test_client, mock_env_vars):
    """Test the enhance prompt endpoint."""
    # Mock the OpenAIPromptEnhancer.enhance method
    with patch('backend.api.routes.prompt_enhancer.OpenAIPromptEnhancer') as mock_enhancer_class:
        # Set up the mock enhancer instance
        mock_enhancer_instance = MagicMock()
        mock_enhancer_instance.enhance = AsyncMock()
        mock_enhancer_class.return_value = mock_enhancer_instance
        
        # Create an actual EnhancedPrompt object instead of a MagicMock
        enhanced_prompt = EnhancedPrompt(
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
                "regionCode": "ZA"
            }
        )
        
        # Configure the mock to return the EnhancedPrompt object
        mock_enhancer_instance.enhance.return_value = enhanced_prompt
        
        # Make the request
        response = test_client.post(
            "/api/prompt-enhancer/enhance",
            json={"prompt": "Nelson Mandela speech after prison release in 1990"}
        )
        
        # Print response for debugging
        print(f"Response status code: {response.status_code}")
        print(f"Response content: {response.content}")
        
        # Verify the response
        assert response.status_code == 200
        result = response.json()
        assert result["original_prompt"] == "Nelson Mandela speech after prison release in 1990"
        assert result["primary_query"] == "Nelson Mandela speech after prison release 1990"
        assert len(result["alternative_queries"]) == 2
        assert len(result["entities"]) == 1
        assert result["entities"][0]["text"] == "Nelson Mandela"


@pytest.mark.asyncio
async def test_enhance_prompt_endpoint_error(test_client, mock_env_vars):
    """Test the enhance prompt endpoint with an error."""
    # Mock the OpenAIPromptEnhancer.enhance method to raise an exception
    with patch('backend.api.routes.prompt_enhancer.OpenAIPromptEnhancer') as mock_enhancer_class:
        # Set up the mock enhancer instance
        mock_enhancer_instance = MagicMock()
        mock_enhancer_instance.enhance = AsyncMock(side_effect=Exception("Test error"))
        mock_enhancer_class.return_value = mock_enhancer_instance
        
        # Make the request
        response = test_client.post(
            "/api/prompt-enhancer/enhance",
            json={"prompt": "Nelson Mandela speech after prison release in 1990"}
        )
        
        # Verify the response
        assert response.status_code == 500
        result = response.json()
        assert "detail" in result
        assert "Error enhancing prompt" in result["detail"]


@pytest.mark.asyncio
async def test_get_enhancer_no_api_key():
    """Test the get_enhancer dependency with no API key."""
    # Import the dependency
    from backend.api.routes.prompt_enhancer import get_enhancer
    
    # Mock the os.getenv function to return None
    with patch('backend.api.routes.prompt_enhancer.os.getenv', return_value=None):
        # Call the dependency and expect an exception
        with pytest.raises(HTTPException) as excinfo:
            await get_enhancer()
        
        # Verify the exception
        assert excinfo.value.status_code == 500
        assert "OpenAI API key not configured" in excinfo.value.detail 