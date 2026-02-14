# Update Lambda Function Code

After fixing the JSON parsing issue, you need to update the function in AWS.

## Quick Update Steps

### Option 1: Via AWS Console (Easiest)

1. **Package the function** (already done):
   ```powershell
   cd d:\Projects\vloghub\frontend\lambda-functions\ffmpeg-clip-cutter
   npm run create-zip
   ```
   This creates `function.zip` (5.74 MB)

2. **Upload to Lambda**:
   - Go to [Lambda Function](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/ffmpeg-clip-cutter)
   - Scroll to "Code source" section
   - Click "Upload from" → ".zip file"
   - Select `function.zip` from `d:\Projects\vloghub\frontend\lambda-functions\ffmpeg-clip-cutter\`
   - Click "Save"

3. **Test again** with the corrected test event format

### Option 2: Via AWS CLI (if installed)

```powershell
cd d:\Projects\vloghub\frontend\lambda-functions\ffmpeg-clip-cutter
aws lambda update-function-code `
  --function-name ffmpeg-clip-cutter `
  --region us-east-1 `
  --zip-file fileb://function.zip
```

## What Was Fixed

The Lambda function now properly handles different event formats:
- Direct object (when testing via AWS Console)
- JSON string (when invoked via SDK)
- API Gateway format (with `body` property)

## Test After Update

Use this test event in AWS Console:

```json
{
  "videoUrl": "s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4",
  "scenes": [
    {
      "id": "scene-1",
      "startTime": 0,
      "endTime": 10
    }
  ],
  "jobId": "test-job-123",
  "fps": 30,
  "bucketName": "remotionlambda-useast1-o5o2xdg7ne",
  "region": "us-east-1"
}
```

The function should now work correctly!
