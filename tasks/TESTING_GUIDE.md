# Testing Guide: FFmpeg Lambda Function

## Step 1: Verify Lambda Function Setup

### Check Function Deployment

1. Go to [Lambda Functions - us-east-1](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions)
2. Find `ffmpeg-clip-cutter`
3. Verify:
   - ✅ Function exists
   - ✅ Runtime: Node.js 20.x
   - ✅ Handler: `index.handler`
   - ✅ Timeout: 15 minutes (900 seconds)
   - ✅ Memory: 3008 MB
   - ✅ Environment variable `AWS_REGION` = `us-east-1`

### Check Layer Attachment

1. In the function page, scroll to "Layers" section
2. Verify:
   - ✅ `ffmpeg-layer` is listed
   - ✅ Layer version is shown

### Check IAM Role

1. Go to "Configuration" → "Permissions"
2. Verify:
   - ✅ Execution role: `lambda-ffmpeg-execution-role`
   - ✅ Role has S3 read/write permissions

## Step 2: Test Lambda Function Directly

### Test via AWS Console

1. Go to your `ffmpeg-clip-cutter` function
2. Click "Test" tab
3. Create a new test event with this JSON (direct object format):

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

4. Click "Test"
5. Check the response:
   - ✅ Status code: 200
   - ✅ Response contains `scenes` array
   - ✅ Response contains `clipUrls` array

**Note**: This requires a test video file in your S3 bucket at `s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4`

**To upload a test video:**
```powershell
# Option 1: Use the helper script
.\upload-test-video.ps1 C:\path\to\your\video.mp4

# Option 2: Use AWS CLI directly
aws s3 cp your-video.mp4 s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4 --region us-east-1

# Option 3: Upload via AWS Console
# Go to: https://s3.console.aws.amazon.com/s3/buckets/remotionlambda-useast1-o5o2xdg7ne
# Click "Upload" → Select your video → Set key to "test-video.mp4" → Upload
```

**Important**: After updating the function code, you need to upload the new `function.zip` to Lambda.

## Step 3: Test via API Endpoint

### Prerequisites

1. Make sure your Next.js app is running:
   ```powershell
   cd d:\Projects\vloghub\frontend
   npm run dev
   ```

2. Set environment variable (if not already set):
   ```powershell
   # In your .env file
   USE_LAMBDA_FOR_CLIPS=true
   AWS_S3_BUCKET=remotionlambda-useast1-o5o2xdg7ne
   AWS_REGION=us-east-1
   ```

### Test with cURL

```powershell
# Upload a test video first to S3, then:
curl -X POST http://localhost:3000/api/lambda/cut-clips `
  -H "Content-Type: application/json" `
  -d '{
    "videoUrl": "s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4",
    "scenes": [
      {"id": "scene-1", "startTime": 0, "endTime": 10},
      {"id": "scene-2", "startTime": 10, "endTime": 20}
    ],
    "jobId": "test-job-123",
    "fps": 30
  }'
```

### Test via Frontend

If you have a UI component that calls this API, test it through the frontend interface.

## Step 4: Check CloudWatch Logs

### View Logs

1. Go to your Lambda function
2. Click "Monitor" tab → "View CloudWatch logs"
3. Check for:
   - ✅ No errors
   - ✅ FFmpeg commands executing
   - ✅ Clips being uploaded to S3

### Common Issues to Check

- **"ffmpeg: command not found"**: Layer not attached correctly
- **"Access Denied"**: IAM role missing S3 permissions
- **"Function timeout"**: Video too long or memory insufficient
- **"Invalid S3 URL"**: Check video URL format

## Step 5: Verify Output

### Check S3 Bucket

1. Go to [S3 Console](https://s3.console.aws.amazon.com/s3/buckets/remotionlambda-useast1-o5o2xdg7ne)
2. Navigate to `clips/` folder
3. Verify:
   - ✅ Clips are created under `clips/{jobId}/`
   - ✅ Files are `.mp4` format
   - ✅ Files have reasonable sizes

### Verify Clip URLs

The API response should include `clipUrls` array with S3 URLs. Verify:
- ✅ URLs are accessible
- ✅ Videos play correctly
- ✅ Clips match the requested time ranges

## Step 6: Performance Testing

### Test with Different Video Sizes

1. Small video (< 1 minute)
2. Medium video (1-5 minutes)
3. Large video (5+ minutes)

### Monitor Metrics

In Lambda Console → "Monitor" tab, check:
- ✅ Duration (should be reasonable)
- ✅ Memory usage
- ✅ Error rate (should be 0%)
- ✅ Throttles (should be 0)

## Troubleshooting

### Function Not Found
- Verify function is deployed in `us-east-1`
- Check function name matches exactly

### Layer Not Found
- Verify layer is created and attached
- Check layer is in same region (`us-east-1`)

### FFmpeg Not Working
- Check CloudWatch logs for errors
- Verify layer path: `/opt/bin/ffmpeg`
- Test FFmpeg directly in Lambda test event

### S3 Access Issues
- Verify IAM role has S3 permissions
- Check bucket name matches
- Verify bucket is in same region

## Quick Test Script

Save this as `test-lambda.ps1`:

```powershell
$testEvent = @{
    body = '{"videoUrl":"s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4","scenes":[{"id":"scene-1","startTime":0,"endTime":10}],"jobId":"test-123","fps":30,"bucketName":"remotionlambda-useast1-o5o2xdg7ne","region":"us-east-1"}'
} | ConvertTo-Json

Write-Host "Testing Lambda function..." -ForegroundColor Cyan
aws lambda invoke `
    --function-name ffmpeg-clip-cutter `
    --region us-east-1 `
    --payload $testEvent `
    response.json

Write-Host "Response:" -ForegroundColor Green
Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Run with:
```powershell
.\test-lambda.ps1
```
