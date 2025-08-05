"""
Tests for text processing utilities.
"""
import pytest

from src.services.transcription.text_processing import TextProcessor


@pytest.fixture
def text_processor():
    """Create a text processor instance."""
    return TextProcessor()


def test_clean_text_basic(text_processor):
    """Test basic text cleaning."""
    dirty_text = "  Hello,    world!  "
    clean_text = text_processor.clean_text(dirty_text)
    
    assert clean_text == "Hello, world!"


def test_clean_text_remove_noise(text_processor):
    """Test removal of noise patterns."""
    noisy_text = "[background music] Nelson Mandela was great (applause) <inaudible>"
    clean_text = text_processor.clean_text(noisy_text)
    
    assert "[background music]" not in clean_text
    assert "(applause)" not in clean_text
    assert "<inaudible>" not in clean_text
    assert "Nelson Mandela was great" in clean_text


def test_clean_text_fix_punctuation(text_processor):
    """Test punctuation fixes."""
    bad_punctuation = "Hello...world???Great!!!"
    clean_text = text_processor.clean_text(bad_punctuation)
    
    assert "..." not in clean_text
    assert "???" not in clean_text
    assert "!!!" not in clean_text


def test_clean_text_remove_filler_words(text_processor):
    """Test removal of filler words."""
    text_with_fillers = "Um, I think, uh, Nelson was great, ah, you know."
    clean_text = text_processor.clean_text(text_with_fillers)
    
    assert "um" not in clean_text.lower()
    assert "uh" not in clean_text.lower()
    assert "ah" not in clean_text.lower()


def test_normalize_unicode(text_processor):
    """Test Unicode normalization."""
    unicode_text = "\u201cHello\u201d world\u2019s\u2014best\u201d"
    normalized = text_processor._normalize_unicode(unicode_text)
    
    assert '"' in normalized  # Smart quotes converted
    assert "'" in normalized  # Smart apostrophe converted
    assert "-" in normalized  # Em dash converted


def test_detect_language_english(text_processor):
    """Test English language detection."""
    english_text = "The quick brown fox jumps over the lazy dog"
    language, confidence = text_processor.detect_language(english_text)
    
    assert language == "en"
    assert confidence > 0.0


def test_detect_language_afrikaans(text_processor):
    """Test Afrikaans language detection."""
    afrikaans_text = "Die vinnige bruin jakkals spring oor die lui hond"
    language, confidence = text_processor.detect_language(afrikaans_text)
    
    # Should detect as Afrikaans or default to English if not enough indicators
    assert language in ["af", "en"]


def test_detect_language_short_text(text_processor):
    """Test language detection with short text."""
    short_text = "Hello"
    language, confidence = text_processor.detect_language(short_text)
    
    assert language == "en"  # Default
    assert confidence == 0.0  # Low confidence for short text


def test_extract_speaker_labels(text_processor):
    """Test speaker label extraction."""
    text_with_speakers = """SPEAKER A: Hello, how are you?
    John: I'm doing well, thank you.
    >>INTERVIEWER: What do you think about that?"""
    
    labels = text_processor.extract_speaker_labels(text_with_speakers)
    
    assert len(labels) >= 3
    assert any("SPEAKER A" in label[0] for label in labels)
    assert any("John" in label[0] for label in labels)


def test_normalize_timestamps(text_processor):
    """Test timestamp normalization."""
    segments = [
        {"start_time": "0.0", "end_time": "5.0", "text": "First segment"},
        {"start_time": "3.0", "end_time": "8.0", "text": "Overlapping segment"},  # Overlap
        {"start_time": "10.0", "end_time": "9.0", "text": "Invalid order"},  # Invalid
    ]
    
    normalized = text_processor.normalize_timestamps(segments)
    
    assert len(normalized) == 3
    # Should fix overlaps and invalid orders
    assert normalized[0]["start_time"] == 0.0
    assert normalized[1]["start_time"] >= normalized[0]["end_time"]
    assert normalized[2]["end_time"] > normalized[2]["start_time"]


def test_merge_short_segments(text_processor):
    """Test merging of short segments."""
    segments = [
        {"start_time": 0.0, "end_time": 1.0, "text": "Short", "confidence": 0.8},  # Too short
        {"start_time": 1.0, "end_time": 5.0, "text": "Normal length", "confidence": 0.9},
        {"start_time": 5.0, "end_time": 5.5, "text": "Also short", "confidence": 0.7},  # Too short
        {"start_time": 5.5, "end_time": 10.0, "text": "Another normal", "confidence": 0.8},
    ]
    
    merged = text_processor.merge_short_segments(segments, min_duration=2.0)
    
    # Should merge short segments with adjacent ones
    assert len(merged) < len(segments)
    # Check that text was combined
    assert any("Short" in seg["text"] for seg in merged)


def test_clean_text_empty_input(text_processor):
    """Test cleaning empty or None input."""
    assert text_processor.clean_text("") == ""
    assert text_processor.clean_text(None) == ""
    assert text_processor.clean_text("   ") == ""


def test_clean_text_capitalization(text_processor):
    """Test proper sentence capitalization."""
    text = "hello world. this is a test! what do you think?"
    clean_text = text_processor.clean_text(text)
    
    # Should capitalize sentence starts
    assert clean_text.startswith("Hello")
    sentences = clean_text.split(". ")
    for sentence in sentences[1:]:  # Skip first one
        if sentence.strip():
            assert sentence[0].isupper()


def test_remove_noise_speaker_labels(text_processor):
    """Test removal of speaker labels from text."""
    text_with_labels = "SPEAKER 1: Hello there\nJohn: How are you?\n>>NARRATOR: Meanwhile..."
    clean_text = text_processor._remove_noise(text_with_labels)
    
    assert "SPEAKER 1:" not in clean_text
    assert "John:" not in clean_text
    assert ">>NARRATOR:" not in clean_text
    assert "Hello there" in clean_text
    assert "How are you?" in clean_text


def test_apply_language_specific_processing(text_processor):
    """Test language-specific processing."""
    afrikaans_text = "Dis gaan reg wees."
    processed = text_processor._apply_language_specific_processing(afrikaans_text, "af")
    
    # Should apply Afrikaans-specific rules
    assert "dit is" in processed  # "dis" should expand to "dit is"


def test_fix_punctuation_spacing(text_processor):
    """Test punctuation spacing fixes."""
    bad_spacing = "Hello ,world .How are you ?"
    fixed = text_processor._fix_punctuation(bad_spacing)
    
    assert " ," not in fixed
    assert " ." not in fixed
    assert " ?" not in fixed
    assert "Hello, world." in fixed


def test_final_cleanup(text_processor):
    """Test final text cleanup."""
    messy_text = "  hello   world  \n\n  this is   a test  "
    clean = text_processor._final_cleanup(messy_text)
    
    # Should remove extra whitespace and normalize spacing
    assert "  " not in clean  # No double spaces
    assert clean.strip() == clean  # No leading/trailing whitespace
    assert clean.startswith("Hello")  # Proper capitalization 