"""
API routes for the application.
"""
from fastapi import APIRouter

from .prompt_enhancer import router as prompt_enhancer_router
from .youtube_search import router as youtube_search_router
from .transcription import router as transcription_router

# Main router that includes all route modules
api_router = APIRouter()

# Include all route modules
api_router.include_router(prompt_enhancer_router)
api_router.include_router(youtube_search_router)
api_router.include_router(transcription_router)

__all__ = ['api_router'] 