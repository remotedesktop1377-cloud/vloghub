"""
API routes for transcription services.
"""
import os
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field

from src.services.transcription import (
    TranscriptionService, TranscriptionSource, TranscriptionJob, Transcript
)

router = APIRouter(prefix="/transcription", tags=["transcription"])


class TranscribeRequest(BaseModel):
    """Request model for transcribing a video."""
    video_id: str
    source: str = Field(default="youtube", description="Transcription source: youtube or whisper")
    language: Optional[str] = Field(default=None, description="Language code (e.g., 'en')")
    force_new: bool = Field(default=False, description="Force new transcription even if one exists")
    options: Dict[str, Any] = Field(default_factory=dict, description="Additional options for the transcription service")


class TranscribeResponse(BaseModel):
    """Response model for transcription job."""
    job_id: str
    video_id: str
    status: str
    progress: float
    language: Optional[str] = None
    error: Optional[str] = None


class TranscriptResponse(BaseModel):
    """Response model for transcript."""
    video_id: str
    language: str
    segments: List[Dict[str, Any]]
    source: str
    created_at: str
    updated_at: str
    metadata: Dict[str, Any]


class SearchRequest(BaseModel):
    """Request model for searching within a transcript."""
    query: str
    options: Dict[str, Any] = Field(default_factory=dict, description="Additional options for the search")


class SearchResponse(BaseModel):
    """Response model for transcript search results."""
    results: List[Dict[str, Any]]
    count: int


async def get_transcription_service() -> TranscriptionService:
    """
    Dependency to get the transcription service.
    
    Returns:
        An instance of TranscriptionService.
    """
    return TranscriptionService()


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_video(
    request: TranscribeRequest,
    background_tasks: BackgroundTasks,
    transcription_service: TranscriptionService = Depends(get_transcription_service)
) -> Dict[str, Any]:
    """
    Start transcribing a YouTube video.
    
    Args:
        request: Transcription request.
        background_tasks: FastAPI background tasks.
        transcription_service: Transcription service instance.
        
    Returns:
        Transcription job details.
    """
    try:
        job = await transcription_service.transcribe_video(
            video_id=request.video_id,
            source=request.source,
            language=request.language,
            force_new=request.force_new,
            **request.options
        )
        
        return {
            "job_id": job.job_id,
            "video_id": job.video_id,
            "status": job.status.value,
            "progress": job.progress,
            "language": job.language,
            "error": job.error
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing video: {str(e)}")


@router.get("/status/{job_id}", response_model=TranscribeResponse)
async def get_transcription_status(
    job_id: str,
    transcription_service: TranscriptionService = Depends(get_transcription_service)
) -> Dict[str, Any]:
    """
    Get the status of a transcription job.
    
    Args:
        job_id: ID of the transcription job.
        transcription_service: Transcription service instance.
        
    Returns:
        Transcription job status.
    """
    try:
        job = await transcription_service.get_transcription_status(job_id)
        
        return {
            "job_id": job.job_id,
            "video_id": job.video_id,
            "status": job.status.value,
            "progress": job.progress,
            "language": job.language,
            "error": job.error
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting transcription status: {str(e)}")


@router.get("/transcript/{video_id}", response_model=TranscriptResponse)
async def get_transcript(
    video_id: str,
    transcription_service: TranscriptionService = Depends(get_transcription_service)
) -> Dict[str, Any]:
    """
    Get the transcript for a video.
    
    Args:
        video_id: YouTube video ID.
        transcription_service: Transcription service instance.
        
    Returns:
        Transcript data.
    """
    try:
        transcript = await transcription_service.get_transcript(video_id)
        
        if not transcript:
            raise HTTPException(status_code=404, detail=f"Transcript not found for video {video_id}")
        
        return {
            "video_id": transcript.video_id,
            "language": transcript.language,
            "segments": [segment.model_dump() for segment in transcript.segments],
            "source": transcript.source.value,
            "created_at": transcript.created_at.isoformat(),
            "updated_at": transcript.updated_at.isoformat(),
            "metadata": transcript.metadata
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting transcript: {str(e)}")


@router.delete("/transcript/{video_id}")
async def delete_transcript(
    video_id: str,
    transcription_service: TranscriptionService = Depends(get_transcription_service)
) -> Dict[str, Any]:
    """
    Delete a transcript.
    
    Args:
        video_id: YouTube video ID.
        transcription_service: Transcription service instance.
        
    Returns:
        Deletion status.
    """
    try:
        deleted = await transcription_service.delete_transcript(video_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Transcript not found for video {video_id}")
        
        return {"success": True, "message": f"Transcript for video {video_id} deleted"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting transcript: {str(e)}")


@router.post("/search/{video_id}", response_model=SearchResponse)
async def search_transcript(
    video_id: str,
    request: SearchRequest,
    transcription_service: TranscriptionService = Depends(get_transcription_service)
) -> Dict[str, Any]:
    """
    Search for text within a transcript.
    
    Args:
        video_id: YouTube video ID.
        request: Search request.
        transcription_service: Transcription service instance.
        
    Returns:
        Search results.
    """
    try:
        results = await transcription_service.search_transcript(
            video_id=video_id,
            query=request.query,
            **request.options
        )
        
        return {
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching transcript: {str(e)}")


@router.get("/list")
async def list_transcripts(
    transcription_service: TranscriptionService = Depends(get_transcription_service)
) -> Dict[str, Any]:
    """
    List all available transcripts.
    
    Args:
        transcription_service: Transcription service instance.
        
    Returns:
        List of available transcript video IDs.
    """
    try:
        video_ids = transcription_service.list_available_transcripts()
        
        return {
            "video_ids": video_ids,
            "count": len(video_ids)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing transcripts: {str(e)}")


@router.post("/cancel/{job_id}")
async def cancel_transcription(
    job_id: str,
    transcription_service: TranscriptionService = Depends(get_transcription_service)
) -> Dict[str, Any]:
    """
    Cancel a transcription job.
    
    Args:
        job_id: ID of the transcription job.
        transcription_service: Transcription service instance.
        
    Returns:
        Cancellation status.
    """
    try:
        cancelled = await transcription_service.cancel_transcription(job_id)
        
        if not cancelled:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found or cannot be cancelled")
        
        return {"success": True, "message": f"Job {job_id} cancelled"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling transcription: {str(e)}") 