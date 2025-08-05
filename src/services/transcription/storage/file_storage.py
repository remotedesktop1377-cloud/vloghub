"""
File-based storage service for transcripts.
"""
import os
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List

from src.services.transcription.models import Transcript

logger = logging.getLogger(__name__)


class TranscriptFileStorage:
    """
    File-based storage for transcripts.
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        """
        Initialize the transcript storage.
        
        Args:
            storage_dir: Directory to store transcripts. If None, uses './data/transcripts'.
        """
        self.storage_dir = Path(storage_dir or os.path.join("data", "transcripts"))
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Initialized transcript storage at {self.storage_dir}")
    
    def save_transcript(self, transcript: Transcript) -> bool:
        """
        Save a transcript to storage.
        
        Args:
            transcript: Transcript to save.
            
        Returns:
            True if the transcript was saved successfully.
        """
        try:
            file_path = self._get_transcript_path(transcript.video_id)
            
            # Convert transcript to dict
            transcript_dict = transcript.model_dump()
            
            # Save to file
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(transcript_dict, f, ensure_ascii=False, indent=2)
            
            logger.debug(f"Saved transcript for video {transcript.video_id} to {file_path}")
            return True
        
        except Exception as e:
            logger.error(f"Error saving transcript for video {transcript.video_id}: {e}")
            return False
    
    def load_transcript(self, video_id: str) -> Optional[Transcript]:
        """
        Load a transcript from storage.
        
        Args:
            video_id: ID of the video.
            
        Returns:
            The transcript if found, None otherwise.
        """
        try:
            file_path = self._get_transcript_path(video_id)
            
            if not file_path.exists():
                logger.debug(f"Transcript file not found for video {video_id}")
                return None
            
            # Load from file
            with open(file_path, "r", encoding="utf-8") as f:
                transcript_dict = json.load(f)
            
            # Convert dict to Transcript
            transcript = Transcript(**transcript_dict)
            
            logger.debug(f"Loaded transcript for video {video_id} from {file_path}")
            return transcript
        
        except Exception as e:
            logger.error(f"Error loading transcript for video {video_id}: {e}")
            return None
    
    def delete_transcript(self, video_id: str) -> bool:
        """
        Delete a transcript from storage.
        
        Args:
            video_id: ID of the video.
            
        Returns:
            True if the transcript was deleted successfully.
        """
        try:
            file_path = self._get_transcript_path(video_id)
            
            if not file_path.exists():
                logger.debug(f"Transcript file not found for video {video_id}")
                return False
            
            # Delete the file
            file_path.unlink()
            
            logger.debug(f"Deleted transcript for video {video_id} from {file_path}")
            return True
        
        except Exception as e:
            logger.error(f"Error deleting transcript for video {video_id}: {e}")
            return False
    
    def list_transcripts(self) -> List[str]:
        """
        List all available transcript video IDs.
        
        Returns:
            List of video IDs with available transcripts.
        """
        try:
            video_ids = []
            
            for file_path in self.storage_dir.glob("*.json"):
                video_id = file_path.stem
                video_ids.append(video_id)
            
            return video_ids
        
        except Exception as e:
            logger.error(f"Error listing transcripts: {e}")
            return []
    
    def _get_transcript_path(self, video_id: str) -> Path:
        """
        Get the file path for a transcript.
        
        Args:
            video_id: ID of the video.
            
        Returns:
            Path to the transcript file.
        """
        return self.storage_dir / f"{video_id}.json" 