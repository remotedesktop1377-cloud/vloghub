"""
Vloghub - AI-powered video creation platform for YouTube creators - Main Application
"""
import os
import sys
import logging
import shutil
import json
import time
from pathlib import Path
from typing import Optional, Tuple, Any, Dict
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent.parent
NUMBA_CACHE_DIR = BASE_DIR / ".numba_cache"
NUMBA_CACHE_DIR.mkdir(exist_ok=True)
os.environ.setdefault("NUMBA_CACHE_DIR", str(NUMBA_CACHE_DIR))
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

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


def upload_video_to_drive(
    final_video_path: str, job_id: str, target_folder: str
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    max_retries = 2
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            logger.info(
                f"Uploading final video to Google Drive (attempt {attempt + 1}/{max_retries})..."
            )
            drive_upload = upload_media_to_google_drive(
                final_video_path, job_id, target_folder
            )
            logger.info("✅ Successfully uploaded final video to Google Drive")
            return drive_upload, None
        except Exception as upload_exc:
            error_msg = str(upload_exc)
            error_type = type(upload_exc).__name__

            logger.warning(f"Upload attempt {attempt + 1} failed: {error_msg}")

            if attempt < max_retries - 1:
                logger.info(f"Retrying upload in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                drive_upload_error = {
                    "error": error_msg,
                    "type": error_type,
                    "attempts": max_retries,
                }
                logger.exception(
                    "Failed to upload final video to Google Drive after all retries"
                )
                return None, drive_upload_error

    # Should not reach here, but just in case
    return None, {"error": "Upload failed after all retries", "type": "UnknownError"}

@api_router.post("/process-project-from-json")
async def process_project_from_json(payload: dict):
    try:
        project = payload.get("project") or {}
        job_id = str(project.get("jobId") or uuid4())

        cleanup_directory(TEMP_DIR)

        TEMP_DIR.mkdir(exist_ok=True)
        EXPORTS_DIR.mkdir(exist_ok=True)

        json_path = TEMP_DIR / f"project_{job_id}.json"
        with json_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)

        output_path = EXPORTS_DIR / f"final_video_{job_id}.mp4"
        result = process_project_json(
            TEMP_DIR, EXPORTS_DIR, str(json_path), str(output_path)
        )

        drive_upload = None
        drive_upload_error = None
        if result.get("final_video"):
            final_video_path = str(result["final_video"])
            drive_upload, drive_upload_error = upload_video_to_drive(
                final_video_path, job_id, "output"
            )
            if drive_upload and not drive_upload_error:
                cleanup_job_files(job_id, result)
                cleanup_directory(TEMP_DIR)

        return {
            "jobId": job_id,
            "finalVideo": result.get("final_video"),
            "scenes": result.get("scenes", []),
            "driveUpload": drive_upload,
            "driveUploadError": drive_upload_error,
            "videoThumbnailUrl": project.get("videoThumbnailUrl"),
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
        raise HTTPException(
            status_code=404, detail=f"Final video not found at {final_path}"
        )

    drive_upload, drive_upload_error = upload_video_to_drive(
        str(final_path), job_id, target_folder
    )

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
        raise HTTPException(
            status_code=404, detail="No processed archive available yet."
        )
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
    return {"message": "Welcome to Vloghub API", "status": "online", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

def cleanup_directory(directory: Path) -> None:
    """Helper method to remove all files and directories in a given directory"""
    try:
        if directory.exists() and directory.is_dir():
            for item in directory.iterdir():
                try:
                    if item.is_file():
                        item.unlink()
                    elif item.is_dir():
                        shutil.rmtree(item, ignore_errors=True)
                except Exception:
                    pass
    except Exception:
        logger.exception(f"Failed to clean directory: {directory}")

def cleanup_job_files(job_id: str, result: Dict[str, Any]) -> None:
    """Clean up job-specific files from both temp and exports directories"""
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
        cleanup_directory(project_processing_dir)
        
        logger.info(f"Job files cleaned successfully for job_id: {job_id}")
    except Exception:
        logger.exception("Failed to clean up job files")

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "10000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"

    uvicorn.run("backend.app:app", host=host, port=port, reload=debug)