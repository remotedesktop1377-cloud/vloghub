"""
spaCy-based named entity recognizer with multi-language support.
"""
import logging
import time
from typing import Dict, Any, Optional, List

try:
    import spacy
    from spacy.lang.en import English
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False

from .base import BaseEntityRecognizer
from .models import Entity, EntityType, EntityResult

logger = logging.getLogger(__name__)


class SpacyEntityRecognizer(BaseEntityRecognizer):
    """spaCy-based named entity recognizer with multi-language support."""
    
    def __init__(self, 
                 model_name: str = "en_core_web_sm",
                 language_models: Optional[Dict[str, str]] = None,
                 config: Optional[Dict[str, Any]] = None):
        """
        Initialize the spaCy entity recognizer.
        
        Args:
            model_name: Default spaCy model to use.
            language_models: Mapping of language codes to spaCy model names.
            config: Additional configuration parameters.
        """
        super().__init__(config)
        
        if not SPACY_AVAILABLE:
            raise ImportError("spaCy package is required")
        
        self.model_name = model_name
        self.language_models = language_models or {
            "en": "en_core_web_sm",
            "af": "en_core_web_sm",  # Use English for Afrikaans as fallback
            "zu": "en_core_web_sm",  # Use English for Zulu as fallback
            "xh": "en_core_web_sm",  # Use English for Xhosa as fallback
        }
        
        # Load models
        self.models = {}
        self._load_models()
    
    def _load_models(self):
        """Load spaCy models for different languages."""
        try:
            # Load default model
            self.models["default"] = spacy.load(self.model_name)
            
            # Load language-specific models
            for lang_code, model_name in self.language_models.items():
                try:
                    self.models[lang_code] = spacy.load(model_name)
                except OSError:
                    logger.warning(f"Could not load spaCy model {model_name} for language {lang_code}")
                    self.models[lang_code] = self.models["default"]
                    
        except OSError as e:
            logger.error(f"Could not load default spaCy model {self.model_name}: {e}")
            raise
    
    def _get_model(self, language: Optional[str] = None):
        """Get the appropriate spaCy model for a language."""
        if language and language in self.models:
            return self.models[language]
        return self.models["default"]
    
    def _map_spacy_label(self, spacy_label: str) -> EntityType:
        """Map spaCy entity labels to our EntityType enum."""
        label_map = {
            "PERSON": EntityType.PERSON,
            "PER": EntityType.PERSON,
            "ORG": EntityType.ORGANIZATION,
            "GPE": EntityType.LOCATION,  # Geopolitical entity
            "LOC": EntityType.LOCATION,
            "DATE": EntityType.DATE,
            "TIME": EntityType.TIME,
            "EVENT": EntityType.EVENT,
            "PRODUCT": EntityType.PRODUCT,
            "MONEY": EntityType.MONEY,
            "QUANTITY": EntityType.QUANTITY,
            "CARDINAL": EntityType.QUANTITY,
            "ORDINAL": EntityType.QUANTITY,
            "PERCENT": EntityType.QUANTITY,
            "LANGUAGE": EntityType.LANGUAGE,
            "NORP": EntityType.NATIONALITY,  # Nationalities, religious groups
        }
        
        return label_map.get(spacy_label.upper(), EntityType.OTHER)
    
    async def extract_entities(self, text: str, language: Optional[str] = None) -> EntityResult:
        """
        Extract entities from text using spaCy.
        
        Args:
            text: Text to analyze.
            language: Language code for the text.
            
        Returns:
            Entity recognition result.
        """
        start_time = time.time()
        
        try:
            # Get appropriate model
            nlp = self._get_model(language)
            
            # Process text
            doc = nlp(text)
            
            # Extract entities
            entities = []
            total_confidence = 0.0
            
            for ent in doc.ents:
                entity_type = self._map_spacy_label(ent.label_)
                
                # spaCy doesn't provide confidence scores by default,
                # so we use a heuristic based on entity length and type
                confidence = self._calculate_confidence(ent)
                total_confidence += confidence
                
                entity = Entity(
                    text=ent.text,
                    type=entity_type,
                    confidence=confidence,
                    start_char=ent.start_char,
                    end_char=ent.end_char,
                    normalized_value=ent.text.lower().replace(" ", "_"),
                    metadata={
                        "spacy_label": ent.label_,
                        "spacy_explanation": spacy.explain(ent.label_)
                    }
                )
                entities.append(entity)
            
            # Calculate overall confidence
            overall_confidence = (total_confidence / len(entities)) if entities else 0.0
            processing_time = time.time() - start_time
            
            # Detect language if not provided
            detected_language = language or self._detect_language(doc)
            
            return EntityResult(
                text=text,
                entities=entities,
                language=detected_language,
                confidence=min(overall_confidence, 1.0),
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error extracting entities with spaCy: {e}")
            processing_time = time.time() - start_time
            
            return EntityResult(
                text=text,
                entities=[],
                confidence=0.0,
                processing_time=processing_time
            )
    
    def _calculate_confidence(self, ent) -> float:
        """Calculate confidence score for a spaCy entity."""
        # Heuristic confidence based on entity characteristics
        base_confidence = 0.7
        
        # Longer entities tend to be more reliable
        length_bonus = min(len(ent.text) / 20.0, 0.2)
        
        # Some entity types are more reliable than others
        type_confidence = {
            "PERSON": 0.1,
            "ORG": 0.1,
            "GPE": 0.15,
            "DATE": 0.2,
            "MONEY": 0.2,
        }
        
        type_bonus = type_confidence.get(ent.label_, 0.05)
        
        return min(base_confidence + length_bonus + type_bonus, 1.0)
    
    def _detect_language(self, doc) -> Optional[str]:
        """Attempt to detect language from spaCy doc."""
        # This is a simple heuristic - in practice, you might want to use
        # a dedicated language detection library
        if hasattr(doc._, 'language'):
            return doc._.language
        return "en"  # Default to English
    
    async def extract_multilingual(self, text: str, languages: List[str]) -> Dict[str, EntityResult]:
        """
        Extract entities using multiple language models.
        
        Args:
            text: Text to analyze.
            languages: List of language codes to try.
            
        Returns:
            Dictionary mapping language codes to entity results.
        """
        results = {}
        
        for language in languages:
            try:
                result = await self.extract_entities(text, language)
                results[language] = result
            except Exception as e:
                logger.error(f"Error processing with language {language}: {e}")
        
        return results 