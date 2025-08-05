"""
Text processing utilities for transcription cleaning and normalization.
"""
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
import unicodedata

logger = logging.getLogger(__name__)


class TextProcessor:
    """Text processing utilities for transcript cleaning and normalization."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize text processor.
        
        Args:
            config: Configuration parameters.
        """
        self.config = config or {}
        
        # Language-specific settings
        self.supported_languages = {
            "en": "English",
            "af": "Afrikaans", 
            "zu": "Zulu",
            "xh": "Xhosa"
        }
        
        # Common cleaning patterns
        self.noise_patterns = [
            r'\[.*?\]',  # Remove [background music], [applause], etc.
            r'\(.*?\)',  # Remove (coughing), (inaudible), etc.
            r'<.*?>',    # Remove HTML-like tags
            r'&\w+;',    # Remove HTML entities
            r'[♪♫]',     # Remove music notes
            r'>>',       # Remove speaker indicators
            r'--+',      # Remove multiple dashes
        ]
        
        # Punctuation normalization
        self.punctuation_fixes = {
            r'\.{2,}': '.',  # Multiple periods -> single period
            r'\?{2,}': '?',  # Multiple question marks -> single
            r'!{2,}': '!',   # Multiple exclamation marks -> single
            r',{2,}': ',',   # Multiple commas -> single
            r';{2,}': ';',   # Multiple semicolons -> single
            r':{2,}': ':',   # Multiple colons -> single
        }
        
        # Common transcription errors and corrections
        self.common_corrections = {
            "um ": "",           # Remove filler words
            "uh ": "",
            "ah ": "",
            "er ": "",
            "  ": " ",           # Multiple spaces -> single space
            " ,": ",",           # Space before comma
            " .": ".",           # Space before period
            " ?": "?",           # Space before question mark
            " !": "!",           # Space before exclamation
        }
        
        # Language-specific patterns
        self.language_patterns = {
            "af": {  # Afrikaans
                "contractions": {
                    "dis": "dit is",
                    "gaan": "gaan",
                    "sal": "sal"
                }
            },
            "zu": {  # Zulu
                "common_words": ["ngiyabonga", "sawubona", "hamba", "yebo"]
            },
            "xh": {  # Xhosa
                "common_words": ["enkosi", "molo", "ewe", "hayi"]
            }
        }
    
    def clean_text(self, text: str, language: str = "en") -> str:
        """
        Clean and normalize transcribed text.
        
        Args:
            text: Raw transcribed text.
            language: Language code.
            
        Returns:
            Cleaned and normalized text.
        """
        if not text or not text.strip():
            return ""
        
        # Step 1: Unicode normalization
        text = self._normalize_unicode(text)
        
        # Step 2: Remove noise and artifacts
        text = self._remove_noise(text)
        
        # Step 3: Fix punctuation
        text = self._fix_punctuation(text)
        
        # Step 4: Apply common corrections
        text = self._apply_corrections(text)
        
        # Step 5: Language-specific processing
        text = self._apply_language_specific_processing(text, language)
        
        # Step 6: Final cleanup
        text = self._final_cleanup(text)
        
        return text.strip()
    
    def _normalize_unicode(self, text: str) -> str:
        """Normalize Unicode characters."""
        # Normalize to NFC form (canonical composition)
        text = unicodedata.normalize('NFC', text)
        
        # Replace common Unicode variations
        replacements = {
            '"': '"',   # Left double quote
            '"': '"',   # Right double quote
            ''': "'",   # Left single quote
            ''': "'",   # Right single quote
            '…': '...',  # Ellipsis
            '–': '-',   # En dash
            '—': '-',   # Em dash
            '´': "'",   # Acute accent (often misused as apostrophe)
            '`': "'",   # Grave accent (often misused as apostrophe)
        }
        
        for original, replacement in replacements.items():
            text = text.replace(original, replacement)
        
        return text
    
    def _remove_noise(self, text: str) -> str:
        """Remove noise patterns from text."""
        for pattern in self.noise_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Remove speaker labels like "SPEAKER 1:", "John:", etc.
        text = re.sub(r'^[A-Z\s]+:', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\w+:', '', text, flags=re.MULTILINE)
        
        # Remove timestamp patterns like [00:12:34]
        text = re.sub(r'\[\d{1,2}:\d{2}:\d{2}\]', '', text)
        
        return text
    
    def _fix_punctuation(self, text: str) -> str:
        """Fix punctuation issues."""
        for pattern, replacement in self.punctuation_fixes.items():
            text = re.sub(pattern, replacement, text)
        
        # Add space after punctuation if missing
        text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)
        
        # Fix spacing around punctuation
        text = re.sub(r'\s+([.!?,:;])', r'\1', text)
        
        return text
    
    def _apply_corrections(self, text: str) -> str:
        """Apply common transcription corrections."""
        for error, correction in self.common_corrections.items():
            text = text.replace(error, correction)
        
        # Remove duplicate words (common in speech transcription)
        text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text, flags=re.IGNORECASE)
        
        return text
    
    def _apply_language_specific_processing(self, text: str, language: str) -> str:
        """Apply language-specific processing rules."""
        if language not in self.language_patterns:
            return text
        
        patterns = self.language_patterns[language]
        
        # Apply contractions if available
        if "contractions" in patterns:
            for contraction, expansion in patterns["contractions"].items():
                text = re.sub(r'\b' + re.escape(contraction) + r'\b', 
                             expansion, text, flags=re.IGNORECASE)
        
        return text
    
    def _final_cleanup(self, text: str) -> str:
        """Final text cleanup."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace from lines
        lines = [line.strip() for line in text.split('\n')]
        text = '\n'.join(line for line in lines if line)
        
        # Ensure proper capitalization at sentence start
        sentences = re.split(r'([.!?]+)', text)
        result = []
        
        for i, part in enumerate(sentences):
            if i % 2 == 0 and part.strip():  # Sentence content
                part = part.strip()
                if part:
                    part = part[0].upper() + part[1:] if len(part) > 1 else part.upper()
                result.append(part)
            elif part.strip():  # Punctuation
                result.append(part)
        
        return ''.join(result)
    
    def normalize_timestamps(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize and validate timestamp information.
        
        Args:
            segments: List of segment dictionaries with timing info.
            
        Returns:
            Normalized segments with corrected timestamps.
        """
        normalized = []
        last_end_time = 0.0
        
        for i, segment in enumerate(segments):
            start_time = float(segment.get('start_time', last_end_time))
            end_time = float(segment.get('end_time', start_time + 1.0))
            
            # Ensure logical ordering
            if start_time < last_end_time:
                start_time = last_end_time
            
            if end_time <= start_time:
                end_time = start_time + 0.1  # Minimum segment duration
            
            # Gap detection and correction
            if start_time > last_end_time + 1.0:  # Gap larger than 1 second
                # Log gap but don't automatically fill
                logger.debug(f"Gap detected between segments {i-1} and {i}: "
                           f"{last_end_time:.2f}s to {start_time:.2f}s")
            
            normalized_segment = {
                **segment,
                'start_time': round(start_time, 2),
                'end_time': round(end_time, 2),
                'duration': round(end_time - start_time, 2)
            }
            
            normalized.append(normalized_segment)
            last_end_time = end_time
        
        return normalized
    
    def detect_language(self, text: str) -> Tuple[str, float]:
        """
        Simple language detection for supported languages.
        
        Args:
            text: Text to analyze.
            
        Returns:
            Tuple of (language_code, confidence).
        """
        if not text or len(text.strip()) < 10:
            return "en", 0.0
        
        text_lower = text.lower()
        
        # Simple keyword-based detection
        language_scores = {}
        
        # English indicators
        english_words = ["the", "and", "is", "was", "are", "were", "have", "has", "will", "would"]
        english_score = sum(1 for word in english_words if word in text_lower)
        language_scores["en"] = english_score
        
        # Afrikaans indicators
        afrikaans_words = ["die", "en", "is", "was", "het", "van", "in", "op", "vir", "dit"]
        afrikaans_score = sum(1 for word in afrikaans_words if word in text_lower)
        language_scores["af"] = afrikaans_score
        
        # Zulu indicators
        zulu_words = ["ngi", "si", "ba", "ku", "li", "ma", "uku", "uma", "nge", "nga"]
        zulu_score = sum(1 for word in zulu_words if any(word in text_word for text_word in text_lower.split()))
        language_scores["zu"] = zulu_score
        
        # Xhosa indicators (similar to Zulu but some differences)
        xhosa_words = ["ndi", "si", "ba", "ku", "li", "xa", "uku", "oko", "nge", "nga"]
        xhosa_score = sum(1 for word in xhosa_words if any(word in text_word for text_word in text_lower.split()))
        language_scores["xh"] = xhosa_score
        
        # Find language with highest score
        if not any(language_scores.values()):
            return "en", 0.0  # Default to English
        
        best_language = max(language_scores, key=language_scores.get)
        max_score = language_scores[best_language]
        
        # Calculate confidence (rough heuristic)
        total_words = len(text_lower.split())
        confidence = min(max_score / max(total_words * 0.1, 1), 1.0)
        
        return best_language, confidence
    
    def extract_speaker_labels(self, text: str) -> List[Tuple[str, str]]:
        """
        Extract speaker labels from text.
        
        Args:
            text: Text that may contain speaker labels.
            
        Returns:
            List of tuples (speaker_id, text_content).
        """
        # Common speaker label patterns
        patterns = [
            r'^([A-Z\s]+):\s*(.+)$',      # "SPEAKER A: text"
            r'^(\w+):\s*(.+)$',           # "John: text"
            r'>>(\w+):\s*(.+)$',          # ">>Speaker: text"
            r'\[(\w+)\]\s*(.+)$',         # "[Speaker] text"
        ]
        
        results = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            speaker_found = False
            for pattern in patterns:
                match = re.match(pattern, line, re.IGNORECASE)
                if match:
                    speaker_id = match.group(1).strip()
                    content = match.group(2).strip()
                    results.append((speaker_id, content))
                    speaker_found = True
                    break
            
            if not speaker_found:
                # No speaker label found, use generic
                results.append(("UNKNOWN", line))
        
        return results
    
    def merge_short_segments(self, segments: List[Dict[str, Any]], 
                           min_duration: float = 2.0) -> List[Dict[str, Any]]:
        """
        Merge segments that are too short with adjacent segments.
        
        Args:
            segments: List of segment dictionaries.
            min_duration: Minimum segment duration in seconds.
            
        Returns:
            Merged segments.
        """
        if not segments:
            return segments
        
        merged = []
        current = segments[0].copy()
        
        for next_segment in segments[1:]:
            current_duration = current.get('end_time', 0) - current.get('start_time', 0)
            
            if current_duration < min_duration:
                # Merge with next segment
                current['end_time'] = next_segment.get('end_time')
                current['text'] = f"{current.get('text', '')} {next_segment.get('text', '')}".strip()
                
                # Combine confidences (weighted average)
                curr_conf = current.get('confidence', 1.0)
                next_conf = next_segment.get('confidence', 1.0)
                current['confidence'] = (curr_conf + next_conf) / 2
            else:
                # Keep current segment and move to next
                merged.append(current)
                current = next_segment.copy()
        
        # Add the last segment
        merged.append(current)
        
        return merged 