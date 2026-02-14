# Testing AWS Lambda FFmpeg Clip Cutting

## Prerequisites

1. ✅ AWS account set up with credentials
2. ✅ Remotion Lambda already configured
3. ✅ AWS CLI installed and configured

## Step-by-Step Setup

### Step 1: Use Existing S3 Bucket

You already have a Remotion Lambda bucket: `remotionlambda-useast1-o5o2xdg7ne`

**Note**: This bucket is in `us-east-1` region. You have two options:

✅ **Using your existing bucket**: `remotionlambda-useast1-o5o2xdg7ne` (us-east-1)

**Note**: Since your bucket is in `us-east-1`, we'll deploy the Lambda function in the same region for best performance and lower costs. Cross-region access works but is slower and costs more.

### Step 2: Create IAM Role for Lambda

1. Go to IAM → Roles → Create role
2. Select "Lambda"
3. **Attach existing policy**:
   - ✅ `AWSLambdaBasicExecutionRole` (you already have this - it provides CloudWatch Logs access)
     - This policy allows: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
4. Click "Next" → Name the role: `lambda-ffmpeg-execution-role`
5. Click "Create role"
6. **Add S3 inline policy** (after role is created):
   - Click on the role you just created
   - Go to "Permissions" tab
   - Click "Add permissions" → "Create inline policy"
   - Select "JSON" tab
   - Paste this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::remotionlambda-useast1-o5o2xdg7ne/*"
       },
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::remotionlambda-useast1-o5o2xdg7ne"
       }
     ]
   }
   ```
   - Click "Next"
   - Name it: `S3AccessForRemotionBucket`
   - Click "Create policy"
7. **Copy the Role ARN** (you'll need it for deployment)
   - Format: `arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-ffmpeg-execution-role`

### Step 3: Deploy Lambda Function

**Important**: Deploy in `us-east-1` to match your S3 bucket region.

#### Option A: Using PowerShell Script (Windows)

1. Update `deploy.ps1` with your Account ID:
   ```powershell
   --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-ffmpeg-execution-role
   ```
   (The script is already configured for `us-east-1`)

2. Run deployment:
   ```powershell
   cd lambda-functions\ffmpeg-clip-cutter
   .\deploy.ps1
   ```

#### Option B: Manual Deployment

1. Package the function:
   ```bash
   cd lambda-functions/ffmpeg-clip-cutter
   npm install
   zip -r function.zip index.js node_modules/
   ```

2. Create Lambda function via AWS Console:
   - **Region**: `us-east-1` (to match your S3 bucket)
   - Function name: `ffmpeg-clip-cutter`
   - Runtime: Node.js 20.x
   - Architecture: x86_64
   - Handler: `index.handler`
   - Role: `lambda-ffmpeg-execution-role`
   - Timeout: 15 minutes (900 seconds)
   - Memory: 3008 MB

3. Upload `function.zip`

4. Add FFmpeg Layer:
   - Go to Layers → Add a layer
   - Use public layer ARN for us-east-1: `arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1`
   - Or search for "ffmpeg" in AWS Lambda Layers for us-east-1
   - Or create your own FFmpeg layer

### Step 4: Add Lambda Invoke Permission to IAM User

Your IAM user (`remotion_user`) needs permission to invoke Lambda functions:

1. Go to [IAM Users](https://console.aws.amazon.com/iam/home#/users)
2. Click on `remotion_user`
3. Go to "Permissions" tab
4. Click "Add permissions" → "Create inline policy"
5. Select "JSON" tab, paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["lambda:InvokeFunction"],
         "Resource": "arn:aws:lambda:us-east-1:281502313273:function:*"
       }
     ]
   }
   ```
6. Name: `LambdaInvokePermission` → Create policy

**Or** if you already have an inline policy, edit it and add the Lambda permission statement.

### Step 5: Configure Environment Variables

Add to your `.env` file:
```env
USE_LAMBDA_FOR_CLIPS=true
FFMPEG_LAMBDA_FUNCTION_NAME=ffmpeg-clip-cutter
AWS_S3_BUCKET=remotionlambda-useast1-o5o2xdg7ne
AWS_REGION=us-east-1
```

**Important**: Since your bucket is in `us-east-1`, you should:
- Deploy Lambda function in `us-east-1` region (or update bucket region)
- Update all region references to match

### Step 5: Update API Route

The API route at `/app/api/lambda/cut-clips/route.ts` is ready. Make sure it's using the correct bucket name.

## Testing

### Test 1: Direct Lambda Invocation

```bash
aws lambda invoke \
  --function-name ffmpeg-clip-cutter \
  --payload '{"body":"{\"videoUrl\":\"s3://remotionlambda-useast1-o5o2xdg7ne/input/test.mp4\",\"scenes\":[{\"id\":\"scene-1\",\"startTime\":0,\"endTime\":10}],\"jobId\":\"test\",\"fps\":30,\"bucketName\":\"remotionlambda-useast1-o5o2xdg7ne\",\"region\":\"us-east-1\"}"}' \
  --region us-east-1 \
  response.json

cat response.json
```

### Test 2: Via API Endpoint

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Test with curl:
   ```bash
   curl -X POST http://localhost:3000/api/lambda/cut-clips \
     -F "file=@test-video.mp4" \
     -F "scenes=[{\"id\":\"scene-1\",\"startTime\":0,\"endTime\":10,\"narration\":\"Test scene\"}]" \
     -F "jobId=test-job-123" \
     -F "fps=30"
   ```

3. Or use Postman/Thunder Client:
   - Method: POST
   - URL: `http://localhost:3000/api/lambda/cut-clips`
   - Body: form-data
   - Fields:
     - `file`: (file) your test video
     - `scenes`: (text) JSON array of scenes
     - `jobId`: (text) test-job-123
     - `fps`: (text) 30

### Test 3: From Frontend

The existing `processService.cutClipsAndPackageResults()` will automatically use the Lambda endpoint if you update the API endpoint:

```typescript
// In processService.ts, the CUT_CLIPS endpoint will now use Lambda
const response = await fetch(API_ENDPOINTS.CUT_CLIPS, {
  method: 'POST',
  body: formData
});
```

## Troubleshooting

### Issue: Lambda function not found
- Check function name in `.env`: `FFMPEG_LAMBDA_FUNCTION_NAME`
- Verify function exists in AWS Console

### Issue: FFmpeg not found
- Ensure FFmpeg layer is attached to Lambda function
- Check layer ARN is correct for your region

### Issue: S3 access denied
- Verify IAM role has S3 permissions
- Check bucket name matches in `.env`

### Issue: Timeout errors
- Increase Lambda timeout (max 15 minutes)
- Check video file size (Lambda has 10GB /tmp limit)

### Issue: Memory errors
- Increase Lambda memory (try 3008 MB)
- Check video resolution and length

## Monitoring

1. Check CloudWatch Logs:
   ```bash
   aws logs tail /aws/lambda/ffmpeg-clip-cutter --follow --region us-east-1
   ```

2. Check Lambda metrics in AWS Console:
   - Invocations
   - Errors
   - Duration
   - Throttles

## Cost Considerations

- Lambda: Pay per invocation + compute time
- S3: Storage + transfer costs
- FFmpeg processing: ~$0.0000166667 per GB-second

For 100 clips/month:
- Lambda: ~$0.10-0.50
- S3: ~$0.023 per GB stored

## Next Steps

1. ✅ Deploy Lambda function
2. ✅ Test with small video file
3. ✅ Verify clips are created in S3
4. ✅ Test from frontend
5. ✅ Monitor costs and performance
