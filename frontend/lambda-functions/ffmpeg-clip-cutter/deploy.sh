#!/bin/bash

FUNCTION_NAME="ffmpeg-clip-cutter"
REGION="us-east-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
MEMORY_SIZE=3008
TIMEOUT=900

echo "Building Lambda function package..."
cd "$(dirname "$0")"
npm install
zip -r function.zip index.js node_modules/

echo "Creating/updating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime $RUNTIME \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler $HANDLER \
  --zip-file fileb://function.zip \
  --timeout $TIMEOUT \
  --memory-size $MEMORY_SIZE \
  --region $REGION \
  --environment Variables="{AWS_REGION=$REGION}" \
  2>/dev/null || \
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://function.zip \
  --region $REGION

echo "Adding FFmpeg layer..."
LAYER_ARN="arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1"
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --layers $LAYER_ARN \
  --region $REGION

echo "Function deployed successfully!"
echo "Function name: $FUNCTION_NAME"
echo "Region: $REGION"
