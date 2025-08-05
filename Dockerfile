# Multi-stage Docker build for YouTube Clip Searcher
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Python backend stage
FROM python:3.11-slim AS backend-base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    wget \
    curl \
    git \
    ffmpeg \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy backend source code
COPY src/ ./src/
COPY tests/ ./tests/
COPY pytest.ini ./
COPY .env.example ./.env

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# Create necessary directories
RUN mkdir -p /app/downloads /app/cache /app/logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]

# Development stage
FROM backend-base AS development

# Switch back to root for development tools
USER root

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    pytest-asyncio \
    black \
    isort \
    flake8 \
    mypy

# Install Playwright browsers
RUN playwright install chromium

# Switch back to appuser
USER appuser

# Override command for development
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM backend-base AS production

# Copy only necessary files for production
COPY --chown=appuser:appuser . .

# Set production environment
ENV ENVIRONMENT=production

# Production command with optimizations
CMD ["gunicorn", "src.app:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120"] 