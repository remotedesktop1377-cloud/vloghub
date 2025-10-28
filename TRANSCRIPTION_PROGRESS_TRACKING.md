# Transcription Progress Tracking System

## Overview

This system provides real-time progress tracking for the transcription API with the ability to resume from where it left off if something fails.

## Architecture

### Components

1. **Progress Tracker** (`frontend/src/utils/progressTracker.ts`)
   - In-memory store for progress updates
   - Utility functions to create, update, and retrieve progress
   - Calculates progress based on stage weights

2. **Progress API** (`frontend/app/api/progress/route.ts`)
   - Server-Sent Events (SSE) endpoint
   - Streams progress updates every 500ms
   - Automatically closes on completion or error

3. **Transcription API** (`frontend/app/api/transcribe/route.ts`)
   - Updated with progress tracking at each stage
   - Returns `jobId` for tracking progress
   - Updates progress throughout the process

4. **React Hook** (`frontend/src/hooks/useTranscriptionProgress.ts`)
   - Client-side hook to consume progress updates
   - Handles SSE connection management
   - Provides callbacks for completion and errors

## Progress Stages

1. **initializing** (0%) - Starting transcription process
2. **audio_extraction** (20%) - Extracting audio from video
3. **audio_compression** (10%) - Compressing audio if needed
4. **bytes_conversion** (5%) - Converting to base64
5. **generateContent** (30%) - Gemini AI transcription
6. **semantic_segmentation** (30%) - Processing into scenes
7. **completed** (100%) - Successfully completed

## Usage Example

### Frontend Implementation

```typescript
import { useState } from 'react';
import { useTranscriptionProgress } from '@/hooks/useTranscriptionProgress';

function TranscriptionComponent() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const progress = useTranscriptionProgress({
    jobId,
    onComplete: (data) => {
      console.log('Transcription completed!', data);
      setResult(data);
    },
    onError: (error) => {
      console.error('Transcription failed:', error);
      // Handle error - user can retry from here
    },
  });

  const startTranscription = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scriptLanguage', 'en');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setJobId(data.jobId); // Start tracking progress
    } catch (error) {
      console.error('Failed to start transcription:', error);
    }
  };

  const retryTranscription = async () => {
    if (jobId) {
      // Progress state is already tracked by the hook
      // Just need to trigger the retry
      setJobId(null); // Reset
      // Restart process
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) startTranscription(file);
      }} />
      
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        <p>{progress.message}</p>
        {progress.error && (
          <div className="error">
            <p>Error: {progress.error}</p>
            <button onClick={retryTranscription}>Retry</button>
          </div>
        )}
      </div>

      {/* Stage Indicators */}
      {result && (
        <div className="results">
          <h3>Transcription Complete!</h3>
          <p>Scenes: {result.scenes?.length || 0}</p>
        </div>
      )}
    </div>
  );
}
```

### Advanced: Resume on Error

```typescript
const handleRetry = async () => {
  if (!jobId) return;
  
  // Check current progress
  const currentProgress = await fetch(`/api/progress?jobId=${jobId}`)
    .then(r => r.json());
  
  if (currentProgress.stage === 'error') {
    // Resume from last successful stage
    // Implementation depends on your retry logic
    await resumeFromStage(currentProgress);
  }
};
```

## Benefits

✅ **Real-time Updates**: Progress updates every 500ms via SSE
✅ **Resume Capability**: Can track where process failed
✅ **Better UX**: Users see exactly what's happening
✅ **Error Recovery**: Clear error messages with retry options
✅ **Transparency**: Users know how long each stage takes

## Progress Weights

```typescript
{
  'initializing': 0,
  'audio_extraction': 20,      // Audio extraction takes ~20% of time
  'audio_compression': 10,     // Compression takes ~10% of time
  'bytes_conversion': 5,       // Conversion takes ~5% of time
  'generateContent': 30,        // AI transcription takes ~30% of time
  'semantic_segmentation': 30,  // Segmentation takes ~30% of time
  'completed': 5,
  'error': 0,
}
```

## Error Handling

The system tracks errors at each stage:

```typescript
// If audio extraction fails
errorProgress(jobId, 'Audio extraction failed: ...');

// If compression fails
errorProgress(jobId, 'Audio compression failed: ...');

// If Gemini API fails
errorProgress(jobId, 'Transcription failed: ...');
```

## Cleanup

Progress data is automatically cleaned up:
- After successful completion: 1 minute delay
- On error: Available for retry until manually cleared
- On unmount: SSE connection closes automatically

## API Response Format

### Success Response
```json
{
  "text": "transcribed text...",
  "language": "en",
  "fileName": "video.mp4",
  "audioSizeMB": "12.34",
  "compressed": false,
  "scenes": [...],
  "jobId": "job_1234567890_abc123"
}
```

### Error Response
```json
{
  "error": "Error message",
  "jobId": "job_1234567890_abc123"
}
```

## Testing

To test the progress system:

1. Start a transcription request
2. Check progress updates at: `GET /api/progress?jobId={jobId}`
3. Verify progress stages update correctly
4. Test error recovery by interrupting the process
5. Test retry functionality

## Future Enhancements

- [ ] Persistent storage (Redis/database) for progress
- [ ] Resume from checkpoints
- [ ] Cache intermediate results
- [ ] Parallel processing for multiple files
- [ ] WebSocket for even faster updates

