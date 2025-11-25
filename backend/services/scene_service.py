import json
import os
from typing import List, Dict, Any

from dotenv import load_dotenv
import google.generativeai as genai

# Ensure environment variables are loaded before configuring the client
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=api_key)


def request_semantic_scenes(
    transcription_text: str,
    desired_scene_count: int,
    language: str = "en"
) -> List[Dict[str, Any]]:
    """
    Call Gemini to create semantic scene descriptions from a transcription.
    """
    model = genai.GenerativeModel("gemini-2.5-pro")

    prompt = f"""
You are an expert video editing assistant that segments narration into coherent scenes.

Return JSON ONLY in the following format:
{{
  "scenes": [
    {{
      "title": "Scene title (optional)",
      "summary": "Brief summary (1 sentence)",
      "narration": "Exact narration text for this scene"
    }}
  ]
}}

Requirements:
- Target {desired_scene_count} scenes (minimum 2, maximum 8) unless text is extremely short.
- Each scene must contain 30-200 words.
- Preserve the original language ({language}) and logical flow.
- Break at natural topic transitions and avoid duplication.
- Use the provided script context to keep narration relevant.

<transcription>
{transcription_text}
</transcription>
"""

    response = model.generate_content(prompt)
    response_text = response.text.strip()

    # Remove markdown fences if model returns them
    if "```json" in response_text:
        response_text = response_text.split("```json", 1)[1]
        response_text = response_text.split("```", 1)[0]
    elif "```" in response_text:
        response_text = response_text.split("```", 1)[1]
        response_text = response_text.split("```", 1)[0]

    try:
        parsed = json.loads(response_text)
    except json.JSONDecodeError:
        # Attempt to salvage JSON blob
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end != -1:
            parsed = json.loads(response_text[start:end])
        else:
            raise

    scenes = parsed.get("scenes", []) if isinstance(parsed, dict) else parsed
    if not isinstance(scenes, list):
        raise ValueError("Gemini response did not include a valid 'scenes' array")

    cleaned: List[Dict[str, Any]] = []
    for scene in scenes:
        narration = scene.get("narration") or scene.get("text") or scene.get("content")
        if narration:
            cleaned.append({
                "title": scene.get("title", "").strip(),
                "summary": scene.get("summary", "").strip(),
                "narration": narration.strip(),
            })

    return cleaned


__all__ = ["request_semantic_scenes"]

