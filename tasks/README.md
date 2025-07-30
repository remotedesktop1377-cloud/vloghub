# YouTube Research Video Clip Finder - Project Plan

This directory contains the detailed task breakdown for the YouTube Research Video Clip Finder project, organized according to the timeline outlined in the PRD.

## Project Overview

The YouTube Research Video Clip Finder is a system designed to:
- Search YouTube for relevant video content based on advanced prompts
- Extract and download specific clips or segments from longer videos
- Organize and store these clips for compilation into research videos

## Project Timeline

The project is divided into 7 phases, spanning 11 weeks:

1. [Phase 1: Requirements + Prompt Enhancer](./Phase1-Requirements.md) (Week 1-2)
2. [Phase 2: YouTube API + Search Interface](./Phase2-YouTubeAPI.md) (Week 3-4)
3. [Phase 3: Transcription + Clip Detection](./Phase3-TranscriptionClipDetection.md) (Week 5-6)
4. [Phase 4: UI + Manual Trimmer + Downloader](./Phase4-UITrimmerDownloader.md) (Week 7-8)
5. [Phase 5: Tagging + Metadata](./Phase5-TaggingMetadata.md) (Week 9)
6. [Phase 6: Testing + Final Deploy](./Phase6-TestingDeploy.md) (Week 10)
7. [Phase 7: User Guide + Researcher Feedback Loop](./Phase7-UserGuideFeedback.md) (Week 11)

## Tech Stack

- **Frontend**: React, Tailwind CSS, Redux
- **Backend**: Node.js + Express or FastAPI
- **Database**: PostgreSQL (for clip metadata)
- **Search Engine**: FAISS or Weaviate (embedding search)
- **AI/NLP**: OpenAI APIs, Whisper, Hugging Face models
- **Transcription**: Whisper or YouTube Captions
- **Deployment**: Kubernetes
- **Storage**: AWS S3 / Google Drive API

## How to Use This Plan

Each phase file contains:
- Detailed tasks broken down by week
- Specific deliverables for the phase
- A task tracker to monitor progress

Team members should:
1. Review the tasks for their assigned phase
2. Update the task tracker as work progresses
3. Document any issues or blockers in the notes section
4. Notify the project manager when tasks are completed or if assistance is needed

## Key Performance Indicators

- Query-to-clip time: < 30 sec avg
- Clip accuracy (relevance): > 90% by human raters
- Metadata accuracy: > 85% auto-tag success
- Usability Score (SUS): > 80

## Task Tracking Process

1. Each task should be assigned to a team member
2. Status should be updated regularly (Pending, In Progress, Completed)
3. Notes should be added for any important information
4. The task tracker in each phase document should be kept up to date 