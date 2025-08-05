"""
YouTube Research Video Clip Finder - Main Application
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.api.routes import api_router
from src.api.routes import youtube_search, transcription, prompt_enhancer, clip_detection

# Load environment variables
load_dotenv()

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

# Include routers
app.include_router(youtube_search.router)
app.include_router(transcription.router)
app.include_router(prompt_enhancer.router)
app.include_router(clip_detection.router)

# Import and include download router
try:
    from src.api.routes import download
    app.include_router(download.router)
except ImportError:
    logger.warning("Download router not available")

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