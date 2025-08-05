# System Architecture

This document outlines the system architecture of the YouTube Research Video Clip Finder application.

## Overview

The YouTube Research Video Clip Finder is built using a modern client-server architecture with a React frontend and Python backend. The system is designed to be modular, scalable, and maintainable.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │◄────►│  Python Backend │◄────►│  External APIs  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │                 │
                         │   PostgreSQL    │
                         │   Database      │
                         │                 │
                         └─────────────────┘
```

## Components

### Frontend

The frontend is built using React with the following key components:

- **App Container**: Main application wrapper and routing
- **Dashboard**: Project management and overview
- **Search Interface**: YouTube search with filters and results display
- **Video Player**: Custom video player with clip selection capabilities
- **Timeline Editor**: Visual interface for clip trimming and selection
- **Metadata Editor**: Form for adding and editing clip metadata
- **Transcript Viewer**: Display and search video transcripts
- **Download Manager**: Interface for managing clip downloads

### Backend

The backend is built using Python with the following key components:

- **API Layer**: FastAPI endpoints for frontend communication
- **YouTube Service**: Integration with YouTube Data API
- **Transcription Service**: Video transcription using Whisper or YouTube captions
- **Clip Detection**: AI-powered detection of relevant video segments
- **Metadata Service**: Management of clip metadata and tags
- **Download Service**: Video download and processing
- **Database Layer**: Data persistence and retrieval

### Database

PostgreSQL is used for data storage with the following key tables:

- **Users**: User accounts and authentication
- **Projects**: Research projects and settings
- **Videos**: Information about source videos
- **Clips**: Extracted video segments
- **Metadata**: Tags, descriptions, and other clip metadata
- **Transcripts**: Video transcriptions and timestamps

## Data Flow

### Search Flow

1. User enters search query in frontend
2. Query is enhanced by the Prompt Enhancer service
3. Enhanced query is sent to YouTube API
4. Results are returned to frontend for display

### Clip Extraction Flow

1. User selects a video from search results
2. Video is loaded in the player with transcript
3. User sets in/out points or uses AI-suggested segments
4. Clip boundaries are saved to the database
5. When ready, clip is processed for download

### Metadata Flow

1. User selects a clip in the timeline
2. Metadata form is populated with existing data
3. User edits or adds metadata
4. AI services suggest additional tags and metadata
5. Updated metadata is saved to the database

## Technical Stack

### Frontend
- React 18+
- Redux for state management
- Tailwind CSS for styling
- Video.js for video playback
- D3.js for timeline visualization

### Backend
- Python 3.9+
- FastAPI for API endpoints
- SQLAlchemy for ORM
- Pydantic for data validation
- OpenAI API for AI features
- Whisper for transcription

### Infrastructure
- Docker for containerization
- Kubernetes for orchestration
- AWS S3 for storage
- PostgreSQL for database
- Redis for caching

## Security

- JWT for authentication
- HTTPS for all communications
- API key encryption
- Rate limiting
- Input validation
- CORS protection

## Scalability

The application is designed to scale horizontally:

- Stateless API servers can be replicated
- Database read replicas for high traffic
- Caching layer for frequently accessed data
- Background workers for processing tasks
- CDN for static assets and video delivery

## Monitoring and Logging

- Prometheus for metrics collection
- Grafana for visualization
- ELK stack for log aggregation
- Error tracking with Sentry
- Health check endpoints

## Future Architecture Considerations

- Microservices architecture for better scaling
- GraphQL API for more efficient data fetching
- WebSocket for real-time updates
- Edge computing for faster video processing
- Machine learning pipeline for improved clip detection 