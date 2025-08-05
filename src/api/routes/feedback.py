"""
API routes for handling user feedback.
"""

import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.services.feedback.feedback_service import FeedbackService, init_feedback_database

# Initialize feedback database
init_feedback_database()

# Create router
router = APIRouter(
    prefix="/feedback",
    tags=["feedback"],
    responses={404: {"description": "Not found"}},
)

# Initialize feedback service
feedback_service = FeedbackService(
    storage_path=os.environ.get("FEEDBACK_STORAGE_PATH", "data/feedback"),
    email_config={
        "enabled": os.environ.get("FEEDBACK_EMAIL_ENABLED", "false").lower() == "true",
        "smtp_server": os.environ.get("FEEDBACK_SMTP_SERVER"),
        "smtp_port": int(os.environ.get("FEEDBACK_SMTP_PORT", "587")),
        "use_tls": os.environ.get("FEEDBACK_SMTP_TLS", "true").lower() == "true",
        "username": os.environ.get("FEEDBACK_SMTP_USERNAME"),
        "password": os.environ.get("FEEDBACK_SMTP_PASSWORD"),
        "from_email": os.environ.get("FEEDBACK_FROM_EMAIL", "noreply@youtube-clip-finder.example.com"),
        "to_email": os.environ.get("FEEDBACK_TO_EMAIL", "support@youtube-clip-finder.example.com"),
    }
)


class FeedbackSubmission(BaseModel):
    """Feedback submission model."""
    
    type: str = Field(..., description="Type of feedback (bug, feature, improvement, general)")
    title: str = Field(..., description="Short title/summary")
    description: str = Field(..., description="Detailed description")
    email: Optional[str] = Field(None, description="User's email (optional)")
    severity: Optional[str] = Field(None, description="For bugs (low, medium, high, critical)")
    allow_contact: bool = Field(True, description="Whether user allows follow-up contact")


class FeedbackResponse(BaseModel):
    """Feedback response model."""
    
    id: str = Field(..., description="Unique feedback ID")
    timestamp: str = Field(..., description="Submission timestamp")
    status: str = Field(..., description="Status of the submission")


class FeedbackStatusUpdate(BaseModel):
    """Feedback status update model."""
    
    status: str = Field(..., description="New status (new, in_progress, resolved, closed)")
    notes: Optional[str] = Field(None, description="Optional notes about the status change")


@router.post("/submit", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackSubmission,
    screenshot: Optional[UploadFile] = File(None)
):
    """
    Submit new feedback.
    
    This endpoint allows users to submit feedback, bug reports, or feature requests.
    """
    feedback_data = feedback.dict()
    
    # Process screenshot if provided
    if screenshot:
        # Create screenshots directory if it doesn't exist
        screenshots_dir = os.path.join(feedback_service.storage_path, "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = os.path.splitext(screenshot.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(screenshots_dir, filename)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(await screenshot.read())
        
        feedback_data["screenshot_path"] = file_path
    
    # Submit feedback
    result = feedback_service.submit_feedback(feedback_data)
    
    return result


@router.get("/list", response_model=List[Dict])
async def list_feedback(
    feedback_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    List feedback with optional filtering.
    
    This endpoint is for administrators to view submitted feedback.
    """
    return feedback_service.list_feedback(
        feedback_type=feedback_type,
        status=status,
        limit=limit,
        offset=offset
    )


@router.get("/{feedback_id}", response_model=Dict)
async def get_feedback(feedback_id: str):
    """
    Get specific feedback by ID.
    
    This endpoint retrieves detailed information about a specific feedback item.
    """
    feedback = feedback_service.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return feedback


@router.put("/{feedback_id}/status", response_model=Dict)
async def update_feedback_status(feedback_id: str, update: FeedbackStatusUpdate):
    """
    Update the status of a feedback item.
    
    This endpoint is for administrators to update the status of feedback items.
    """
    success = feedback_service.update_feedback_status(
        feedback_id=feedback_id,
        status=update.status,
        notes=update.notes
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"id": feedback_id, "status": update.status, "updated": True} 