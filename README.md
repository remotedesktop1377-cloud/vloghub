# Vloghub - AI video content generation

A system that searches YouTube for relevant video content, extracts specific clips or segments, and organizes them for research video compilation.

## Project Overview

The YouTube Research Video Clip Finder is designed to help researchers and content creators find, extract, and organize video clips from YouTube for research purposes, such as creating historical documentaries.

### Key Features

- Advanced YouTube search with NLP-enhanced prompts
- Automatic clip detection and extraction
- Manual clip trimming and selection
- Metadata tagging with AI assistance
- Clip organization and storage

## Project Structure

- **project-specs/** - Project specifications and requirements
- **tasks/** - Detailed project plan and task breakdown

## Development Timeline

The project is divided into 7 phases over 11 weeks:

1. Requirements + Prompt Enhancer (Week 1-2)
2. YouTube API + Search Interface (Week 3-4)
3. Transcription + Clip Detection (Week 5-6)
4. UI + Manual Trimmer + Downloader (Week 7-8)
5. Tagging + Metadata (Week 9)
6. Testing + Final Deploy (Week 10)
7. User Guide + Researcher Feedback Loop (Week 11)

For detailed tasks and plans, see the [tasks directory](./tasks/).

## Tech Stack

- **Frontend**: Next.js, Material CSS, Redux toolkit
- **Database**: PostgreSQL
- **Search Engine**: FAISS or Weaviate
- **AI/NLP**: OpenAI APIs, Whisper, Hugging Face models
- **Deployment**: Kubernetes
- **Storage**: AWS S3 / Google Drive API

## Use Case Example

Create a video on Nelson Mandela's life, focusing on speeches before and after prison using public YouTube content:

- Search for speeches from different time periods (1960-2013)
- Extract 30-90 second segments
- Annotate clips with metadata (title, location, date, tone, speaker)
- Support multi-language subtitle detection

## Getting Started (Backend)

Follow these steps to run the FastAPI backend locally:

1. **Install prerequisites**
   - FFmpeg (required for video/audio conversion)

3. **Configure environment variables (optional)**
   - Copy `.env.example` to `.env` if provided.
   - Set any API keys (Gemini, Google Drive, etc.) referenced in `src/config`.

5. **Stop the server**
   - Press `Ctrl + C` in the terminal when finished.

6. **Troubleshooting**
   - Ensure FFmpeg is accessible via `ffmpeg -version`.
   - Delete the `.venv` folder and reinstall dependencies if packages become corrupted.

## License

[License information to be added] 
