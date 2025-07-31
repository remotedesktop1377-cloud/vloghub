"""
Tests for the OpenAI prompt enhancer.
"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.ai.prompt_enhancer.openai_enhancer import OpenAIPromptEnhancer
from src.ai.prompt_enhancer.models import EnhancedPrompt


@pytest.fixture
def mock_openai_client():
    """Fixture for mocking the OpenAI client."""
    with patch('src.ai.prompt_enhancer.openai_enhancer.AsyncOpenAI') as mock_client:
        # Create a mock response for the chat completions
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        
        # Set up the mock client to return the mock response
        mock_client_instance = MagicMock()
        mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_client.return_value = mock_client_instance
        
        yield mock_client_instance


@pytest.mark.asyncio
async def test_extract_entities(mock_openai_client):
    """Test extracting entities from a prompt."""
    # Set up the mock response
    mock_content = json.dumps({
        "entities": [
            {
                "text": "Nelson Mandela",
                "type": "person",
                "confidence": 0.95,
                "start_char": 0,
                "end_char": 13
            }
        ]
    })
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = mock_content
    
    # Create the enhancer and call the method
    enhancer = OpenAIPromptEnhancer(api_key="test_key")
    result = await enhancer.extract_entities("Nelson Mandela speech after prison release")
    
    # Verify the result
    assert len(result) == 1
    assert result[0]["text"] == "Nelson Mandela"
    assert result[0]["type"] == "person"
    assert result[0]["confidence"] == 0.95


@pytest.mark.asyncio
async def test_extract_temporal_references(mock_openai_client):
    """Test extracting temporal references from a prompt."""
    # Set up the mock response
    mock_content = json.dumps({
        "temporal_references": [
            {
                "text": "1990",
                "type": "year",
                "normalized_value": "1990",
                "start_date": "1990-01-01",
                "end_date": "1990-12-31",
                "confidence": 0.9
            }
        ]
    })
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = mock_content
    
    # Create the enhancer and call the method
    enhancer = OpenAIPromptEnhancer(api_key="test_key")
    result = await enhancer.extract_temporal_references("Mandela speech after prison release in 1990")
    
    # Verify the result
    assert len(result) == 1
    assert result[0]["text"] == "1990"
    assert result[0]["type"] == "year"
    assert result[0]["normalized_value"] == "1990"


@pytest.mark.asyncio
async def test_extract_location_references(mock_openai_client):
    """Test extracting location references from a prompt."""
    # Set up the mock response
    mock_content = json.dumps({
        "location_references": [
            {
                "text": "South Africa",
                "normalized_name": "South Africa",
                "country_code": "ZA",
                "confidence": 0.95
            }
        ]
    })
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = mock_content
    
    # Create the enhancer and call the method
    enhancer = OpenAIPromptEnhancer(api_key="test_key")
    result = await enhancer.extract_location_references("Mandela speech in South Africa")
    
    # Verify the result
    assert len(result) == 1
    assert result[0]["text"] == "South Africa"
    assert result[0]["country_code"] == "ZA"


@pytest.mark.asyncio
async def test_generate_related_terms(mock_openai_client):
    """Test generating related terms for entities."""
    # Set up the mock response
    mock_content = json.dumps({
        "related_terms": [
            {
                "text": "ANC",
                "relation_type": "organization",
                "source_entity": "Nelson Mandela",
                "confidence": 0.9
            }
        ]
    })
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = mock_content
    
    # Create the enhancer and call the method
    enhancer = OpenAIPromptEnhancer(api_key="test_key")
    entities = [{"text": "Nelson Mandela", "type": "person"}]
    result = await enhancer.generate_related_terms(entities)
    
    # Verify the result
    assert len(result) == 1
    assert result[0]["text"] == "ANC"
    assert result[0]["relation_type"] == "organization"
    assert result[0]["source_entity"] == "Nelson Mandela"


@pytest.mark.asyncio
async def test_generate_search_queries(mock_openai_client):
    """Test generating search queries."""
    # Set up the mock response
    mock_content = json.dumps({
        "primary_query": "Nelson Mandela speech after prison release 1990",
        "alternative_queries": [
            "Mandela freedom speech 1990",
            "Nelson Mandela first speech after imprisonment"
        ],
        "search_params": {
            "publishedAfter": "1990-01-01T00:00:00Z",
            "publishedBefore": "1990-12-31T23:59:59Z",
            "regionCode": "ZA"
        }
    })
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = mock_content
    
    # Create the enhancer and call the method
    enhancer = OpenAIPromptEnhancer(api_key="test_key")
    result = await enhancer.generate_search_queries(
        "Mandela speech after prison release in 1990",
        [{"text": "Nelson Mandela", "type": "person"}],
        [{"text": "1990", "type": "year", "normalized_value": "1990"}],
        [{"text": "South Africa", "normalized_name": "South Africa", "country_code": "ZA"}],
        [{"text": "ANC", "relation_type": "organization", "source_entity": "Nelson Mandela"}]
    )
    
    # Verify the result
    assert result["primary_query"] == "Nelson Mandela speech after prison release 1990"
    assert len(result["alternative_queries"]) == 2
    assert result["search_params"]["regionCode"] == "ZA"


@pytest.mark.asyncio
async def test_enhance_full_flow(mock_openai_client):
    """Test the full enhancement flow."""
    # Set up mock responses for each API call
    responses = [
        # extract_entities response
        json.dumps({
            "entities": [
                {
                    "text": "Nelson Mandela",
                    "type": "person",
                    "confidence": 0.95,
                    "start_char": 0,
                    "end_char": 13
                }
            ]
        }),
        # extract_temporal_references response
        json.dumps({
            "temporal_references": [
                {
                    "text": "1990",
                    "type": "year",
                    "normalized_value": "1990",
                    "start_date": "1990-01-01",
                    "end_date": "1990-12-31",
                    "confidence": 0.9
                }
            ]
        }),
        # extract_location_references response
        json.dumps({
            "location_references": [
                {
                    "text": "South Africa",
                    "normalized_name": "South Africa",
                    "country_code": "ZA",
                    "confidence": 0.95
                }
            ]
        }),
        # generate_related_terms response
        json.dumps({
            "related_terms": [
                {
                    "text": "ANC",
                    "relation_type": "organization",
                    "source_entity": "Nelson Mandela",
                    "confidence": 0.9
                }
            ]
        }),
        # generate_search_queries response
        json.dumps({
            "primary_query": "Nelson Mandela speech after prison release 1990",
            "alternative_queries": [
                "Mandela freedom speech 1990",
                "Nelson Mandela first speech after imprisonment"
            ],
            "search_params": {
                "publishedAfter": "1990-01-01T00:00:00Z",
                "publishedBefore": "1990-12-31T23:59:59Z",
                "regionCode": "ZA"
            }
        })
    ]
    
    # Configure the mock to return different responses for each call
    mock_openai_client.chat.completions.create.side_effect = [
        MagicMock(choices=[MagicMock(message=MagicMock(content=response))])
        for response in responses
    ]
    
    # Create the enhancer and call the enhance method
    enhancer = OpenAIPromptEnhancer(api_key="test_key")
    result = await enhancer.enhance("Nelson Mandela speech after prison release in 1990")
    
    # Verify the result
    assert isinstance(result, EnhancedPrompt)
    assert result.original_prompt == "Nelson Mandela speech after prison release in 1990"
    assert result.primary_query == "Nelson Mandela speech after prison release 1990"
    assert len(result.entities) == 1
    assert result.entities[0].text == "Nelson Mandela"
    assert len(result.temporal_references) == 1
    assert result.temporal_references[0].text == "1990"
    assert len(result.location_references) == 1
    assert result.location_references[0].text == "South Africa"
    assert len(result.related_terms) == 1
    assert result.related_terms[0].text == "ANC"
    assert result.search_params["regionCode"] == "ZA" 