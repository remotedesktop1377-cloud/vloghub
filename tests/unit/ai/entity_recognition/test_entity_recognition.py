"""
Tests for entity recognition components.
"""
import pytest
from unittest.mock import Mock, AsyncMock
import os

from backend.ai.entity_recognition.models import Entity, EntityType, EntityResult
from backend.ai.entity_recognition.base import BaseEntityRecognizer
from backend.services.transcription.models import TranscriptSegment, Transcript


class MockEntityRecognizer(BaseEntityRecognizer):
    """Mock entity recognizer for testing."""
    
    async def extract_entities(self, text: str) -> EntityResult:
        entities = []
        
        # Simple pattern matching for testing
        if "Nelson Mandela" in text:
            entities.append(Entity(
                text="Nelson Mandela",
                type=EntityType.PERSON,
                confidence=0.95,
                start_char=text.find("Nelson Mandela"),
                end_char=text.find("Nelson Mandela") + len("Nelson Mandela"),
                normalized_value="nelson_mandela"
            ))
        
        if "South Africa" in text:
            entities.append(Entity(
                text="South Africa",
                type=EntityType.LOCATION,
                confidence=0.90,
                start_char=text.find("South Africa"),
                end_char=text.find("South Africa") + len("South Africa"),
                normalized_value="south_africa"
            ))
        
        if "1990" in text:
            entities.append(Entity(
                text="1990",
                type=EntityType.DATE,
                confidence=0.85,
                start_char=text.find("1990"),
                end_char=text.find("1990") + 4,
                normalized_value="1990"
            ))
        
        return EntityResult(
            text=text,
            entities=entities,
            confidence=0.8 if entities else 0.3,
            processing_time=0.1
        )


@pytest.fixture
def entity_recognizer():
    """Create a mock entity recognizer."""
    return MockEntityRecognizer()


@pytest.fixture
def sample_text():
    """Sample text with entities."""
    return "Nelson Mandela was released from prison in South Africa in 1990."


@pytest.fixture
def sample_segment():
    """Create a sample transcript segment."""
    return TranscriptSegment(
        start_time=0.0,
        end_time=15.0,
        text="Nelson Mandela was released from prison in South Africa in 1990.",
        confidence=0.9
    )


@pytest.fixture
def sample_transcript():
    """Create a sample transcript."""
    segments = [
        TranscriptSegment(
            start_time=0.0,
            end_time=15.0,
            text="Nelson Mandela was released from prison in South Africa in 1990.",
            confidence=0.9
        ),
        TranscriptSegment(
            start_time=15.0,
            end_time=30.0,
            text="He became the first black president of the country.",
            confidence=0.8
        ),
        TranscriptSegment(
            start_time=30.0,
            end_time=45.0,
            text="The African National Congress was his political party.",
            confidence=0.7
        )
    ]
    
    return Transcript(
        video_id="test_video",
        language="en",
        segments=segments,
        source="test"
    )


@pytest.mark.asyncio
async def test_extract_entities(entity_recognizer, sample_text):
    """Test basic entity extraction."""
    result = await entity_recognizer.extract_entities(sample_text)
    
    assert isinstance(result, EntityResult)
    assert result.text == sample_text
    assert len(result.entities) == 3  # Nelson Mandela, South Africa, 1990
    
    # Check specific entities
    person_entities = [e for e in result.entities if e.type == EntityType.PERSON]
    assert len(person_entities) == 1
    assert person_entities[0].text == "Nelson Mandela"
    
    location_entities = [e for e in result.entities if e.type == EntityType.LOCATION]
    assert len(location_entities) == 1
    assert location_entities[0].text == "South Africa"
    
    date_entities = [e for e in result.entities if e.type == EntityType.DATE]
    assert len(date_entities) == 1
    assert date_entities[0].text == "1990"


@pytest.mark.asyncio
async def test_extract_from_segment(entity_recognizer, sample_segment):
    """Test entity extraction from transcript segment."""
    result = await entity_recognizer.extract_from_segment(sample_segment)
    
    assert result.segment_id == "0.0_15.0"
    assert result.start_time == 0.0
    assert result.end_time == 15.0
    assert len(result.entities) == 3
    
    # Check that timing information is added to entities
    for entity in result.entities:
        assert entity.start_time == 0.0
        assert entity.end_time == 15.0
    
    # Check entity counts
    assert result.entity_counts[EntityType.PERSON] == 1
    assert result.entity_counts[EntityType.LOCATION] == 1
    assert result.entity_counts[EntityType.DATE] == 1


