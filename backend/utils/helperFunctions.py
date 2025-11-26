import re
from typing import List, Dict


class HelperFunctions:
    """
    Centralised helper methods for scene segmentation and formatting.
    """

    MIN_SCENES = 2
    MAX_SCENES = 8
    MIN_WORDS_PER_SCENE = 30
    MAX_WORDS_PER_SCENE = 200

    @staticmethod
    def format_time_range(start_time: float, end_time: float) -> str:
        def format_point(point: float) -> str:
            point = max(0, point)
            mins = int(point // 60)
            secs = int(round(point - mins * 60))
            return f"{mins:01d}:{secs:02d}"

        return f"{format_point(start_time)} - {format_point(end_time)}"

    @classmethod
    def determine_scene_count(cls, total_duration: float, total_words: int) -> int:
        if total_duration <= 0:
            return cls.MIN_SCENES

        # Use duration as primary driver (roughly 12-18s per scene)
        duration_based = max(
            cls.MIN_SCENES,
            min(cls.MAX_SCENES, round(total_duration / 15) or cls.MIN_SCENES)
        )

        # Prevent creating too many scenes for very small scripts
        max_possible_from_words = max(
            cls.MIN_SCENES,
            min(cls.MAX_SCENES, max(1, total_words // cls.MIN_WORDS_PER_SCENE))
        )

        return max(cls.MIN_SCENES, min(duration_based, max_possible_from_words))

    @staticmethod
    def _sentence_tokenize(text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        sentences = [sentence.strip() for sentence in sentences if sentence.strip()]
        if sentences:
            return sentences
        return [text.strip()] if text.strip() else []

    @classmethod
    def fallback_scene_texts(cls, transcription: str, desired_scene_count: int) -> List[str]:
        sentences = cls._sentence_tokenize(transcription)
        if not sentences:
            return []

        scenes: List[str] = []
        current_block: List[str] = []
        current_word_count = 0

        for sentence in sentences:
            sentence_word_count = len(sentence.split())

            if current_word_count + sentence_word_count > cls.MAX_WORDS_PER_SCENE and current_block:
                scenes.append(" ".join(current_block).strip())
                current_block = []
                current_word_count = 0

            current_block.append(sentence)
            current_word_count += sentence_word_count

            # Close the scene when minimum length reached and we still can allocate more scenes
            if (
                current_word_count >= cls.MIN_WORDS_PER_SCENE
                and len(scenes) + 1 < desired_scene_count
            ):
                scenes.append(" ".join(current_block).strip())
                current_block = []
                current_word_count = 0

        if current_block:
            scenes.append(" ".join(current_block).strip())

        # If we still don't have enough scenes, split the longest ones
        while len(scenes) < desired_scene_count:
            longest_index = max(range(len(scenes)), key=lambda idx: len(scenes[idx].split()), default=None)
            if longest_index is None:
                break
            longest_scene = scenes.pop(longest_index)
            midpoint = len(longest_scene.split()) // 2
            words = longest_scene.split()
            first_half = " ".join(words[:midpoint]).strip()
            second_half = " ".join(words[midpoint:]).strip()
            if not first_half or not second_half:
                scenes.insert(longest_index, longest_scene)
                break
            scenes.insert(longest_index, second_half)
            scenes.insert(longest_index, first_half)

        return scenes[:cls.MAX_SCENES]

    @classmethod
    def calculate_scene_timings(cls, scene_texts: List[str], total_duration: float) -> List[Dict]:
        if not scene_texts:
            return []

        safe_duration = total_duration if total_duration > 0 else len(scene_texts) * 10
        total_words = sum(len(scene.split()) for scene in scene_texts) or len(scene_texts)

        current_time = 0.0
        scene_payload: List[Dict] = []

        for index, scene_text in enumerate(scene_texts):
            words_in_scene = len(scene_text.split()) or 1
            proportional_duration = safe_duration * (words_in_scene / total_words)
            proportional_duration = max(1.0, proportional_duration)
            end_time = current_time + proportional_duration

            # Ensure final scene ends exactly at total duration
            if index == len(scene_texts) - 1:
                end_time = safe_duration

            duration_in_seconds = max(0.0, end_time - current_time)

            scene_payload.append({
                "id": f"scene-{index + 1}",
                "narration": scene_text.strip(),
                "duration": cls.format_time_range(current_time, end_time),
                "words": len(scene_text.split()),
                "startTime": round(current_time, 2),
                "endTime": round(end_time, 2),
                "durationInSeconds": round(duration_in_seconds, 2),
            })

            current_time = end_time

        return scene_payload

    @staticmethod
    def find_keyword_timestamps(
        transcription_text: str, 
        keyword: str, 
        video_duration: float
    ) -> List[float]:
        """
        Find all occurrences of a keyword in transcription and estimate their timestamps.
        
        Args:
            transcription_text: Full transcription text
            keyword: Keyword to search for
            video_duration: Total duration of the video in seconds
            
        Returns:
            List of estimated timestamps (in seconds) where the keyword appears
        """
        if not transcription_text or not keyword:
            return []
        
        # Normalize both text and keyword for case-insensitive search
        normalized_text = transcription_text.lower()
        normalized_keyword = keyword.lower()
        
        # Find all occurrences
        timestamps = []
        words = transcription_text.split()
        total_words = len(words)
        
        if total_words == 0:
            return []
        
        # Calculate average time per word
        time_per_word = video_duration / total_words if total_words > 0 else 0
        
        # Find all positions of the keyword in the text
        start_pos = 0
        while True:
            pos = normalized_text.find(normalized_keyword, start_pos)
            if pos == -1:
                break
            
            # Count words before this position
            text_before = normalized_text[:pos]
            words_before = len(text_before.split())
            
            # Estimate timestamp
            estimated_time = words_before * time_per_word
            timestamps.append(estimated_time)
            
            start_pos = pos + 1
        
        return timestamps

__all__ = ["HelperFunctions"]

