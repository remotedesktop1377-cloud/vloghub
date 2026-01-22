# Vloghub - Comprehensive Project Guide

**Welcome to the Vloghub Project!** This guide provides a complete overview of the codebase, architecture, technologies, and functionality for new team members.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Key Features & Workflows](#key-features--workflows)
7. [API Documentation](#api-documentation)
8. [Database & Storage](#database--storage)
9. [Third-Party Services Integration](#third-party-services-integration)
10. [File-by-File Guide](#file-by-file-guide)
11. [Development Workflow](#development-workflow)
12. [Common Patterns & Conventions](#common-patterns--conventions)

---

## Project Overview

**Vloghub** is an AI-powered video creation platform designed for YouTube creators. It helps users:

1. **Generate Scripts**: Create video scripts from trending topics using AI
2. **Process Videos**: Upload, transcribe, and automatically segment videos into scenes
3. **Edit & Compose**: Combine video clips, images, audio, and effects into final videos
4. **Publish**: Upload videos to YouTube and manage social media accounts

### Core Value Proposition

The platform automates the video creation pipeline:
- **Input**: Script topic, video preferences, and raw footage (optional)
- **Processing**: AI transcription, scene detection, media organization
- **Output**: Professionally edited videos ready for YouTube

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Core backend language |
| **FastAPI** | 0.104.1 | REST API framework |
| **Uvicorn** | 0.24.0 | ASGI server |
| **Gunicorn** | 21.2.0 | Production WSGI server |
| **MoviePy** | Latest | Video editing and processing |
| **Google Generative AI** | Latest | AI transcription and text processing (Gemini) |
| **Rembg** | Latest | Background removal from images |
| **Pillow (PIL)** | Latest | Image processing |
| **NumPy** | Latest | Numerical operations |
| **python-dotenv** | Latest | Environment variable management |
| **Pydantic** | Latest | Data validation |
| **httpx** | Latest | HTTP client |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.7 | React framework with App Router |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 4.9.0 | Type-safe JavaScript |
| **Material-UI (MUI)** | 5.18.0 | Component library |
| **Zustand** | 4.3.0 | State management |
| **Axios** | 1.3.0 | HTTP client |
| **Supabase Client** | 2.57.4 | Authentication & database client |
| **NextAuth.js** | 4.24.13 | Authentication middleware |
| **React Player** | 2.16.1 | Video player component |
| **FFmpeg.wasm** | 0.12.15 | Client-side video processing |
| **Wavesurfer.js** | 6.6.0 | Audio waveform visualization |
| **React Beautiful DnD** | 13.1.1 | Drag and drop functionality |
| **Lucide React** | 0.542.0 | Icon library |
| **React Toastify** | 9.1.0 | Toast notifications |

### Infrastructure & Services

- **Supabase**: Authentication, database (PostgreSQL), storage
- **Google Drive API**: Media storage and retrieval
- **Google Generative AI (Gemini)**: AI transcription, script generation, topic analysis
- **YouTube Data API**: Video publishing and management
- **Gamma API**: Document/presentation generation
- **Envatomarket API**: Stock media (images/videos) search

### Development Tools

- **Docker**: Containerization (see `docker-compose.yml`)
- **Git**: Version control
- **ESLint/TypeScript**: Code quality

---

## Project Structure

```
Vloghub/
├── backend/                    # Python FastAPI backend
│   ├── api/                   # API endpoint handlers
│   │   ├── convert.py         # Video to audio conversion
│   │   ├── transcribe.py      # Audio transcription (Gemini)
│   │   ├── llm.py             # LLM-based scene detection
│   │   ├── cut_video.py       # Video segment cutting
│   │   ├── project_processor.py # Main video composition engine
│   │   ├── compress_video.py  # Video compression
│   │   └── remove_background.py # Background removal
│   ├── services/              # Business logic services
│   │   ├── google_drive_upload_service.py
│   │   └── scene_service.py   # Scene segmentation service
│   ├── utils/                 # Utility functions
│   │   └── helperFunctions.py
│   ├── config/                # Configuration
│   │   └── aiConfig.py        # AI model configuration
│   └── app.py                 # FastAPI application entry point
│
├── frontend/                  # Next.js frontend
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # User dashboard
│   │   ├── script-production/ # Script editing & video composition
│   │   ├── trending-topics/   # Trending topics discovery
│   │   ├── social-media/      # Social media management
│   │   └── api/               # Next.js API routes (proxies to backend)
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── Dashboard/     # Dashboard components
│   │   │   ├── videoEffects/  # Video editor components
│   │   │   ├── TrendingTopicsComponent/
│   │   │   └── ui/            # Reusable UI components
│   │   ├── services/          # Frontend service layer
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript type definitions
│   │   ├── config/            # Configuration files
│   │   └── dialogs/           # Dialog components
│   └── public/                # Static assets
│
├── exports/                   # Temporary file storage (backend)
├── docker-compose.yml         # Docker Compose configuration
├── requirements.txt           # Python dependencies
└── README.md                  # Project README
```

---

## Backend Architecture

### Core Application (`backend/app.py`)

The main FastAPI application serves as the entry point for all backend operations.

**Key Responsibilities:**
- CORS configuration
- API route registration
- File upload handling
- Error handling and logging
- Temporary file management

**Main Endpoints:**
- `POST /api/process` - Process video: transcribe, segment, return scenes
- `POST /api/process-project-from-json` - Compose final video from project JSON
- `POST /api/compress-video` - Compress video files
- `GET /health` - Health check

### Video Processing Pipeline

The backend implements a multi-stage video processing pipeline:

#### 1. **Conversion** (`backend/api/convert.py`)
- Converts uploaded video to audio (WAV format)
- Extracts audio track for transcription
- Returns video duration

#### 2. **Transcription** (`backend/api/transcribe.py`)
- Uses Google Gemini AI for audio transcription
- Uploads audio file to Gemini API
- Returns full transcription text
- Saves transcription JSON for later use

#### 3. **Scene Detection** (`backend/api/llm.py` + `backend/services/scene_service.py`)
- Uses Gemini AI to semantically segment transcription
- Identifies natural scene boundaries
- Calculates timing for each scene
- Returns array of scene edits with start/end times

#### 4. **Video Cutting** (`backend/api/cut_video.py`)
- Cuts video into segments based on scene timings
- Saves individual scene clips
- Returns clip paths and scene metadata

#### 5. **Video Composition** (`backend/api/project_processor.py`)
- **The core video editing engine**
- Combines multiple scenes, images, audio, and effects
- Uses MoviePy for video composition
- Supports:
  - Video/image layering
  - Transitions (fade, crossfade, slide, etc.)
  - Background music
  - Logo overlays
  - Text overlays
  - Chroma key (green screen) support
  - Background removal
  - Various video effects (blur, color correction, etc.)

**Key Functions in `project_processor.py`:**
- `process_project_json()` - Main entry point
- `download_media()` - Downloads media from URLs or Google Drive
- `apply_transition()` - Applies transitions between scenes
- `create_composite_scene()` - Combines multiple layers into one scene
- `remove_background_from_image()` - Background removal

### Configuration

**`backend/config/aiConfig.py`**
- Configures Gemini model versions (Flash vs Pro)
- Environment variable management
- Model selection logic

### Utility Functions

**`backend/utils/helperFunctions.py`**
- Helper functions for video processing
- Scene count determination
- Word count calculations
- Fallback scene segmentation

### Services

**`backend/services/google_drive_upload_service.py`**
- Uploads final videos to Google Drive
- Manages folder structure
- Handles authentication

**`backend/services/scene_service.py`**
- Semantic scene segmentation using Gemini
- Natural language processing for scene detection

---

## Frontend Architecture

### Next.js App Router Structure

The frontend uses Next.js 15 with the App Router pattern.

**Key Pages:**
- `/` - Landing page
- `/dashboard` - User dashboard (project list)
- `/script-production` - Main video editor interface
- `/trending-topics` - Topic discovery and script generation
- `/social-media` - Social media account management

### State Management

**Zustand Stores:**
- Global state management for projects, scenes, and UI state
- Lightweight alternative to Redux

**React Context:**
- `AuthContext` - Authentication state
- `EditorContext` - Video editor state
- `ThemeContext` - Theme preferences

### Key Components

#### 1. **Script Production** (`src/components/videoEffects/`)
The main video editor interface:

- `MediaPlayer.tsx` - Video preview player
- `SegmentTimeline.tsx` - Timeline for video segments
- `SegmentCard.tsx` - Individual segment cards
- `EffectsPanel.tsx` - Video effects configuration
- `RenderPanel.tsx` - Final video rendering controls
- `FileUploadZone.tsx` - Media upload interface
- `ScenePreview.tsx` - Scene preview component

#### 2. **Trending Topics** (`src/components/TrendingTopicsComponent/`)
Topic discovery and script generation:

- `TrendingTopicsPage.tsx` - Main page component
- `TrendingTopicsList.tsx` - List of trending topics
- `TopicDetailsSection.tsx` - Topic details and script generation
- `WordCloudChart.tsx` - Word cloud visualization
- `ImageSearch.tsx` - Image search integration

#### 3. **Dashboard** (`src/components/Dashboard/`)
User project management:

- `DashboardPageClient.tsx` - Main dashboard
- Project list and management
- User statistics

#### 4. **Authentication** (`src/components/auth/`)
- `AuthModal.tsx` - Login/signup modal
- `ProfileDropdown.tsx` - User profile dropdown
- `AuthenticatedButton.tsx` - Auth state wrapper

### Services Layer (`src/services/`)

Frontend services handle API communication:

- `projectService.ts` - Project CRUD operations
- `videoRenderService.ts` - Video rendering requests
- `googleDriveService.ts` - Google Drive integration
- `profileService.ts` - User profile management
- `dashboardService.ts` - Dashboard data
- `gammaService.ts` - Gamma API integration
- `thumbnailCreationService.ts` - Thumbnail generation

### API Routes (`app/api/`)

Next.js API routes serve as proxies to the Python backend:

- `/api/generate-script` - Script generation
- `/api/generate-images` - AI image generation
- `/api/google-image-search` - Google Image Search
- `/api/google-drive-*` - Google Drive operations
- `/api/youtube-*` - YouTube operations
- `/api/gamma-*` - Gamma API operations
- `/api/auth/[...nextauth]` - NextAuth.js authentication

### Utilities (`src/utils/`)

- `helperFunctions.ts` - **Large utility file** with project management, Google Drive operations, scene data manipulation
- `apiService.ts` - HTTP client wrapper
- `geminiService.ts` - Gemini AI integration
- `supabase.ts` - Supabase client
- `videoEditorUtils.ts` - Video editor utilities

### Types (`src/types/`)

TypeScript type definitions:

- `scriptData.ts` - Script and project data structures
- `sceneData.ts` - Scene data structures
- `videoEditor.ts` - Video editor data structures
- `database.ts` - Supabase database types
- `TrendingTopics.ts` - Trending topics types

---

## Key Features & Workflows

### 1. Script Generation Workflow

1. User navigates to `/trending-topics`
2. Selects a topic category and region
3. Views trending topics (fetched via Gemini API)
4. Selects a topic
5. Generates script using AI (Gemini)
6. Edits script if needed
7. Proceeds to video composition

### 2. Video Processing Workflow

1. User uploads video file
2. **Backend** (`/api/process`):
   - Converts video to audio
   - Transcribes audio (Gemini)
   - Detects scenes using LLM
   - Cuts video into segments
3. Returns scene data to frontend
4. User can edit scenes, add media, apply effects
5. User composes final video
6. **Backend** (`/api/process-project-from-json`):
   - Downloads all media assets
   - Composes scenes with effects
   - Renders final video
   - Uploads to Google Drive
7. User can publish to YouTube

### 3. Video Composition Workflow

1. User configures project settings:
   - Background type (video/image/color)
   - Background music
   - Transitions
   - Logo overlay
   - Preview image
2. Adds scenes with:
   - Video clips
   - Images
   - Narration audio
   - Text overlays
3. Adjusts timing and effects
4. Renders final video
5. Downloads or publishes

### 4. Social Media Integration

- Connect YouTube account (OAuth)
- Publish videos directly to YouTube
- Manage social media accounts (stored in Supabase)
- View publishing statistics

---

## API Documentation

### Backend API (FastAPI)

**Base URL**: `http://localhost:10000` (development)

#### POST `/api/process`

Processes uploaded video file.

**Request:**
- `file`: Video file (multipart/form-data)
- `jobId`: Job identifier (form data)

**Response:**
```json
{
  "jobId": "string",
  "text": "transcription text",
  "scenes": [
    {
      "id": "string",
      "narration": "string",
      "startTime": 0.0,
      "endTime": 10.0,
      "durationInSeconds": 10.0
    }
  ]
}
```

#### POST `/api/process-project-from-json`

Composes final video from project JSON.

**Request:**
```json
{
  "project": {
    "jobId": "string",
    "scenesData": [...],
    "projectSettings": {...}
  }
}
```

**Response:**
```json
{
  "jobId": "string",
  "finalVideo": "path/to/video.mp4",
  "scenes": [...],
  "driveUpload": {...},
  "videoThumbnailUrl": "url"
}
```

#### POST `/api/compress-video`

Compresses video file.

**Request:**
- `file`: Video file
- `jobId`: Job identifier
- `targetSizeMb`: Target size in MB

**Response:**
- File stream (video/mp4)

#### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

### Frontend API Routes (Next.js)

All frontend API routes are in `frontend/app/api/` and proxy to external services or the Python backend.

**Key Routes:**
- `/api/generate-script` - Generate script from topic
- `/api/generate-images` - Generate images using AI
- `/api/google-drive-*` - Google Drive operations
- `/api/youtube-publish` - Publish video to YouTube
- `/api/youtube-oauth/*` - YouTube OAuth flow

---

## Database & Storage

### Supabase (PostgreSQL)

**Tables:**
- `profiles` - User profiles
- `projects` - User projects
- `social_accounts` - Connected social media accounts
- (See `frontend/supabase/schema.sql` for full schema)

**Authentication:**
- Supabase Auth for user authentication
- NextAuth.js as middleware
- Session management

### Google Drive

**Storage Structure:**
- Project folders
- Scene folders (within projects)
- Media library
- Output videos folder

**Integration:**
- OAuth2 authentication
- File upload/download
- Folder management
- Media search and retrieval

---

## Third-Party Services Integration

### 1. Google Generative AI (Gemini)

**Used For:**
- Audio transcription
- Script generation
- Scene segmentation
- Topic analysis
- Keyword highlighting

**Configuration:**
- API key in environment variables
- Models: `gemini-2.5-flash`, `gemini-2.5-pro`
- Configured in `backend/config/aiConfig.py`

### 2. Google Drive API

**Used For:**
- Media storage
- Project file management
- Video uploads
- Media library

**Authentication:**
- Service account JSON (stored in `config/`)
- OAuth2 for user access

### 3. YouTube Data API

**Used For:**
- Video publishing
- Channel management
- Video metadata

**Authentication:**
- OAuth2 flow (stored in `frontend/app/api/youtube-oauth/`)

### 4. Gamma API

**Used For:**
- Document/presentation generation
- Export scripts as presentations

### 5. Envatomarket API

**Used For:**
- Stock image/video search
- Media asset discovery

---

## File-by-File Guide

### Backend Files

#### `backend/app.py`
- **Purpose**: FastAPI application entry point
- **Key Functions**:
  - `process_video()` - Main video processing endpoint
  - `process_project_from_json()` - Video composition endpoint
  - `compress_video_endpoint()` - Video compression
  - `upload_video_to_drive()` - Google Drive upload helper
- **Dependencies**: All API modules, FastAPI, CORS middleware

#### `backend/api/transcribe.py`
- **Purpose**: Audio transcription using Gemini
- **Key Function**: `transcribe_audio()` - Transcribes audio file
- **Process**: Upload audio → Gemini API → Get transcription → Save JSON

#### `backend/api/llm.py`
- **Purpose**: Scene detection from transcription
- **Key Function**: `process_transcription_with_llm()` - Segments transcription into scenes
- **Process**: Transcription → Gemini semantic analysis → Scene segments

#### `backend/api/project_processor.py`
- **Purpose**: Video composition engine (most complex file)
- **Key Functions**:
  - `process_project_json()` - Main composition function
  - `download_media()` - Downloads media assets
  - `apply_transition()` - Applies transitions
  - `create_composite_scene()` - Creates multi-layer scenes
- **Uses**: MoviePy, Rembg, PIL, NumPy

#### `backend/api/cut_video.py`
- **Purpose**: Cuts video into segments
- **Key Function**: `cut_video_segments()` - Cuts video based on timings

#### `backend/api/convert.py`
- **Purpose**: Video to audio conversion
- **Key Function**: `convert_video_to_audio()` - Extracts audio track

#### `backend/api/compress_video.py`
- **Purpose**: Video compression
- **Key Function**: `compress_video()` - Reduces video file size

#### `backend/services/scene_service.py`
- **Purpose**: Semantic scene segmentation
- **Key Function**: `request_semantic_scenes()` - Uses Gemini for scene detection

#### `backend/services/google_drive_upload_service.py`
- **Purpose**: Google Drive uploads
- **Key Function**: `upload_media_to_google_drive()` - Uploads files to Drive

### Frontend Files

#### `frontend/src/utils/helperFunctions.ts`
- **Purpose**: Large utility file with project management functions
- **Key Functions**:
  - Project saving/loading
  - Google Drive operations
  - Scene data manipulation
  - Secure storage
- **Size**: 1125 lines (complex file)

#### `frontend/app/script-production/ScriptProductionClient.tsx`
- **Purpose**: Main video editor page
- **Key Features**: Timeline, media player, effects panel, render controls

#### `frontend/src/components/videoEffects/`
- **Purpose**: Video editor components
- **Key Components**: MediaPlayer, SegmentTimeline, EffectsPanel, RenderPanel

#### `frontend/src/context/AuthContext.tsx`
- **Purpose**: Authentication state management
- **Features**: Sign in/up, session management, Supabase integration

#### `frontend/src/services/projectService.ts`
- **Purpose**: Project CRUD operations
- **Features**: Create, read, update, delete projects

#### `frontend/app/api/generate-script/route.ts`
- **Purpose**: Script generation API route
- **Process**: Receives topic → Calls Gemini → Returns script

---

## Development Workflow

### Local Setup

#### Backend

1. **Prerequisites**:
   - Python 3.11+
   - FFmpeg installed
   - Virtual environment

2. **Installation**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r ../requirements.txt
   ```

3. **Environment Variables**:
   Create `.env` file with:
   - `GEMINI_API_KEY`
   - `GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY` (path to JSON)
   - `PORT=10000`

4. **Run**:
   ```bash
   uvicorn backend.app:app --reload --port 10000
   ```

#### Frontend

1. **Prerequisites**:
   - Node.js 18+
   - npm or yarn

2. **Installation**:
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Variables**:
   Create `.env.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_PYTHON_BACKEND_URL=http://localhost:10000`
   - Various API keys

4. **Run**:
   ```bash
   npm run dev
   ```

### Docker Setup

See `docker-compose.yml` for full Docker configuration.

**Services:**
- PostgreSQL database
- Redis cache
- Backend API
- Frontend (production build)

### Testing

- Backend: pytest (configured in `pytest.ini`)
- Frontend: Jest + React Testing Library

---

## Common Patterns & Conventions

### Backend Patterns

1. **Error Handling**:
   - Try-except blocks with logging
   - HTTPException for API errors
   - Graceful degradation

2. **File Management**:
   - Temporary files in `exports/temp/`
   - Final outputs in `exports/`
   - Cleanup after processing

3. **API Responses**:
   - JSON format
   - Consistent error structure
   - Job IDs for async operations

### Frontend Patterns

1. **Component Structure**:
   - Functional components with hooks
   - TypeScript for type safety
   - CSS modules for styling

2. **State Management**:
   - Zustand for global state
   - React Context for shared state
   - Local state with useState

3. **API Calls**:
   - Axios for HTTP requests
   - Service layer abstraction
   - Error handling with toast notifications

4. **File Organization**:
   - Components grouped by feature
   - Services in `src/services/`
   - Types in `src/types/`
   - Utils in `src/utils/`

### Code Style

- **Python**: PEP 8
- **TypeScript**: ESLint + Prettier
- **Naming**: camelCase (TypeScript), snake_case (Python)

---

## Important Notes

### Performance Considerations

1. **Video Processing**: CPU-intensive; consider background workers
2. **File Storage**: Large video files; cleanup is important
3. **API Rate Limits**: Google APIs have rate limits
4. **Memory Usage**: MoviePy can be memory-intensive

### Security

1. **API Keys**: Stored in environment variables
2. **Authentication**: Supabase Auth + NextAuth.js
3. **File Uploads**: Validate file types and sizes
4. **CORS**: Configured for specific origins in production

### Known Limitations

1. Video processing is synchronous (can be slow for long videos)
2. File cleanup may need manual intervention sometimes
3. Google Drive API rate limits apply
4. Large video files may timeout

---

## Getting Help

1. **Code Documentation**: Check docstrings and comments
2. **API Documentation**: FastAPI docs at `/docs` (when backend is running)
3. **Type Definitions**: Check `src/types/` for data structures
4. **Error Logs**: Check browser console and backend logs

---

## Next Steps for New Developers

1. **Set up local environment** (see Development Workflow)
2. **Explore the codebase** using this guide
3. **Run the application** locally
4. **Create a test project** to understand the workflow
5. **Read key files** mentioned in this guide
6. **Check existing issues/PRs** for context

---

## Conclusion

This guide provides a comprehensive overview of the Vloghub project. The codebase is actively developed, so structures may evolve. Always refer to the latest code and documentation.

**Happy coding! 🚀**

