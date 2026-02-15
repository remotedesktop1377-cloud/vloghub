# Vloghub - Technical Documentation

**Version:** 1.0.0  
**Last Updated:** 2025  
**Platform:** Next.js AI-Powered Video Creation Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Documentation](#api-documentation)
8. [Video Generation Workflow](#video-generation-workflow)
9. [Development Setup](#development-setup)
10. [Environment Configuration](#environment-configuration)
11. [Deployment Guide](#deployment-guide)
12. [Key Features & Workflows](#key-features--workflows)
13. [AI Integration](#ai-integration)
14. [Storage & Media Management](#storage--media-management)
15. [Troubleshooting](#troubleshooting)

---

## Executive Summary

Vloghub is an AI-powered video creation platform that enables content creators to generate professional videos using AI-driven script generation, scene planning, media asset management, and automated video rendering. The platform integrates with YouTube, Facebook, and Google Drive for content publishing and media storage.

> **🔑 Getting Started**: New developers should first review the [CREDENTIALS_SETUP_GUIDE.md](./CREDENTIALS_SETUP_GUIDE.md) to set up all required API keys and credentials before starting development.

### Core Capabilities

- **AI Script Generation**: Generate video scripts using Gemini AI based on trending topics
- **Scene Planning**: Automatically plan video scenes with narration and timing
- **Media Asset Management**: Search and manage images/videos from Google Drive and Envato
- **Video Rendering**: Render videos using Remotion and AWS Lambda
- **Social Media Publishing**: Publish directly to YouTube and Facebook
- **Transcription & Audio Processing**: Extract and process audio from video files
- **Thumbnail Generation**: AI-powered thumbnail creation using Google Imagen

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Next.js    │  │   Remotion   │  │   React UI    │          │
│  │   Frontend   │  │   Player     │  │  Components   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Script     │  │   Media      │  │   Video      │          │
│  │   Generation │  │   Search     │  │   Rendering   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   OAuth      │  │   Drive      │  │   Lambda      │          │
│  │   Handlers   │  │   Integration│  │   Services   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Supabase   │      │  Google APIs │      │   AWS Lambda │
│  PostgreSQL  │      │  (Drive,     │      │   (Remotion  │
│              │      │   Gemini,    │      │    Render)   │
│  - Profiles  │      │   Imagen)    │      │              │
│  - Projects  │      │              │      │  - Video     │
│  - Scenes    │      │  - OAuth     │      │    Rendering │
│  - Scripts  │      │  - Storage    │      │  - Clip      │
│              │      │  - AI Models │      │    Cutting   │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Component Architecture

#### Frontend Architecture

```
Next.js App Router Structure:
├── app/
│   ├── api/                    # API Route Handlers
│   │   ├── auth/               # Authentication endpoints
│   │   ├── generate-script/    # Script generation
│   │   ├── lambda/             # AWS Lambda integration
│   │   ├── youtube-oauth/       # YouTube OAuth flow
│   │   └── ...
│   ├── dashboard/              # Dashboard page
│   ├── projects/               # Project management
│   └── trending-topics/        # Trending topics page
│
└── src/
    ├── components/             # React components
    │   ├── auth/               # Authentication UI
    │   ├── editor/             # Video editor components
    │   ├── scriptProductionComponents/  # Script production
    │   └── TrendingTopicsComponent/     # Trending topics
    ├── services/               # API service layer
    ├── utils/                  # Utility functions
    ├── config/                 # Configuration files
    ├── types/                  # TypeScript types
    └── store/                  # State management
```

#### Backend Architecture (API Routes)

All backend logic is implemented as Next.js API routes:

- **Route Handlers**: Located in `app/api/`
- **Service Layer**: Business logic in `src/services/`
- **Database Access**: Direct Supabase client calls
- **External APIs**: Google APIs, AWS Lambda, OpenAI

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.7 | React framework with App Router |
| React | 18.2.0 | UI library |
| TypeScript | 5.1.6 | Type safety |
| Tailwind CSS | 3.3.3 | Styling |
| Remotion | 4.0.421 | Video composition & rendering |
| Redux Toolkit | 2.7.0 | State management |
| Zustand | 4.3.0 | Lightweight state management |
| NextAuth | 4.24.13 | Authentication |
| Material-UI | 5.18.0 | UI components |

### Backend & Services

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Serverless API endpoints |
| Supabase | PostgreSQL database & auth |
| AWS Lambda | Video rendering (Remotion) |
| AWS S3 | Video storage |
| Google Drive API | Media asset storage |
| Google Gemini AI | Script generation, prompt enhancement |
| Google Imagen | Thumbnail generation |
| OpenAI | AI services (optional) |

### Development Tools

| Tool | Purpose |
|------|---------|
| FFmpeg | Video/audio processing |
| Vercel | Deployment platform |
| TypeScript | Type checking |
| ESLint | Code linting |

---

## Project Structure

### Directory Tree

```
vloghub/
├── frontend/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API route handlers
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/   # NextAuth configuration
│   │   │   ├── generate-script/      # Script generation API
│   │   │   ├── generate-images/      # Image generation API
│   │   │   ├── enhance-title-for-thumbnail/  # Thumbnail enhancement
│   │   │   ├── lambda/               # AWS Lambda integration
│   │   │   │   ├── render/           # Video rendering
│   │   │   │   ├── deploy-function/  # Lambda function deployment
│   │   │   │   └── deploy-site/      # Remotion site deployment
│   │   │   ├── youtube-oauth/        # YouTube OAuth flow
│   │   │   ├── facebook-oauth/        # Facebook OAuth flow
│   │   │   ├── youtube-publish/       # YouTube publishing
│   │   │   ├── facebook-publish/      # Facebook publishing
│   │   │   ├── google-drive-*/        # Google Drive operations
│   │   │   ├── transcribe-audio/      # Audio transcription
│   │   │   ├── plan-scenes/          # Scene planning
│   │   │   ├── cut-clips/            # Video clip cutting
│   │   │   └── ...
│   │   ├── dashboard/                # Dashboard page
│   │   ├── projects/                 # Project pages
│   │   │   └── [id]/                 # Individual project
│   │   ├── script-production/        # Script production page
│   │   ├── trending-topics/          # Trending topics page
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   │
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── auth/                 # Authentication components
│   │   │   ├── Dashboard/            # Dashboard components
│   │   │   ├── editor/               # Video editor
│   │   │   │   ├── AssetsPanel/     # Asset management panel
│   │   │   │   ├── player/           # Video player
│   │   │   │   ├── PropertiesSection/  # Properties editor
│   │   │   │   ├── render/           # Rendering controls
│   │   │   │   └── timeline/         # Timeline editor
│   │   │   ├── scriptProductionComponents/  # Script production
│   │   │   ├── TrendingTopicsComponent/     # Trending topics UI
│   │   │   ├── SocialMedia/          # Social media integration
│   │   │   └── ui/                   # Reusable UI components
│   │   │
│   │   ├── services/                 # API service layer
│   │   │   ├── projectService.ts     # Project operations
│   │   │   ├── lambdaService.ts      # AWS Lambda operations
│   │   │   ├── googleDriveService.ts # Google Drive operations
│   │   │   ├── gammaService.ts       # Gamma API integration
│   │   │   ├── processService.ts     # Video processing
│   │   │   └── ...
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── helperFunctions.ts    # General helpers
│   │   │   ├── supabase.ts           # Supabase client
│   │   │   ├── geminiService.ts      # Gemini AI client
│   │   │   └── ...
│   │   │
│   │   ├── config/                   # Configuration
│   │   │   ├── apiEndpoints.ts       # API endpoint definitions
│   │   │   ├── DbTables.ts           # Database table names
│   │   │   └── ...
│   │   │
│   │   ├── types/                    # TypeScript type definitions
│   │   ├── context/                  # React context providers
│   │   │   └── AuthContext.tsx       # Authentication context
│   │   ├── store/                    # State management
│   │   ├── hooks/                    # Custom React hooks
│   │   └── styles/                   # Global styles
│   │
│   ├── lambda-functions/             # AWS Lambda functions
│   │   └── ffmpeg-clip-cutter/       # FFmpeg-based clip cutting
│   │
│   ├── supabase/                     # Database migrations
│   │   ├── schema.sql                # Main database schema
│   │   └── *.sql                     # Migration scripts
│   │
│   ├── public/                       # Static assets
│   │   ├── images/                   # Image assets
│   │   └── fonts/                    # Font files
│   │
│   ├── next.config.js                 # Next.js configuration
│   ├── remotion.config.ts             # Remotion configuration
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── package.json                   # Dependencies
│   └── vercel.json                    # Vercel deployment config
│
├── exports/                           # Generated video exports
└── README.md                          # Project README
```

### Key File Patterns

#### API Routes Pattern

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Process request
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    );
  }
}
```

#### Service Layer Pattern

```typescript
// src/services/exampleService.ts
import { HttpService } from './httpService';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const ExampleService = {
  async performOperation(params: ExampleParams): Promise<ExampleResponse> {
    return HttpService.post<ExampleResponse, ExampleParams>(
      API_ENDPOINTS.EXAMPLE_ENDPOINT,
      params
    );
  },
};
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│   profiles   │
│─────────────│
│ id (PK)      │
│ email        │
│ full_name    │
│ avatar_url   │
│ preferences  │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│  video_projects     │
│────────────────────│
│ id (PK)             │
│ user_id (FK)        │
│ job_name (UNIQUE)   │
│ title               │
│ topic               │
│ video_effects       │
└──────┬──────────────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│  project_scenes     │
│────────────────────│
│ id (PK)             │
│ project_id (FK)     │
│ scene_key           │
│ narration           │
│ duration_seconds    │
│ assets (JSONB)      │
│ scene_settings      │
└─────────────────────┘

┌─────────────┐
│ scripts_    │
│ approved    │
│─────────────│
│ id (PK)     │
│ user_id     │
│ title       │
│ script      │
│ status      │
└─────────────┘
```

### Core Tables

#### `profiles`

User profile information and preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| email | TEXT | User email |
| full_name | TEXT | User's full name |
| avatar_url | TEXT | Profile picture URL |
| preferences | JSONB | User preferences (theme, notifications, etc.) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `video_projects`

Main project table storing video project metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| job_name | TEXT | Unique job identifier |
| topic | TEXT | Project topic |
| title | TEXT | Project title |
| description | TEXT | Project description |
| duration | INTEGER | Video duration in seconds |
| resolution | TEXT | Video resolution (e.g., "1920x1080") |
| region | TEXT | Target region |
| language | TEXT | Primary language |
| video_effects | JSONB | Video effects configuration |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `project_scenes`

Individual scenes within a video project.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to video_projects |
| scene_key | TEXT | Scene identifier (e.g., "scene-1") |
| narration | TEXT | Scene narration text |
| duration_seconds | INTEGER | Scene duration |
| words | INTEGER | Word count |
| start_time | INTEGER | Start time in seconds |
| end_time | INTEGER | End time in seconds |
| highlighted_keywords | TEXT[] | Array of highlighted keywords |
| assets | JSONB | Scene media assets |
| scene_settings | JSONB | Scene-specific settings |
| position | INTEGER | Scene order |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `scripts_approved`

Approved scripts ready for video generation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| title | TEXT | Script title |
| topic | TEXT | Script topic |
| script | TEXT | Full script text |
| hook | TEXT | Opening hook |
| main_content | TEXT | Main content section |
| conclusion | TEXT | Conclusion section |
| call_to_action | TEXT | CTA text |
| status | TEXT | Script status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `trending_topics`

Trending topics for content inspiration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| topic | TEXT | Topic name |
| category | TEXT | Topic category |
| description | TEXT | Topic description |
| value | INTEGER | Engagement value |
| location | TEXT | Geographic location |
| search_volume | INTEGER | Search volume metric |
| related_keywords | TEXT[] | Related keywords |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Row Level Security (RLS)

All tables have Row Level Security enabled:

- **Profiles**: Users can only access their own profile
- **Video Projects**: Users can only access their own projects
- **Project Scenes**: Users can only access scenes from their projects
- **Scripts Approved**: Users can only access their own scripts
- **Trending Topics**: Public read access, authenticated write access

---

## Authentication & Authorization

### Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Sign In/Sign Up
     ▼
┌─────────────────┐
│  NextAuth       │
│  (Google OAuth) │
└────┬────────────┘
     │
     │ 2. OAuth Callback
     ▼
┌─────────────────┐
│  Supabase Auth  │
│  (User Creation)│
└────┬────────────┘
     │
     │ 3. Profile Creation
     ▼
┌─────────────────┐
│  profiles table │
│  (Auto-created) │
└─────────────────┘
```

### Implementation Details

#### NextAuth Configuration

**File:** `app/api/auth/[...nextauth]/route.ts`

- **Provider**: Google OAuth
- **Session Strategy**: JWT
- **User ID Generation**: UUID from email hash

#### Supabase Integration

**File:** `src/context/AuthContext.tsx`

- Wraps NextAuth session with Supabase client
- Ensures profile exists in Supabase
- Manages authentication state

#### OAuth Flow for Social Media

**YouTube OAuth:**
1. User initiates OAuth via `/api/youtube-oauth/initiate`
2. Redirects to Google OAuth consent screen
3. Callback handled at `/api/youtube-oauth/callback`
4. Tokens stored in `social_accounts` table

**Facebook OAuth:**
1. User initiates OAuth via `/api/facebook-oauth/initiate`
2. Redirects to Facebook OAuth consent screen
3. Callback handled at `/api/facebook-oauth/callback`
4. Tokens stored in `social_accounts` table

### Authorization Patterns

#### API Route Authorization

```typescript
// Example: Protected API route
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Access user ID: session.user.id
  // Process request...
}
```

#### Database Authorization

RLS policies automatically enforce user-level access:

```sql
-- Example: Users can only view their own projects
CREATE POLICY "Users can view own projects" 
ON public.video_projects
FOR SELECT 
USING (auth.uid() = user_id);
```

---

## API Documentation

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### Authentication

Most endpoints require authentication via NextAuth session cookie.

### Endpoint Categories

#### 1. Script Generation

##### `POST /api/generate-script`

Generate a video script using AI.

**Request Body:**
```json
{
  "topic": "Artificial Intelligence",
  "duration": "5 minutes",
  "language": "en",
  "region": "US",
  "narration_type": "male",
  "hypothesis": "AI will transform healthcare"
}
```

**Response:**
```json
{
  "success": true,
  "script": {
    "title": "How AI is Transforming Healthcare",
    "hook": "Imagine a world where...",
    "main_content": "...",
    "conclusion": "...",
    "call_to_action": "Subscribe for more..."
  }
}
```

#### 2. Scene Planning

##### `POST /api/plan-scenes`

Plan video scenes based on script and transcription.

**Request Body:**
```json
{
  "transcription": "Full transcription text...",
  "videoDurationSeconds": 300,
  "fps": 30,
  "aspectRatio": "16:9",
  "visualTheme": "cinematic"
}
```

**Response:**
```json
{
  "scenes": [
    {
      "id": "scene-1",
      "narration": "Scene narration text",
      "duration_seconds": 15,
      "start_time": 0,
      "end_time": 15
    }
  ]
}
```

#### 3. Image Generation

##### `POST /api/generate-images`

Generate images using Google Imagen.

**Request Body:**
```json
{
  "prompt": "A cinematic scene of a futuristic city",
  "numberOfImages": 1,
  "aspectRatio": "16:9"
}
```

**Response:**
```json
{
  "images": [
    {
      "dataUrl": "data:image/png;base64,...",
      "prompt": "Enhanced prompt text"
    }
  ]
}
```

##### `POST /api/enhance-title-for-thumbnail`

Enhance a title/prompt for thumbnail generation.

**Request Body:**
```json
{
  "scene": {
    "id": "scene-1",
    "narration": "Original narration text"
  }
}
```

**Response:**
```json
{
  "sceneId": "scene-1",
  "success": true,
  "originalText": "Original narration text",
  "enhancedPrompt": "Enhanced prompt with cinematic details",
  "image": "data:image/png;base64,..."
}
```

#### 4. Google Drive Integration

##### `POST /api/google-drive-upload`

Upload a file to Google Drive.

**Request Body:**
```json
{
  "file": "base64-encoded file",
  "fileName": "video.mp4",
  "folderId": "drive-folder-id"
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "drive-file-id",
  "webViewLink": "https://drive.google.com/..."
}
```

##### `GET /api/google-drive-library?category=all`

Retrieve media library from Google Drive.

**Response:**
```json
{
  "files": [
    {
      "id": "file-id",
      "name": "image.jpg",
      "mimeType": "image/jpeg",
      "thumbnailLink": "https://..."
    }
  ]
}
```

#### 5. Video Rendering (AWS Lambda)

##### `POST /api/lambda/deploy-function`

Deploy Remotion Lambda function.

**Request Body:**
```json
{
  "region": "us-east-1",
  "timeoutInSeconds": 900,
  "memorySizeInMb": 3008
}
```

**Response:**
```json
{
  "functionName": "remotion-render-function"
}
```

##### `POST /api/lambda/deploy-site`

Deploy Remotion site to S3.

**Request Body:**
```json
{
  "entryPoint": "./src/index.tsx",
  "siteName": "vloghub-remotion-site",
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "serveUrl": "https://remotion-site.s3.amazonaws.com/...",
  "bucketName": "remotion-site-bucket"
}
```

##### `POST /api/lambda/render`

Start video rendering job.

**Request Body:**
```json
{
  "serveUrl": "https://remotion-site.s3.amazonaws.com/...",
  "compositionId": "VideoComposition",
  "inputProps": {
    "scenes": [...],
    "settings": {...}
  },
  "codec": "h264",
  "functionName": "remotion-render-function",
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "renderId": "render-job-id",
  "bucketName": "remotion-render-bucket"
}
```

##### `POST /api/lambda/render-progress`

Check rendering progress.

**Request Body:**
```json
{
  "renderId": "render-job-id",
  "bucketName": "remotion-render-bucket",
  "functionName": "remotion-render-function",
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "done": false,
  "overallProgress": 45,
  "timeToFinish": 120
}
```

#### 6. Social Media Publishing

##### `POST /api/youtube-publish`

Publish video to YouTube.

**Request Body:**
```json
{
  "videoId": "project-id",
  "title": "Video Title",
  "description": "Video description",
  "thumbnailUrl": "https://...",
  "privacyStatus": "public"
}
```

**Response:**
```json
{
  "success": true,
  "youtubeVideoId": "youtube-video-id",
  "url": "https://youtube.com/watch?v=..."
}
```

##### `POST /api/facebook-publish`

Publish video to Facebook.

**Request Body:**
```json
{
  "videoId": "project-id",
  "pageId": "facebook-page-id",
  "title": "Video Title",
  "description": "Video description"
}
```

**Response:**
```json
{
  "success": true,
  "facebookPostId": "facebook-post-id",
  "url": "https://facebook.com/..."
}
```

#### 7. Audio Transcription

##### `POST /api/transcribe-audio`

Transcribe audio file.

**Request Body:**
```json
{
  "audioFile": "base64-encoded-audio",
  "language": "en"
}
```

**Response:**
```json
{
  "transcription": "Full transcription text...",
  "language": "en"
}
```

#### 8. Video Processing

##### `POST /api/cut-clips`

Cut video clips based on scene timings.

**Request Body:**
```json
{
  "videoUrl": "https://drive.google.com/...",
  "scenes": [
    {
      "id": "scene-1",
      "start_time": 0,
      "end_time": 15
    }
  ]
}
```

**Response:**
```json
{
  "clips": [
    {
      "sceneId": "scene-1",
      "clipUrl": "https://s3.amazonaws.com/..."
    }
  ]
}
```

### Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "success": false
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

---

## Video Generation Workflow

### Complete Video Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Script Generation                                         │
│    User selects topic → AI generates script                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Script Approval                                           │
│    User reviews/edits script → Approves for production      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Scene Planning                                            │
│    AI plans scenes based on script → Creates scene structure│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Media Asset Selection                                     │
│    User/AI selects images/videos for each scene             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Scene Configuration                                       │
│    User configures scene settings, effects, timing          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Video Rendering                                           │
│    Remotion composes video → AWS Lambda renders             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Publishing                                                │
│    Video uploaded to Drive → Published to YouTube/Facebook  │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Workflow Steps

#### Step 1: Script Generation

**API:** `POST /api/generate-script`

1. User provides topic, duration, language, region
2. System calls Gemini AI to generate script
3. Script structured with hook, main content, conclusion, CTA
4. Script saved to `scripts_approved` table

#### Step 2: Scene Planning

**API:** `POST /api/plan-scenes`

1. Script text analyzed for scene breaks
2. AI determines optimal scene timing
3. Scenes created with narration, duration, timing
4. Scenes saved to `project_scenes` table

#### Step 3: Media Asset Management

**APIs:**
- `GET /api/google-drive-library`
- `POST /api/google-image-search`
- `POST /api/generate-images`

1. User searches for images/videos
2. AI can auto-generate images using Imagen
3. Assets assigned to scenes
4. Asset metadata stored in scene `assets` JSONB field

#### Step 4: Video Rendering

**APIs:**
- `POST /api/lambda/deploy-site`
- `POST /api/lambda/render`
- `POST /api/lambda/render-progress`

1. Remotion composition prepared with scenes and assets
2. Remotion site deployed to S3
3. Lambda function renders video frame-by-frame
4. Progress tracked via polling
5. Final video uploaded to S3/Google Drive

#### Step 5: Publishing

**APIs:**
- `POST /api/youtube-publish`
- `POST /api/facebook-publish`

1. Video metadata prepared (title, description, thumbnail)
2. OAuth tokens retrieved from `social_accounts` table
3. Video uploaded to platform
4. Publishing status tracked

### Chroma Key Video Processing Workflow

For videos with green screen/chroma key:

```
1. User uploads chroma key video
   ↓
2. Video compressed and uploaded to Drive
   ↓
3. Audio extracted from video
   ↓
4. Audio transcribed (POST /api/transcribe-audio)
   ↓
5. Scenes planned with LLM (POST /api/plan-scenes)
   ↓
6. Video clips cut based on scenes (POST /api/cut-clips)
   ↓
7. Background images generated/selected
   ↓
8. Final video composed with backgrounds
```

---

## Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **FFmpeg**: Latest version (for video processing)
- **Git**: For version control

### Installation Steps

#### 1. Clone Repository

```bash
git clone https://github.com/remotedesktop1377-cloud/vloghub.git
cd vloghub/frontend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Configuration

> **📋 Important**: Before proceeding, follow the [CREDENTIALS_SETUP_GUIDE.md](./CREDENTIALS_SETUP_GUIDE.md) to obtain all required API keys and credentials.

Create `.env.local` file (see [Environment Configuration](#environment-configuration))

#### 4. Database Setup

**Option A: Using Supabase (Recommended)**

1. Create Supabase project at https://supabase.com
2. Run schema migrations:
   ```bash
   # Connect to Supabase SQL editor
   # Copy and execute: frontend/supabase/schema.sql
   ```

**Option B: Local PostgreSQL**

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE vloghub;
   ```
3. Run schema:
   ```bash
   psql -d vloghub -f frontend/supabase/schema.sql
   ```

#### 5. Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Project Structure Guidelines

#### Adding New API Routes

1. Create route file: `app/api/your-route/route.ts`
2. Export HTTP method handlers: `GET`, `POST`, `PUT`, `DELETE`
3. Add endpoint to `src/config/apiEndpoints.ts`
4. Create service in `src/services/` if needed

#### Adding New Components

1. Create component: `src/components/YourComponent/YourComponent.tsx`
2. Create styles: `src/components/YourComponent/YourComponent.module.css`
3. Export from index if needed

#### Adding New Services

1. Create service: `src/services/yourService.ts`
2. Use `HttpService` for API calls
3. Define types in service file or `src/types/`

---

## Environment Configuration

> **📋 Credentials Setup**: For detailed step-by-step instructions on obtaining all required API keys and credentials, see [CREDENTIALS_SETUP_GUIDE.md](./CREDENTIALS_SETUP_GUIDE.md)

### Required Environment Variables

Create `.env.local` in the `frontend/` directory:

```bash
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (NextAuth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google APIs
GOOGLE_DRIVE_CLIENT_ID=your-drive-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-drive-client-secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/google-drive-oauth/callback

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# YouTube API
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube-oauth/callback

# Facebook API
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/facebook-oauth/callback

# AWS Lambda (Remotion)
REMOTION_AWS_ACCESS_KEY_ID=your-aws-access-key
REMOTION_AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# OpenAI (Optional)
OPENAI_API_KEY=your-openai-api-key

# Envato API (Optional)
ENVATO_API_KEY=your-envato-api-key
```

### Environment Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | Yes | Base URL of your application |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT signing (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `REMOTION_AWS_ACCESS_KEY_ID` | Yes | AWS access key for Lambda |
| `REMOTION_AWS_SECRET_ACCESS_KEY` | Yes | AWS secret key for Lambda |
| `AWS_REGION` | Yes | AWS region for Lambda functions |

### Generating Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate random string for other secrets
openssl rand -hex 32
```

---

## Deployment Guide

### Vercel Deployment (Recommended)

#### 1. Connect Repository

1. Go to https://vercel.com
2. Import your Git repository
3. Configure project settings

#### 2. Environment Variables

Add all environment variables in Vercel dashboard:
- Settings → Environment Variables

#### 3. Build Settings

Vercel auto-detects Next.js. Ensure:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

#### 4. Deploy

```bash
# Automatic deployment on git push
git push origin main

# Or deploy manually
vercel deploy
```

### AWS Lambda Setup (Video Rendering)

#### 1. Deploy Remotion Function

**API:** `POST /api/lambda/deploy-function`

```bash
curl -X POST https://your-domain.com/api/lambda/deploy-function \
  -H "Content-Type: application/json" \
  -d '{
    "region": "us-east-1",
    "timeoutInSeconds": 900,
    "memorySizeInMb": 3008
  }'
```

#### 2. Deploy Remotion Site

**API:** `POST /api/lambda/deploy-site`

```bash
curl -X POST https://your-domain.com/api/lambda/deploy-site \
  -H "Content-Type: application/json" \
  -d '{
    "entryPoint": "./src/index.tsx",
    "siteName": "vloghub-remotion-site",
    "region": "us-east-1"
  }'
```

#### 3. Configure IAM Permissions

Lambda function needs:
- S3 read/write permissions
- CloudWatch Logs permissions
- VPC access (if required)

### Database Migration

#### Supabase

1. Go to Supabase SQL Editor
2. Run migration scripts from `frontend/supabase/`
3. Verify RLS policies are enabled

#### Local PostgreSQL

```bash
psql -h localhost -U postgres -d vloghub -f frontend/supabase/schema.sql
```

### Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] OAuth redirect URIs updated for production
- [ ] AWS Lambda functions deployed
- [ ] Remotion site deployed to S3
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (Vercel Analytics)
- [ ] CDN configured (if applicable)
- [ ] SSL certificate valid
- [ ] Backup strategy in place

---

## Key Features & Workflows

### 1. Trending Topics Discovery

**Flow:**
1. User navigates to `/trending-topics`
2. System fetches trending topics from Gemini AI
3. User selects topic
4. System generates script based on topic

**Components:**
- `TrendingTopicsComponent/TrendingTopicsPage.tsx`
- API: `GET /api/gemini-trending-topics`

### 2. Script Production

**Flow:**
1. User uploads chroma key video or starts from script
2. If video: audio extracted and transcribed
3. Scenes planned automatically
4. User edits scenes and narration
5. Script approved for video generation

**Components:**
- `scriptProductionComponents/ChromaKeyUpload.tsx`
- API: `POST /api/transcribe-audio`
- API: `POST /api/plan-scenes`

### 3. Video Editor

**Features:**
- Timeline editing
- Asset management
- Scene properties configuration
- Real-time preview with Remotion Player

**Components:**
- `editor/timeline/`
- `editor/AssetsPanel/`
- `editor/PropertiesSection/`
- `editor/player/`

### 4. Media Asset Management

**Sources:**
- Google Drive library
- Google Image Search
- Envato marketplace
- AI-generated images (Imagen)

**APIs:**
- `GET /api/google-drive-library`
- `POST /api/google-image-search`
- `POST /api/envato-image-search`
- `POST /api/generate-images`

### 5. Social Media Publishing

**Supported Platforms:**
- YouTube
- Facebook

**Flow:**
1. User connects social media account (OAuth)
2. Tokens stored in `social_accounts` table
3. User publishes video
4. System uses stored tokens to publish

**APIs:**
- `POST /api/youtube-oauth/initiate`
- `POST /api/youtube-publish`
- `POST /api/facebook-oauth/initiate`
- `POST /api/facebook-publish`

---

## AI Integration

### Google Gemini AI

**Usage:**
- Script generation
- Prompt enhancement for images
- Keyword highlighting
- Trending topics generation

**Configuration:**
```typescript
// src/utils/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
```

**Key Endpoints:**
- `POST /api/generate-script`
- `POST /api/enhance-title-for-thumbnail`
- `POST /api/gemini-highlight-keywords`
- `GET /api/gemini-trending-topics`

### Google Imagen

**Usage:**
- Thumbnail generation
- Scene background generation

**Configuration:**
```typescript
// app/api/enhance-title-for-thumbnail/route.ts
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
```

**Key Endpoints:**
- `POST /api/enhance-title-for-thumbnail`
- `POST /api/generate-images`
- `POST /api/generate-scene-backgrounds`

### OpenAI (Optional)

**Usage:**
- Alternative AI services
- Advanced NLP tasks

**Configuration:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## Storage & Media Management

### Google Drive Integration

**Purpose:**
- Store uploaded videos
- Store generated images
- Store final video exports
- Media library management

**Key Operations:**
- Upload files
- Create folders
- List files
- Download files
- Generate shareable links

**APIs:**
- `POST /api/google-drive-upload`
- `POST /api/google-drive-scene-upload`
- `GET /api/google-drive-library`
- `POST /api/google-drive-generate-folder`

### AWS S3 Integration

**Purpose:**
- Store Remotion site bundles
- Store rendered video outputs
- Temporary file storage

**Configuration:**
- Managed via AWS SDK
- Credentials: `REMOTION_AWS_ACCESS_KEY_ID`, `REMOTION_AWS_SECRET_ACCESS_KEY`

### File Organization

```
Google Drive Structure:
├── VlogHub/
│   ├── Projects/
│   │   └── {job-name}/
│   │       ├── input/          # Input videos
│   │       ├── scenes/         # Scene assets
│   │       ├── output/         # Final videos
│   │       └── thumbnails/     # Thumbnails
│   └── Library/                # Media library
│       ├── Images/
│       └── Videos/
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem:** Users cannot sign in

**Solutions:**
- Verify `NEXTAUTH_SECRET` is set
- Check Google OAuth credentials
- Verify redirect URIs match in Google Console
- Check Supabase connection

#### 2. Database Connection Issues

**Problem:** Cannot connect to Supabase

**Solutions:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys
- Check Supabase project status
- Verify RLS policies allow access
- Check network connectivity

#### 3. Video Rendering Failures

**Problem:** Lambda rendering fails

**Solutions:**
- Verify AWS credentials
- Check Lambda function deployment
- Verify Remotion site deployment
- Check S3 bucket permissions
- Review CloudWatch logs

#### 4. Image Generation Errors

**Problem:** Imagen API returns errors

**Solutions:**
- Check `GEMINI_API_KEY` is valid
- Verify API quotas not exceeded
- Check prompt content (content moderation)
- Implement retry logic (already in code)

#### 5. OAuth Flow Issues

**Problem:** Social media OAuth fails

**Solutions:**
- Verify redirect URIs match exactly
- Check OAuth app credentials
- Verify callback handlers are accessible
- Check token storage in database

### Debugging Tips

#### Enable Debug Logging

```typescript
// Add to API routes
console.log('[DEBUG]', { requestBody, userId, etc });
```

#### Check API Responses

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

#### Database Queries

```sql
-- Check user projects
SELECT * FROM video_projects WHERE user_id = 'user-uuid';

-- Check scene data
SELECT * FROM project_scenes WHERE project_id = 'project-uuid';
```

#### AWS Lambda Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/remotion-render-function --follow
```

---

## Additional Resources

### Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Remotion Documentation](https://www.remotion.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)

### Internal Documentation

- `README.md` - Project overview
- `tasks/` - Development task breakdowns
- `frontend/supabase/schema.sql` - Database schema

### Support

For technical issues or questions:
1. Check this documentation
2. Review code comments
3. Check GitHub issues
4. Contact development team

---

## Appendix

### A. API Endpoint Reference

Complete list of API endpoints:

```
Authentication:
- GET/POST /api/auth/[...nextauth]

Script Generation:
- POST /api/generate-script
- POST /api/plan-scenes

Image Generation:
- POST /api/generate-images
- POST /api/enhance-title-for-thumbnail
- POST /api/generate-scene-backgrounds

Media Search:
- POST /api/google-image-search
- POST /api/envato-image-search
- POST /api/envato-clips-search

Google Drive:
- POST /api/google-drive-upload
- POST /api/google-drive-scene-upload
- GET /api/google-drive-library
- POST /api/google-drive-generate-folder

Video Processing:
- POST /api/transcribe-audio
- POST /api/cut-clips
- POST /api/serve-clip

AWS Lambda:
- POST /api/lambda/deploy-function
- POST /api/lambda/deploy-site
- POST /api/lambda/render
- POST /api/lambda/render-progress
- POST /api/lambda/get-functions
- POST /api/lambda/quotas

Social Media:
- POST /api/youtube-oauth/initiate
- GET /api/youtube-oauth/callback
- POST /api/youtube-publish
- POST /api/facebook-oauth/initiate
- GET /api/facebook-oauth/callback
- POST /api/facebook-publish
- POST /api/facebook-select-page

Other:
- GET /api/gemini-trending-topics
- POST /api/gemini-highlight-keywords
- POST /api/gamma-generate
- POST /api/gamma-pdf
- GET /api/published-videos
- POST /api/youtube-delete
- POST /api/cleanup-exports
```

### B. Database Schema Reference

See `frontend/supabase/schema.sql` for complete schema.

### C. Type Definitions

Key TypeScript types are defined in:
- `src/types/` - Application types
- Service files - API request/response types

---

# Vloghub - Credentials & API Keys Setup Guide

**Version:** 1.0.0  
**Last Updated:** 2025  
**Purpose:** Complete guide for setting up all required credentials and API keys

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Checklist](#quick-checklist)
3. [Supabase Setup](#supabase-setup)
4. [Google OAuth & APIs Setup](#google-oauth--apis-setup)
5. [AWS Lambda Setup](#aws-lambda-setup)
6. [Facebook API Setup](#facebook-api-setup)
7. [YouTube API Setup](#youtube-api-setup)
8. [Vercel Deployment Setup](#vercel-deployment-setup)
9. [Optional Services](#optional-services)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This document provides step-by-step instructions for obtaining and configuring all credentials required to run the Vloghub platform. Each service requires specific setup steps and API keys.

### Required Credentials Summary

| Service | Required | Purpose |
|---------|----------|---------|
| Supabase | ✅ Yes | Database & Authentication |
| Google OAuth | ✅ Yes | User Authentication (NextAuth) |
| Google Drive API | ✅ Yes | Media Storage |
| Google Gemini AI | ✅ Yes | Script Generation & AI Features |
| AWS Lambda | ✅ Yes | Video Rendering |
| YouTube API | ✅ Yes | Video Publishing |
| Facebook API | ✅ Yes | Video Publishing |
| Vercel | ✅ Yes | Deployment Platform |
| OpenAI | ⚠️ Optional | Alternative AI Services |
| Envato API | ⚠️ Optional | Media Marketplace |

---

## Quick Checklist

Use this checklist to track your credential setup progress:

- [ ] Supabase project created and configured
- [ ] Google Cloud Console project created
- [ ] Google OAuth credentials obtained
- [ ] Google Drive API enabled and configured
- [ ] Gemini API key obtained
- [ ] AWS account created
- [ ] AWS IAM user created with Lambda permissions
- [ ] YouTube API credentials obtained
- [ ] Facebook App created and configured
- [ ] Vercel account connected
- [ ] All environment variables added to `.env.local`
- [ ] All environment variables added to Vercel dashboard

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: `vloghub` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

### Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Security Note:**
- `anon/public key`: Safe to expose in frontend code
- `service_role key`: **NEVER** expose in frontend - server-side only

### Step 3: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `frontend/supabase/schema.sql`
4. Paste and execute the query
5. Verify tables are created: Go to **Table Editor** to confirm

### Step 4: Configure Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Dashboard](https://app.supabase.com)

---

## Google OAuth & APIs Setup

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Vloghub` (or your preferred name)
4. Click **"Create"**
5. Wait for project creation (may take a minute)

### Step 2: Enable Required APIs

Enable the following APIs in Google Cloud Console:

1. Go to **APIs & Services** → **Library**
2. Search and enable each API:
   - ✅ **Google Drive API**
   - ✅ **YouTube Data API v3**
   - ✅ **Google Generative AI API** (for Gemini)
   - ✅ **Google+ API** (for OAuth)

### Step 3: Create OAuth 2.0 Credentials

#### For NextAuth (User Authentication)

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - **User Type**: External (for public use)
   - **App name**: Vloghub
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Scopes**: Add `email`, `profile`, `openid`
   - **Test users**: Add your email for testing
4. Create OAuth client:
   - **Application type**: Web application
   - **Name**: `Vloghub NextAuth`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)
5. Click **"Create"**
6. Copy **Client ID** and **Client Secret**

#### For Google Drive API

1. Create another OAuth client:
   - **Application type**: Web application
   - **Name**: `Vloghub Google Drive`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-domain.com`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/google-drive-oauth/callback`
     - `https://your-domain.com/api/google-drive-oauth/callback`
2. Copy **Client ID** and **Client Secret**

#### For YouTube API

1. Create another OAuth client:
   - **Application type**: Web application
   - **Name**: `Vloghub YouTube`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-domain.com`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/youtube-oauth/callback`
     - `https://your-domain.com/api/youtube-oauth/callback`
2. Copy **Client ID** and **Client Secret**

### Step 4: Get Gemini API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the API key
4. (Optional) Restrict the API key:
   - Click on the API key
   - Under **API restrictions**, select **"Restrict key"**
   - Select **"Google Generative AI API"**
   - Click **"Save"**

### Step 5: Configure Environment Variables

Add to `.env.local`:

```bash
# Google OAuth (NextAuth)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=your-drive-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your-drive-client-secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/google-drive-oauth/callback

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# YouTube API
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your-youtube-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube-oauth/callback
```

### Resources

- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Docs](https://developers.google.com/drive/api)
- [Gemini API Docs](https://ai.google.dev/docs)

---

## AWS Lambda Setup

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Sign up for an AWS account (requires credit card, but free tier available)
3. Complete account verification

### Step 2: Create IAM User for Lambda

1. Go to **IAM** → **Users**
2. Click **"Add users"**
3. Enter username: `vloghub-lambda-user`
4. Select **"Programmatic access"**
5. Click **"Next: Permissions"**
6. Attach policies:
   - `AWSLambda_FullAccess`
   - `AmazonS3FullAccess`
   - `CloudWatchLogsFullAccess`
7. Click **"Next"** → **"Create user"**
8. **IMPORTANT**: Copy and save:
   - **Access Key ID**
   - **Secret Access Key** (shown only once!)

### Step 3: Create S3 Buckets

1. Go to **S3** → **Buckets**
2. Create bucket for Remotion site:
   - **Bucket name**: `vloghub-remotion-site` (must be globally unique)
   - **Region**: `us-east-1` (or your preferred region)
   - **Block Public Access**: Uncheck (Remotion needs public access)
   - Click **"Create bucket"**
3. Create bucket for rendered videos:
   - **Bucket name**: `vloghub-rendered-videos` (must be globally unique)
   - **Region**: Same as above
   - **Block Public Access**: Configure as needed
   - Click **"Create bucket"**

### Step 4: Configure Environment Variables

Add to `.env.local`:

```bash
REMOTION_AWS_ACCESS_KEY_ID=your-aws-access-key-id
REMOTION_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
```

### Step 5: Deploy Lambda Function (After App is Running)

The Lambda function is deployed via API endpoint after the app is running:

```bash
POST /api/lambda/deploy-function
```

Or manually using AWS CLI:

```bash
aws lambda create-function \
  --function-name remotion-render \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip
```

### Resources

- [AWS Console](https://console.aws.amazon.com)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Remotion Lambda Setup](https://www.remotion.dev/docs/lambda)

---

## Facebook API Setup

### Step 1: Create Facebook App

1. Go to https://developers.facebook.com
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details:
   - **App Name**: `Vloghub`
   - **App Contact Email**: Your email
   - **Business Account**: (Optional)
5. Click **"Create App"**

### Step 2: Add Facebook Login Product

1. In App Dashboard, click **"Add Product"**
2. Find **"Facebook Login"** → Click **"Set Up"**
3. Select **"Web"** platform
4. Enter **Site URL**: `http://localhost:3000` (for development)

### Step 3: Configure OAuth Settings

1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs**:
   - `http://localhost:3000/api/facebook-oauth/callback`
   - `https://your-domain.com/api/facebook-oauth/callback`
3. Click **"Save Changes"**

### Step 4: Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy:
   - **App ID**
   - **App Secret** (click "Show" to reveal)

### Step 5: Request Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `pages_manage_posts` - To publish videos
   - `pages_read_engagement` - To read page data
   - `pages_show_list` - To list user's pages

**Note**: Some permissions require App Review for production use.

### Step 6: Configure Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/facebook-oauth/callback
```

### Resources

- [Facebook Developers](https://developers.facebook.com)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)

---

## YouTube API Setup

**Note**: YouTube API credentials are created in Google Cloud Console (same as Google OAuth setup above).

### Step 1: Enable YouTube Data API v3

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"YouTube Data API v3"**
3. Click **"Enable"**

### Step 2: Create OAuth Client (If Not Already Done)

Follow the steps in [Google OAuth & APIs Setup](#google-oauth--apis-setup) section.

The YouTube OAuth client should have:
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/youtube-oauth/callback`
  - `https://your-domain.com/api/youtube-oauth/callback`

### Step 3: Configure Quotas

1. Go to **APIs & Services** → **Dashboard**
2. Click on **YouTube Data API v3**
3. Go to **Quotas** tab
4. Review default quotas (10,000 units/day for free tier)

### Step 4: Environment Variables

Already configured in Google OAuth section:

```bash
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your-youtube-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube-oauth/callback
```

### Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [YouTube API Quotas](https://developers.google.com/youtube/v3/getting-started#quota)

---

## Vercel Deployment Setup

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub, GitLab, or Bitbucket
3. Complete account setup

### Step 2: Import Project

1. In Vercel dashboard, click **"Add New"** → **"Project"**
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend` (if repo is monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Click **"Deploy"**

### Step 3: Add Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Add all environment variables from `.env.local`:
   - For each variable, select environments: **Production**, **Preview**, **Development**
   - Click **"Save"**

**Important Variables to Add:**
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
... (all other variables)
```

### Step 4: Update OAuth Redirect URIs

After deployment, update OAuth redirect URIs in:
- Google Cloud Console
- Facebook App Settings

Add production URLs:
- `https://your-domain.vercel.app/api/auth/callback/google`
- `https://your-domain.vercel.app/api/youtube-oauth/callback`
- `https://your-domain.vercel.app/api/facebook-oauth/callback`

### Step 5: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger automatic deployment

### Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Optional Services

### OpenAI API (Optional)

If you want to use OpenAI as an alternative AI service:

1. Go to https://platform.openai.com
2. Sign up or log in
3. Go to **API Keys**
4. Click **"Create new secret key"**
5. Copy the key (shown only once)

Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-...
```

### Envato API (Optional)

For accessing Envato marketplace media:

1. Go to https://build.envato.com
2. Sign up or log in
3. Go to **API Keys**
4. Generate new API key
5. Copy the key

Add to `.env.local`:
```bash
ENVATO_API_KEY=your-envato-api-key
```

---

## Security Best Practices

### 1. Never Commit Credentials

- ✅ Add `.env.local` to `.gitignore`
- ✅ Never commit API keys to Git
- ✅ Use environment variables for all secrets

### 2. Use Different Credentials for Development and Production

- Development: Use test/sandbox credentials
- Production: Use production credentials
- Never use production credentials in development

### 3. Rotate Keys Regularly

- Rotate API keys every 90 days
- Revoke unused keys immediately
- Monitor API usage for suspicious activity

### 4. Restrict API Keys

- Restrict Google API keys to specific APIs
- Restrict AWS IAM users to minimum required permissions
- Use IP restrictions when possible

### 5. Secure Storage

- Use password manager for storing credentials
- Share credentials via secure channels (encrypted email, password manager)
- Never share credentials via Slack, email, or chat

### 6. Monitor Usage

- Set up billing alerts in Google Cloud Console
- Monitor AWS costs
- Set up usage quotas for APIs

---

## Troubleshooting

### Common Issues

#### 1. "Invalid OAuth redirect URI"

**Problem**: OAuth callback fails with redirect URI error

**Solution**:
- Verify redirect URI matches exactly in:
  - Google Cloud Console OAuth settings
  - Facebook App settings
  - Your `.env.local` file
- Ensure no trailing slashes
- Check HTTP vs HTTPS

#### 2. "API key not valid"

**Problem**: API calls fail with authentication error

**Solution**:
- Verify API key is correct (no extra spaces)
- Check if API is enabled in Google Cloud Console
- Verify API key restrictions allow your IP/domain
- Check if API quota is exceeded

#### 3. "Supabase connection failed"

**Problem**: Cannot connect to Supabase

**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check if Supabase project is active
- Verify API keys are correct
- Check network connectivity

#### 4. "AWS Lambda access denied"

**Problem**: Lambda deployment fails

**Solution**:
- Verify AWS credentials are correct
- Check IAM user has required permissions
- Verify AWS region matches in all configs
- Check S3 bucket permissions

#### 5. "Vercel build fails"

**Problem**: Deployment fails on Vercel

**Solution**:
- Verify all environment variables are set in Vercel
- Check build logs for specific errors
- Ensure `NEXTAUTH_URL` matches Vercel domain
- Verify all required APIs are enabled

### Getting Help

If you encounter issues:

1. Check service-specific documentation
2. Review error messages in browser console
3. Check server logs (Vercel function logs)
4. Verify all credentials are correctly set
5. Contact the development team with:
   - Error message
   - Steps to reproduce
   - Environment (development/production)

---

## Credentials Checklist for New Developer

When onboarding a new developer, provide them with:

### Required Access

- [ ] Supabase project access (or create new project)
- [ ] Google Cloud Console project access (or create new project)
- [ ] AWS account access (or create new account)
- [ ] Facebook Developer account access (or create new app)
- [ ] Vercel account access (or create new account)

### Credentials to Share

Share via secure channel (password manager, encrypted file):

- [ ] Supabase project URL and API keys
- [ ] Google OAuth client IDs and secrets (all three: NextAuth, Drive, YouTube)
- [ ] Gemini API key
- [ ] AWS access key ID and secret
- [ ] Facebook App ID and secret
- [ ] Vercel project access
- [ ] `.env.local` template with all variables

### Documentation to Share

- [ ] This credentials setup guide
- [ ] Technical documentation
- [ ] Repository access
- [ ] Any internal setup notes

---

## Quick Reference: Environment Variables Template

Copy this template to create your `.env.local` file:

```bash
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (NextAuth)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=your-drive-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your-drive-client-secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/google-drive-oauth/callback

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# YouTube API
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your-youtube-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube-oauth/callback

# Facebook API
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/facebook-oauth/callback

# AWS Lambda (Remotion)
REMOTION_AWS_ACCESS_KEY_ID=your-aws-access-key-id
REMOTION_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1

# OpenAI (Optional)
OPENAI_API_KEY=your-openai-api-key

# Envato API (Optional)
ENVATO_API_KEY=your-envato-api-key
```
---

**Document Version:** 1.0.0  
**Last Updated:** 2025  
**Maintained By:** Vloghub Development Team
**⚠️ Security Reminder**: Never commit this file or share credentials via insecure channels!