@pytest.mark.asyncio
async def test_extract_from_transcript(entity_recognizer, sample_transcript):
    """Test entity extraction from full transcript."""
    result = await entity_recognizer.extract_from_transcript(sample_transcript)
    
    assert result.video_id == "test_video"
    assert len(result.segments) == 3
    assert result.language == "en"
    
    # Check that entities are collected from all segments
    assert len(result.all_entities) > 0
    
    # Check entity summary
    if EntityType.PERSON in result.entity_summary:
        person_entities = result.entity_summary[EntityType.PERSON]
        assert any(entity.text == "Nelson Mandela" for entity in person_entities)


def test_filter_entities_by_type(entity_recognizer):
    """Test filtering entities by type."""
    entities = [
        Entity(text="Nelson Mandela", type=EntityType.PERSON, confidence=0.9),
        Entity(text="South Africa", type=EntityType.LOCATION, confidence=0.8),
        Entity(text="1990", type=EntityType.DATE, confidence=0.7),
        Entity(text="President", type=EntityType.CONCEPT, confidence=0.6)
    ]
    
    # Filter only persons and locations
    filtered = entity_recognizer.filter_entities_by_type(
        entities, [EntityType.PERSON, EntityType.LOCATION]
    )
    
    assert len(filtered) == 2
    assert all(e.type in [EntityType.PERSON, EntityType.LOCATION] for e in filtered)


def test_get_entities_by_confidence(entity_recognizer):
    """Test filtering entities by confidence threshold."""
    entities = [
        Entity(text="High confidence", type=EntityType.PERSON, confidence=0.9),
        Entity(text="Medium confidence", type=EntityType.LOCATION, confidence=0.7),
        Entity(text="Low confidence", type=EntityType.DATE, confidence=0.4)
    ]
    
    # Filter by minimum confidence of 0.6
    filtered = entity_recognizer.get_entities_by_confidence(entities, min_confidence=0.6)
    
    assert len(filtered) == 2
    assert all(e.confidence >= 0.6 for e in filtered)


def test_merge_duplicate_entities(entity_recognizer):
    """Test merging duplicate entities."""
    entities = [
        Entity(text="Nelson Mandela", type=EntityType.PERSON, confidence=0.9),
        Entity(text="nelson mandela", type=EntityType.PERSON, confidence=0.7),  # Duplicate
        Entity(text="South Africa", type=EntityType.LOCATION, confidence=0.8),
        Entity(text="Nelson Mandela", type=EntityType.PERSON, confidence=0.95)  # Higher confidence duplicate
    ]
    
    merged = entity_recognizer.merge_duplicate_entities(entities)
    
    # Should have 2 unique entities (Nelson Mandela with highest confidence, South Africa)
    assert len(merged) == 2
    
    # Check that highest confidence Nelson Mandela is kept
    mandela_entity = next(e for e in merged if e.type == EntityType.PERSON)
    assert mandela_entity.confidence == 0.95


@pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="OpenAI API key not available")
@pytest.mark.asyncio
async def test_openai_entity_recognizer_integration():
    """Integration test for OpenAI entity recognizer (requires API key)."""
    from backend.ai.entity_recognition import OpenAIEntityRecognizer
    
    recognizer = OpenAIEntityRecognizer(api_key=os.getenv("OPENAI_API_KEY"))
    
    result = await recognizer.extract_entities(
        "Barack Obama visited Paris, France on January 15, 2020."
    )
    
    assert len(result.entities) > 0
    # Should find person, location, and date entities
    entity_types = [entity.type for entity in result.entities]
    assert EntityType.PERSON in entity_types or any("obama" in e.text.lower() for e in result.entities)


@pytest.mark.skipif(True, reason="spaCy models require download")
@pytest.mark.asyncio 
async def test_spacy_entity_recognizer():
    """Test spaCy entity recognizer (skipped by default due to model requirements)."""
    from backend.ai.entity_recognition import SpacyEntityRecognizer
    
    recognizer = SpacyEntityRecognizer()
    
    result = await recognizer.extract_entities(
        "Apple Inc. was founded by Steve Jobs in California."
    )
    
    assert len(result.entities) > 0
    entity_types = [entity.type for entity in result.entities]
    # Should find organization, person, and location
    assert any(t in [EntityType.ORGANIZATION, EntityType.PERSON, EntityType.LOCATION] 
              for t in entity_types) 