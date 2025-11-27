"""
Vloghub - AI-powered video creation platform for YouTube creators - Main Application
"""
import os
import sys
import logging
import shutil
import json
from pathlib import Path
from typing import Optional, Tuple, Any, Dict
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent.parent
# NUMBA_CACHE_DIR = BASE_DIR / ".numba_cache"
# NUMBA_CACHE_DIR.mkdir(exist_ok=True)
# os.environ.setdefault("NUMBA_CACHE_DIR", str(NUMBA_CACHE_DIR))
# os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from backend.api.convert import convert_video_to_audio
from backend.api.cut_video import cut_video_segments
from backend.api.download import zip_and_download_files
from backend.api.llm import process_transcription_with_llm
from backend.api.transcribe import transcribe_audio
from backend.api.project_processor import process_project_json
from backend.services.google_drive_upload_service import upload_media_to_google_drive

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
EXPORTS_DIR = BASE_DIR / "exports"
EXPORTS_DIR.mkdir(exist_ok=True)
TEMP_DIR = EXPORTS_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Vloghub - AI-powered video creation platform",
    description="Vloghub is an AI-powered video creation platform that helps you create stunning videos with ease. It uses the latest AI technologies to generate videos from your ideas and content.",
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


def upload_video_to_drive(final_video_path: str, job_id: str, target_folder: str) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    try:
        drive_upload = upload_media_to_google_drive(final_video_path, job_id, target_folder)
        return drive_upload, None
    except Exception as upload_exc:
        drive_upload_error = {
            "error": str(upload_exc),
            "type": type(upload_exc).__name__,
        }
        logger.exception("Failed to upload final video to Google Drive")
        return None, drive_upload_error


def cleanup_job_files(job_id: str, result: Dict[str, Any]) -> None:
    try:
        final_video = result.get("final_video")
        if final_video:
            path_obj = Path(str(final_video))
            if path_obj.exists():
                path_obj.unlink()
        scenes = result.get("scenes") or []
        for scene_path in scenes:
            path_obj = Path(str(scene_path))
            if path_obj.exists():
                path_obj.unlink()
        project_json = TEMP_DIR / f"project_{job_id}.json"
        if project_json.exists():
            project_json.unlink()
        project_processing_dir = TEMP_DIR / "project_processing"
        if project_processing_dir.exists() and project_processing_dir.is_dir():
            for item in project_processing_dir.iterdir():
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
    except Exception:
        logger.exception("Failed to clean up job files")


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
            "scenes": scenes_with_clips, 
            # 'clips': clips,
            # "zipPath": str(zip_path),
        }

    except Exception as exc:
        logger.exception("Video processing failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        file.file.close()


@api_router.post("/process-project-from-json")
async def process_project_from_json(payload: dict):
    try:
        project = payload.get("project") or {}
        job_id = str(project.get("jobId") or uuid4())

        TEMP_DIR.mkdir(exist_ok=True)
        EXPORTS_DIR.mkdir(exist_ok=True)

        json_path = TEMP_DIR / f"project_{job_id}.json"
        with json_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)

        output_path = EXPORTS_DIR / f"final_video_{job_id}.mp4"
        result = process_project_json(TEMP_DIR, EXPORTS_DIR, str(json_path), str(output_path))

        drive_upload = None
        drive_upload_error = None
        if result.get("final_video"):
            final_video_path = str(result["final_video"])
            drive_upload, drive_upload_error = upload_video_to_drive(final_video_path, job_id, "output")
            if drive_upload and not drive_upload_error:
                cleanup_job_files(job_id, result)

        return {
            "jobId": job_id,
            "finalVideo": result.get("final_video"),
            "scenes": result.get("scenes", []),
            "driveUpload": drive_upload,
            "driveUploadError": drive_upload_error,
        }
    except Exception as exc:
        logger.exception("Project JSON processing failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@api_router.post("/upload-video")
async def upload_video(payload: dict):
    job_id = payload.get("jobId") or payload.get("job_id")
    target_folder = payload.get("targetFolder") or "output"
    final_path = payload.get("finalPath")
    
    if not job_id:
        raise HTTPException(status_code=400, detail="jobId is required")

    if not Path(final_path).exists():
        raise HTTPException(status_code=404, detail=f"Final video not found at {final_path}")

    drive_upload, drive_upload_error = upload_video_to_drive(str(final_path), job_id, target_folder)

    return {
        "jobId": job_id,
        "finalVideo": str(final_path),
        "driveUpload": drive_upload,
        "driveUploadError": drive_upload_error,
    }


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
        "message": "Welcome to Vloghub API",
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
    port = int(os.getenv("PORT", "10000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"

    uvicorn.run("backend.app:app", host=host, port=port, reload=debug)