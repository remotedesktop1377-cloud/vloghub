# Quick Start: AWS Lambda FFmpeg Setup

## Your Existing Setup

✅ **S3 Bucket**: `remotionlambda-useast1-o5o2xdg7ne` (us-east-1)  
✅ **AWS Credentials**: Already configured

## Quick Setup Steps

### 1. Create IAM Role (5 minutes)

1. Go to [IAM Console](https://console.aws.amazon.com/iam/) → Roles → Create role
2. Select "Lambda"
3. **Attach existing policy**:
   - ✅ `AWSLambdaBasicExecutionRole` (you already have this - provides CloudWatch Logs)
     - This gives: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
4. Click "Next" → Name: `lambda-ffmpeg-execution-role` → Create role
5. **Add S3 inline policy** (after role is created):
   - Click on the role → "Permissions" tab
   - Click "Add permissions" → "Create inline policy"
   - Select "JSON" tab, paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
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
   - Name: `S3AccessForRemotionBucket` → Create policy
6. **Copy the Role ARN** (format: `arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-ffmpeg-execution-role`)

### 2. Deploy Lambda Function (5 minutes)

```powershell
cd lambda-functions\ffmpeg-clip-cutter

# Update deploy.ps1 with your Account ID (from Role ARN)
# Replace YOUR_ACCOUNT_ID in the script

.\deploy.ps1
```

Or manually via AWS Console:
1. Go to [Lambda Console](https://console.aws.amazon.com/lambda/) → **us-east-1** region
2. Create function → "Author from scratch"
3. Name: `ffmpeg-clip-cutter`
4. Runtime: Node.js 20.x
5. Architecture: x86_64
6. Role: `lambda-ffmpeg-execution-role`
7. Timeout: 15 minutes
8. Memory: 3008 MB
9. Upload `function.zip` (from `lambda-functions/ffmpeg-clip-cutter/`)
10. Add Layer: `arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1`

### 3. Add Lambda Invoke Permission to IAM User ⚠️ IMPORTANT

Your IAM user needs permission to invoke Lambda functions:

1. Go to [IAM Users](https://console.aws.amazon.com/iam/home#/users) → Click `remotion_user`
2. "Permissions" tab → "Add permissions" → "Create inline policy"
3. JSON tab, paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["lambda:InvokeFunction"],
       "Resource": "arn:aws:lambda:us-east-1:281502313273:function:*"
     }]
   }
   ```
4. Name: `LambdaInvokePermission` → Create policy

### 4. Set Environment Variables

Add to your `.env` file:
```env
USE_LAMBDA_FOR_CLIPS=true
FFMPEG_LAMBDA_FUNCTION_NAME=ffmpeg-clip-cutter
AWS_S3_BUCKET=remotionlambda-useast1-o5o2xdg7ne
AWS_REGION=us-east-1
```

### 4. Test It!

```bash
# Test via API
curl -X POST http://localhost:3000/api/cut-clips \
  -F "file=@test-video.mp4" \
  -F "scenes=[{\"id\":\"scene-1\",\"startTime\":0,\"endTime\":10}]" \
  -F "jobId=test-job" \
  -F "fps=30"
```

## What Happens

1. Video uploaded to S3: `s3://remotionlambda-useast1-o5o2xdg7ne/input/...`
2. Lambda function invoked with clip instructions
3. FFmpeg cuts clips in Lambda
4. Clips uploaded to S3: `s3://remotionlambda-useast1-o5o2xdg7ne/clips/...`
5. Clip URLs returned to frontend

## Verify It Works

1. Check S3 bucket: [View Bucket](https://us-east-1.console.aws.amazon.com/s3/buckets/remotionlambda-useast1-o5o2xdg7ne)
2. Check Lambda logs: [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups)
3. Test from your frontend UI

## Troubleshooting

**Function not found?**
- Check function name in `.env`
- Verify function exists in **us-east-1** region

**FFmpeg not found?**
- Ensure layer is attached: `arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1`

**S3 access denied?**
- Check IAM role has S3 permissions for `remotionlambda-useast1-o5o2xdg7ne`

**Timeout errors?**
- Increase Lambda timeout (max 15 minutes)
- Check video file size

## Next Steps

Once working, you can:
- Monitor costs in AWS Cost Explorer
- Set up CloudWatch alarms for errors
- Optimize memory/timeout settings based on usage
