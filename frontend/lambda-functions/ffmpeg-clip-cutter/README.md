# FFmpeg Clip Cutter Lambda Function

This Lambda function cuts video segments using FFmpeg.

## Setup Instructions

### 1. Install FFmpeg Layer

You need to add an FFmpeg layer to your Lambda function. Use one of these public layers:

**Option 1: Use public FFmpeg layer (Recommended)**
- Layer ARN for us-east-1: `arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1`
- Or search for "ffmpeg" in AWS Lambda Layers for your region

**Option 2: Create your own layer**
1. Download FFmpeg static build for Linux x86_64
2. Create a layer with structure:
   ```
   layer/
     bin/
       ffmpeg
       ffprobe
   ```
3. Upload as Lambda layer

### 2. Deploy the Function

```bash
cd lambda-functions/ffmpeg-clip-cutter
npm install
zip -r function.zip index.js node_modules/
```

Then upload to AWS Lambda:
- **Region**: us-east-1 (to match your S3 bucket)
- Runtime: Node.js 18.x or 20.x
- Handler: index.handler
- **Role**: `lambda-ffmpeg-execution-role` (with AWSLambdaBasicExecutionRole + S3 inline policy)
- Timeout: 15 minutes (900 seconds)
- Memory: 3008 MB (recommended for FFmpeg)
- Add FFmpeg layer: `arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1`
- Environment variables:
  - `AWS_REGION`: us-east-1

### 3. Set Environment Variable

Add to your `.env` file:
```
USE_LAMBDA_FOR_CLIPS=true
FFMPEG_LAMBDA_FUNCTION_NAME=ffmpeg-clip-cutter
AWS_S3_BUCKET=remotionlambda-useast1-o5o2xdg7ne
AWS_REGION=us-east-1
```

### 4. Use Existing S3 Bucket

You already have a Remotion Lambda bucket: `remotionlambda-useast1-o5o2xdg7ne`

No need to create a new bucket - we'll use this one for storing clips.

## Testing

### Test Locally (if you have FFmpeg installed)

```bash
node test.js
```

### Test via API

```bash
curl -X POST http://localhost:3000/api/lambda/cut-clips \
  -F "file=@test-video.mp4" \
  -F "scenes=[{\"id\":\"scene-1\",\"startTime\":0,\"endTime\":10}]" \
  -F "jobId=test-job"
```

## Function Requirements

- **Memory**: 3008 MB (for FFmpeg processing)
- **Timeout**: 15 minutes (for long videos)
- **Layer**: FFmpeg layer must be attached
- **Permissions**: S3 read/write access
