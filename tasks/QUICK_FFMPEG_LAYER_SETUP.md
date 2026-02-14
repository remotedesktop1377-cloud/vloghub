# Quick FFmpeg Layer Setup

The public FFmpeg layer is not accessible. Create your own layer using one of these methods:

## Method 1: Automated Script (Easiest)

Run the PowerShell script:

```powershell
cd d:\Projects\vloghub\frontend\lambda-functions\ffmpeg-clip-cutter
.\create-ffmpeg-layer.ps1
```

This will:
1. Download FFmpeg static build
2. Extract it
3. Create the layer ZIP file
4. Provide instructions for uploading

## Method 2: Manual Download

1. **Download FFmpeg**:
   - Go to: https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
   - Or use direct download:
     ```powershell
     Invoke-WebRequest -Uri "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -OutFile "ffmpeg.tar.xz"
     ```

2. **Extract** (requires 7zip or tar):
   ```powershell
   # Using 7zip
   7z x ffmpeg.tar.xz
   7z x ffmpeg-release-amd64-static.tar
   
   # Or using tar (if available)
   tar -xf ffmpeg.tar.xz
   tar -xf ffmpeg-release-amd64-static.tar
   ```

3. **Create layer structure**:
   ```powershell
   New-Item -ItemType Directory -Path "ffmpeg-layer\bin" -Force
   Copy-Item "ffmpeg-*-static\ffmpeg" "ffmpeg-layer\bin\"
   Copy-Item "ffmpeg-*-static\ffprobe" "ffmpeg-layer\bin\"
   ```

4. **Create ZIP**:
   ```powershell
   Compress-Archive -Path "ffmpeg-layer\bin" -DestinationPath "ffmpeg-layer.zip" -Force
   ```

## Upload to AWS Lambda

1. **Go to Lambda Layers**:
   - [Create Layer - us-east-1](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/layers)

2. **Create Layer**:
   - Click "Create layer"
   - **Name**: `ffmpeg-layer`
   - **Upload**: Select `ffmpeg-layer.zip`
   - **Compatible runtimes**: Select "Node.js 20.x"
   - Click "Create"

3. **Copy Layer ARN**:
   - After creation, copy the Layer ARN
   - Format: `arn:aws:lambda:us-east-1:281502313273:layer:ffmpeg-layer:1`

## Add Layer to Your Function

1. Go to your Lambda function: `ffmpeg-clip-cutter`
2. Scroll to "Layers" section
3. Click "Add a layer"
4. Select "Custom layers"
5. Choose `ffmpeg-layer` from dropdown
6. Select version `1` (or latest)
7. Click "Add"

## Update Function Code

The function code has been updated to use `/opt/bin/ffmpeg` (the Lambda layer path).

If you need to rebuild the function package:
```powershell
npm run create-zip
```

Then upload the new `function.zip` to your Lambda function.

## Verify

After adding the layer, test your function. FFmpeg should be available at `/opt/bin/ffmpeg`.
