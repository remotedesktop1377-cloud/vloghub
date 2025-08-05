"""
API routes for clip detection service.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import logging

from src.services.clip_detection import ClipDetectionService
from src.services.clip_detection.models import (
    ClipDetectionRequest, ClipDetectionResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/clip-detection", tags=["clip-detection"])

# Initialize clip detection service
clip_service = ClipDetectionService()


@router.post("/detect", response_model=ClipDetectionResponse)
async def detect_clips(request: ClipDetectionRequest) -> ClipDetectionResponse:
    """
    Detect and analyze clips in a video.
    
    Args:
        request: Clip detection request parameters.
        
    Returns:
        Clip detection response with analyzed clips.
    """
    try:
        logger.info(f"Starting clip detection for video {request.video_id}")
        response = await clip_service.detect_clips(request)
        logger.info(f"Clip detection completed for video {request.video_id}, found {len(response.clips)} clips")
        return response
        
    except Exception as e:
        logger.error(f"Error in clip detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for clip detection service.
    
    Returns:
        Service health status.
    """
    try:
        # Check if AI components are available
        has_sentiment = clip_service.sentiment_analyzer is not None
        has_entities = clip_service.entity_recognizer is not None
        has_segmentation = clip_service.segment_detector is not None
        
        return {
            "status": "healthy",
            "components": {
                "sentiment_analyzer": has_sentiment,
                "entity_recognizer": has_entities,
                "segment_detector": has_segmentation,
                "transcription_service": True
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Service unhealthy")


@router.post("/analyze-segment")
async def analyze_segment(
    video_id: str,
    start_time: float,
    end_time: float,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Analyze a specific segment of a video.
    
    Args:
        video_id: YouTube video ID.
        start_time: Start time in seconds.
        end_time: End time in seconds.
        background_tasks: Background task runner.
        
    Returns:
        Analysis result for the segment.
    """
    try:
        # Create a custom request for this segment
        request = ClipDetectionRequest(
            video_id=video_id,
            min_duration=end_time - start_time,
            max_duration=end_time - start_time,
            max_clips=1
        )
        
        response = await clip_service.detect_clips(request)
        
        # Filter to the specific segment
        matching_clips = [
            clip for clip in response.clips
            if (abs(clip.start_time - start_time) < 5.0 and 
                abs(clip.end_time - end_time) < 5.0)
        ]
        
        if matching_clips:
            clip = matching_clips[0]
            return {
                "segment_analysis": {
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration": end_time - start_time,
                    "metadata": clip.metadata.dict(),
                    "ranking": clip.ranking.dict(),
                    "sentiment": clip.sentiment_analysis.dict() if clip.sentiment_analysis else None,
                    "entities": clip.entity_analysis.dict() if clip.entity_analysis else None,
                    "confidence": clip.analysis_confidence
                }
            }
        else:
            return {
                "segment_analysis": {
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration": end_time - start_time,
                    "error": "No analysis available for this segment"
                }
            }
            
    except Exception as e:
        logger.error(f"Error analyzing segment: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 