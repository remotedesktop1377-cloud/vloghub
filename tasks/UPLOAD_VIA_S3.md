# Upload FFmpeg Layer via S3 (For Files > 50 MB)

Since your FFmpeg layer exceeds the 50 MB direct upload limit, upload it via S3:

## Step 1: Upload ZIP to S3

```powershell
cd d:\Projects\vloghub\frontend\lambda-functions\ffmpeg-clip-cutter

# Upload to your existing S3 bucket
aws s3 cp ffmpeg-layer.zip s3://remotionlambda-useast1-o5o2xdg7ne/layers/ffmpeg-layer.zip
```

**Note**: If you don't have AWS CLI, you can upload via AWS Console:
1. Go to [S3 Console](https://s3.console.aws.amazon.com/s3/buckets/remotionlambda-useast1-o5o2xdg7ne)
2. Navigate to or create a `layers/` folder
3. Click "Upload" → Select `ffmpeg-layer.zip`
4. Click "Upload"

## Step 2: Create Layer from S3

1. Go to [Lambda Layers - us-east-1](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/layers)

2. Click "Create layer"

3. Fill in the form:
   - **Name**: `ffmpeg-layer`
   - **Upload method**: Select **"Upload a file from Amazon S3"**
   - **S3 link URL**: 
     ```
     s3://remotionlambda-useast1-o5o2xdg7ne/layers/ffmpeg-layer.zip
     ```
   - **Compatible runtimes**: Select "Node.js 20.x"

4. Click "Create"

## Step 3: Add Layer to Function

1. Go to your Lambda function: `ffmpeg-clip-cutter`
2. Scroll to "Layers" section
3. Click "Add a layer"
4. Select "Custom layers"
5. Choose `ffmpeg-layer` from dropdown
6. Click "Add"

## Alternative: Use a Smaller FFmpeg Build

If you want to stay under 50 MB, consider:

1. **Use a minimal FFmpeg build**:
   - Download from: https://github.com/eugeneware/ffmpeg-static/releases
   - These builds are optimized for size

2. **Strip the binaries** (requires Linux/WSL):
   ```bash
   strip ffmpeg-layer/bin/ffmpeg
   strip ffmpeg-layer/bin/ffprobe
   ```

3. **Use AWS Marketplace layers**:
   - Search for "FFmpeg" in AWS Lambda Layers marketplace
   - Some are publicly available and optimized
