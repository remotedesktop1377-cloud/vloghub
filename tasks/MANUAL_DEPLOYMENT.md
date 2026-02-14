# Manual Lambda Function Deployment

Since AWS CLI is not installed, here's how to deploy manually:

## Step 1: Create the Function Package

The `function.zip` file should already be created. If not, run:
```powershell
cd d:\Projects\vloghub\frontend\lambda-functions\ffmpeg-clip-cutter
npm install
Compress-Archive -Path index.js, node_modules -DestinationPath function.zip -Force
```

**Note**: If you get file locking errors, close any programs using node_modules (VS Code, terminals, etc.) and try again.

## Step 2: Deploy via AWS Console

1. **Go to Lambda Console**:
   - [Create Function - us-east-1](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/create)

2. **Create Function**:
   - Click "Create function"
   - Select "Author from scratch"
   - **Function name**: `ffmpeg-clip-cutter`
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
   - **Execution role**: `lambda-ffmpeg-execution-role`
   - Click "Create function"

3. **Upload Code**:
   - Scroll to "Code source" section
   - Click "Upload from" → ".zip file"
   - Select `function.zip` from `d:\Projects\vloghub\frontend\lambda-functions\ffmpeg-clip-cutter\`
   - Click "Save"

4. **Configure Function**:
   - Go to "Configuration" tab → "General configuration"
   - Click "Edit"
   - **Timeout**: 15 minutes (900 seconds)
   - **Memory**: 3008 MB
   - Click "Save"

5. **Add Environment Variable**:
   - Go to "Configuration" tab → "Environment variables"
   - Click "Edit" → "Add environment variable"
   - Key: `AWS_REGION`
   - Value: `us-east-1`
   - Click "Save"

6. **Add FFmpeg Layer**:
   - Go to "Code" tab
   - Scroll to "Layers" section
   - Click "Add a layer"
   - Select "Specify a layer ARN"
   - Enter: `arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1`
   - Click "Add"

## Step 3: Verify Deployment

1. Go to [Lambda Functions](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions)
2. You should see `ffmpeg-clip-cutter` in the list
3. Click on it to verify configuration

## Alternative: Install AWS CLI

If you want to use the deployment script:

1. **Install AWS CLI**:
   ```powershell
   winget install Amazon.AWSCLI
   ```
   Or download from: https://aws.amazon.com/cli/

2. **Configure AWS CLI**:
   ```powershell
   aws configure
   ```
   Enter your:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `us-east-1`
   - Default output format: `json`

3. **Run deployment script again**:
   ```powershell
   .\deploy.ps1
   ```
