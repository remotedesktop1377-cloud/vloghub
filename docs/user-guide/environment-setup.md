# Environment Setup Guide

This guide explains how to set up the environment variables for the YouTube Research Video Clip Finder application.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```bash
   # Required API keys
   YOUTUBE_API_KEY=your-youtube-api-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   ```

3. Start the application:
   ```bash
   python src/app.py
   ```

## Required Environment Variables

### YouTube API Key (Required)

To use the search functionality, you need a YouTube Data API v3 key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Add the key to your `.env` file:
   ```
   YOUTUBE_API_KEY=your-actual-api-key-here
   ```

### OpenAI API Key (Required for AI Features)

For AI-powered features like prompt enhancement and sentiment analysis:

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add it to your `.env` file:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

## Environment Variables Reference

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | Application environment (development, staging, production) |
| `DEBUG` | `true` | Enable debug mode |
| `SECRET_KEY` | - | Secret key for JWT tokens and encryption |

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_HOST` | `0.0.0.0` | API server host |
| `PORT` | `10000` | API server port |
| `FRONTEND_HOST` | `localhost` | Frontend server host |
| `FRONTEND_PORT` | `3000` | Frontend server port |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./data/youtube_clip_finder.db` | Database connection URL |
| `POSTGRES_USER` | - | PostgreSQL username (for production) |
| `POSTGRES_PASSWORD` | - | PostgreSQL password (for production) |
| `POSTGRES_DB` | - | PostgreSQL database name |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |

### AI Services

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | OpenAI model to use |
| `OPENAI_MAX_TOKENS` | `1000` | Maximum tokens per request |
| `WHISPER_MODEL` | `base` | Whisper model for transcription |

### Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | `./data` | Main data directory |
| `CACHE_DIR` | `./cache` | Cache directory |
| `DOWNLOADS_DIR` | `./downloads` | Downloads directory |
| `TRANSCRIPTS_DIR` | `./data/transcripts` | Transcripts storage |
| `CLIPS_DIR` | `./data/clips` | Clips storage |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_AI_CLIP_DETECTION` | `true` | Enable AI-powered clip detection |
| `FEATURE_AUTOMATIC_TRANSCRIPTION` | `true` | Enable automatic transcription |
| `FEATURE_SENTIMENT_ANALYSIS` | `true` | Enable sentiment analysis |
| `FEATURE_ENTITY_RECOGNITION` | `true` | Enable named entity recognition |
| `FEATURE_BATCH_DOWNLOAD` | `true` | Enable batch downloading |

## Environment-Specific Configuration

### Development

For local development, the default configuration should work:

```bash
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=sqlite:///./data/youtube_clip_finder.db
LOG_LEVEL=DEBUG
```

### Production

For production deployment, use more secure settings:

```bash
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-very-secure-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/youtube_clip_finder
LOG_LEVEL=INFO
CORS_ORIGINS=https://yourdomain.com
```

### Docker

When running in Docker, use these additional settings:

```bash
DOCKER_ENV=true
API_HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:password@db:5432/youtube_clip_finder
```

## Security Considerations

1. **Never commit `.env` files** - They contain sensitive information
2. **Use strong secret keys** - Generate random keys for production
3. **Restrict CORS origins** - Only allow your actual domains
4. **Enable HTTPS** - Use SSL certificates in production
5. **Regular key rotation** - Update API keys periodically

## Troubleshooting

### Common Issues

**API key not working:**
- Verify the key is correct
- Check if the API is enabled in Google Cloud Console
- Ensure you haven't exceeded quota limits

**Database connection failed:**
- Check if the database server is running
- Verify connection parameters
- Ensure the database exists

**Permission errors:**
- Check file/directory permissions
- Ensure the application can write to data directories

### Testing Configuration

Test your configuration with:

```bash
# Test API connectivity
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('YouTube API Key:', 'SET' if os.getenv('YOUTUBE_API_KEY') else 'NOT SET')
print('OpenAI API Key:', 'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET')
"
```

## Getting Help

If you need help with environment setup:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review the [FAQ](./faq.md)
3. Contact support at support@youtube-clip-finder.example.com 