# Deploy Lambda Function: ffmpeg-clip-cutter

## Error
```
Function not found: arn:aws:lambda:us-east-1:281502313273:function:ffmpeg-clip-cutter:$LATEST
```

## Solution: Deploy the Lambda Function

### Option 1: Using PowerShell Script (Recommended)

1. **Open PowerShell** in the project directory
2. **Navigate to the function directory**:
   ```powershell
   cd frontend\lambda-functions\ffmpeg-clip-cutter
   ```

3. **Run the deployment script**:
   ```powershell
   .\deploy.ps1
   ```

The script will:
- Install dependencies (`npm install`)
- Create `function.zip` with the function code
- Create or update the Lambda function in AWS
- Add the FFmpeg layer

**Note**: Make sure you have:
- ✅ AWS CLI installed and configured
- ✅ IAM role `lambda-ffmpeg-execution-role` created
- ✅ Lambda invoke permission added to `remotion_user`

### Option 2: Manual Deployment via AWS Console

1. **Package the function**:
   ```powershell
   cd frontend\lambda-functions\ffmpeg-clip-cutter
   npm install
   Compress-Archive -Path index.js, node_modules -DestinationPath function.zip -Force
   ```

2. **Go to AWS Lambda Console**:
   - [Lambda Console - us-east-1](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions)

3. **Create Function**:
   - Click "Create function"
   - Select "Author from scratch"
   - **Function name**: `ffmpeg-clip-cutter`
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
   - **Execution role**: `lambda-ffmpeg-execution-role`
   - Click "Create function"

4. **Upload Code**:
   - Scroll down to "Code source"
   - Click "Upload from" → ".zip file"
   - Select `function.zip` from `lambda-functions/ffmpeg-clip-cutter/`
   - Click "Save"

5. **Configure Function**:
   - Go to "Configuration" tab → "General configuration"
   - Click "Edit"
   - **Timeout**: 15 minutes (900 seconds)
   - **Memory**: 3008 MB
   - Click "Save"

6. **Add FFmpeg Layer**:
   - Go to "Code" tab
   - Scroll to "Layers" section
   - Click "Add a layer"
   - Select "Specify a layer ARN"
   - Enter: `arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1`
   - Click "Add"

7. **Set Environment Variable**:
   - Go to "Configuration" tab → "Environment variables"
   - Click "Edit" → "Add environment variable"
   - Key: `AWS_REGION`
   - Value: `us-east-1`
   - Click "Save"

## Verify Deployment

After deployment, verify the function exists:

```powershell
aws lambda get-function --function-name ffmpeg-clip-cutter --region us-east-1
```

Or check in AWS Console:
- [Lambda Functions - us-east-1](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions)

## Test After Deployment

Once deployed, test your API again. The function should now be found.

## Troubleshooting

**Error: Role not found**
- Make sure `lambda-ffmpeg-execution-role` exists in IAM
- Check the role ARN in `deploy.ps1` matches your account ID

**Error: Layer not found**
- The FFmpeg layer ARN might be different for your region
- Try searching for "ffmpeg" in Lambda Layers
- Or create your own FFmpeg layer

**Error: Access denied**
- Make sure your AWS credentials have permission to create Lambda functions
- Check IAM user has `lambda:CreateFunction` permission
