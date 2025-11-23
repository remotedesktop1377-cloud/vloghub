"""
YouTube Research Video Clip Finder - Main Application
"""
import os
import logging
import shutil
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from .lib.convert import convert_video_to_audio
from .lib.cut_video import cut_video_segments
from .lib.download import zip_and_download_files
from .lib.llm import process_transcription_with_llm
from .lib.transcribe import transcribe_audio

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
TEMP_DIR = BASE_DIR / "temp"
EXPORTS_DIR = BASE_DIR / "exports"
TEMP_DIR.mkdir(exist_ok=True)
EXPORTS_DIR.mkdir(exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="YouTube Research Video Clip Finder",
    description="A system that searches YouTube for relevant video content, extracts specific clips, and organizes them for research.",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(tags=["Video Processing"])


def _save_upload(file: UploadFile, job_id: str) -> Path:
    safe_name = file.filename or "upload.mp4"
    destination = TEMP_DIR / f"{job_id}_{safe_name}"
    with destination.open("wb") as output, file.file as input_stream:
        shutil.copyfileobj(input_stream, output)
    return destination


@api_router.post("/process")
async def process_video(
    file: UploadFile = File(...),
    jobId: str = Form(""),
):
    """
    Execute the four-step pipeline:
    1. Convert video to audio
    2. Transcribe audio
    3. Plan scenes with LLM
    4. Cut clips & package results
    """
    job_id = jobId

    try:
        video_path = _save_upload(file, job_id)
        audio_path = TEMP_DIR / f"{video_path.stem}.wav"

        video_duration_seconds = convert_video_to_audio(str(video_path), str(audio_path))
        transcription_text = transcribe_audio(str(audio_path))
        transcript_json_path = str(audio_path).replace(".wav", ".json")

        edits = await process_transcription_with_llm(
            transcript_path=transcript_json_path,
            video_duration_seconds=video_duration_seconds,
        )

        clips, scenes_with_clips = await cut_video_segments(str(video_path), edits, job_id)

        processed_json_path = TEMP_DIR / "processed_result.json"
        zip_path = await zip_and_download_files(
            exports_directory=str(EXPORTS_DIR),
            temp_directory=str(TEMP_DIR),
            scene_json_path=str(processed_json_path) if processed_json_path.exists() else None,
        )

        return {
            "jobId": job_id,
            "text": transcription_text,
            "scenes": scenes_with_clips,  # Use scenes with clip paths
            # 'clips': clips,
            # "zipPath": str(zip_path),
        }

    except Exception as exc:
        logger.exception("Video processing failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        file.file.close()


@api_router.get("/download")
async def download_processed_files():
    """
    Return the most recent processed ZIP bundle.
    """
    zip_path = TEMP_DIR / "processed_files.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="No processed archive available yet.")
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename="processed_files.zip",
    )

@api_router.get("/status")
async def processing_status():
    """
    Lightweight status endpoint in lieu of a persistent job tracker.
    """
    processed_json = TEMP_DIR / "processed_result.json"
    latest_zip = TEMP_DIR / "processed_files.zip"
    return {
        "processedResultExists": processed_json.exists(),
        "zipAvailable": latest_zip.exists(),
    }


# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint that returns a welcome message."""
    return {
        "message": "Welcome to YouTube Research Video Clip Finder API",
        "status": "online",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    
    uvicorn.run("app:app", host=host, port=port, reload=debug) 