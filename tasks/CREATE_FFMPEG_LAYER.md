# Create Your Own FFmpeg Lambda Layer

The public FFmpeg layer is not accessible. We'll create our own layer.

## Option 1: Use Pre-built FFmpeg Static Binary (Recommended)

### Step 1: Download FFmpeg Static Build

1. Download FFmpeg static build for Linux x86_64:
   - Go to: https://johnvansickle.com/ffmpeg/
   - Or direct link: https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
   - Extract the archive

2. Or use this PowerShell command:
   ```powershell
   # Download FFmpeg
   $url = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
   $output = "$PSScriptRoot\ffmpeg.tar.xz"
   Invoke-WebRequest -Uri $url -OutFile $output
   
   # Extract (requires 7zip or tar)
   # If you have 7zip:
   7z x ffmpeg.tar.xz
   7z x ffmpeg-release-amd64-static.tar
   ```

### Step 2: Create Layer Structure

Create this directory structure:
```
ffmpeg-layer/
  bin/
    ffmpeg
    ffprobe
```

The `ffmpeg` and `ffprobe` binaries should be from the extracted archive.

### Step 3: Create Layer ZIP

```powershell
cd ffmpeg-layer
Compress-Archive -Path bin -DestinationPath ../ffmpeg-layer.zip -Force
```

### Step 4: Upload to Lambda as Layer

1. Go to [Lambda Layers - us-east-1](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/layers)
2. Click "Create layer"
3. **Name**: `ffmpeg-layer`
4. **Upload**: Select `ffmpeg-layer.zip`
5. **Compatible runtimes**: Select "Node.js 20.x"
6. Click "Create"

### Step 5: Note the Layer ARN

After creation, copy the Layer ARN (format: `arn:aws:lambda:us-east-1:281502313273:layer:ffmpeg-layer:1`)

### Step 6: Add Layer to Function

1. Go to your Lambda function: `ffmpeg-clip-cutter`
2. Scroll to "Layers" section
3. Click "Add a layer"
4. Select "Custom layers"
5. Choose `ffmpeg-layer` from the dropdown
6. Click "Add"

## Option 2: Use AWS Serverless Application Repository

Some publicly available FFmpeg layers might be available in the AWS Serverless Application Repository.

1. Go to [Serverless Application Repository](https://serverlessrepo.aws.amazon.com/applications)
2. Search for "ffmpeg"
3. Deploy any available FFmpeg layer applications

## Option 3: Build from Source (Advanced)

If you need a specific FFmpeg build, you can compile it in an EC2 instance or Docker container matching Lambda's environment (Amazon Linux 2).

## Update Your Code

After creating the layer, update your Lambda function code to use FFmpeg:

```javascript
const ffmpegPath = '/opt/bin/ffmpeg'; // Lambda layer path
const ffprobePath = '/opt/bin/ffprobe';
```

The binaries will be available at `/opt/bin/` when the layer is attached.
