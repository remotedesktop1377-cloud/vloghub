import json
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel

from backend.services.scene_service import request_semantic_scenes
from backend.utils.helperFunctions import HelperFunctions

BASE_DIR = Path(__file__).resolve().parent.parent.parent
EXPORTS_DIR = BASE_DIR / "exports"
TEMP_DIR = EXPORTS_DIR / "temp"

class VideoEdit(BaseModel):
    id: str
    narration: str
    duration: str
    words: int
    startTime: float
    endTime: float
    durationInSeconds: float
    localPath: Optional[str] = None
    # highlightedKeywords: List[str]

def _ensure_scene_word_count(scene_texts: List[str]) -> List[str]:
    """
    Guarantee that each scene has an acceptable number of words.
    """
    filtered: List[str] = []
    for scene in scene_texts:
        words = scene.split()
        if not words:
            continue
        if len(words) < HelperFunctions.MIN_WORDS_PER_SCENE:
            # Append to previous scene when too short
            if filtered:
                filtered[-1] = f"{filtered[-1].strip()} {scene.strip()}".strip()
            else:
                filtered.append(scene.strip())
        else:
            filtered.append(scene.strip())
    return filtered or scene_texts


async def process_transcription_with_llm(
    transcript_path: str,
    video_duration_seconds: float
) -> List[VideoEdit]:
    try:

        # Get the transcription content from the file
        with open(transcript_path, 'r', encoding='utf-8') as f:
            transcript_data = json.load(f)

        transcript_text = transcript_data.get('text', '') if isinstance(transcript_data, dict) else str(transcript_data)

        print(f"Transcription content loaded from {transcript_path}")

        total_words = len(transcript_text.split())
        desired_scene_count = HelperFunctions.determine_scene_count(video_duration_seconds, total_words)

        scene_candidates = []
        try:
            scene_candidates = request_semantic_scenes(
                transcription_text=transcript_text,
                desired_scene_count=desired_scene_count
            )
        except Exception as scene_error:
            print(f"Scene service failed: {scene_error}")

        scene_texts = [
            scene.get("narration", "").strip()
            for scene in scene_candidates if scene.get("narration")
        ]

        if not scene_texts:
            print("Falling back to heuristic scene segmentation.")
            scene_texts = HelperFunctions.fallback_scene_texts(
                transcription=transcript_text,
                desired_scene_count=desired_scene_count
            )
        else:
            scene_texts = _ensure_scene_word_count(scene_texts)

        scene_payload = HelperFunctions.calculate_scene_timings(
            scene_texts,
            total_duration=video_duration_seconds
        )
    
        video_edits = [
            VideoEdit(
                id=f"scene-{index + 1}",
                narration=scene["narration"],
                duration=scene["duration"],
                words=len(scene["narration"].split()),
                startTime=scene["startTime"],
                endTime=scene["endTime"],
                durationInSeconds=scene["durationInSeconds"],
                localPath=scene.get("localPath"),
                # highlightedKeywords=scene["highlightedKeywords"]
            )
            for index, scene in enumerate(scene_payload)
        ]

        TEMP_DIR.mkdir(parents=True, exist_ok=True)
        processed_result_path = TEMP_DIR / "processed_result.json"
        with open(processed_result_path, "w", encoding="utf-8") as f:
            json.dump(scene_payload, f, ensure_ascii=False, indent=4)

        return video_edits

    except Exception as e:
        print(f"Error processing transcript: {e}")
        raise