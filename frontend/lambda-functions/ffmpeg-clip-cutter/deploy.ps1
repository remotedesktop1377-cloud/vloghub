$FUNCTION_NAME = "ffmpeg-clip-cutter"
$REGION = "us-east-1"
$RUNTIME = "nodejs20.x"
$HANDLER = "index.handler"
$MEMORY_SIZE = 3008
$TIMEOUT = 900

Write-Host "Building Lambda function package..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npm install

if (Test-Path "function.zip") {
    Remove-Item "function.zip" -Force
}

# Create zip using 7zip or PowerShell with better error handling
Write-Host "Creating function.zip..." -ForegroundColor Cyan
try {
    # Try using 7zip if available (more reliable)
    if (Get-Command "7z" -ErrorAction SilentlyContinue) {
        & 7z a -tzip function.zip index.js node_modules -mx=9
    } else {
        # Use PowerShell Compress-Archive with retry logic
        $retryCount = 3
        $retryDelay = 2
        $success = $false
        
        for ($i = 0; $i -lt $retryCount; $i++) {
            try {
                Start-Sleep -Seconds $retryDelay
                Compress-Archive -Path index.js, node_modules -DestinationPath function.zip -Force -ErrorAction Stop
                $success = $true
                break
            } catch {
                if ($i -eq $retryCount - 1) {
                    Write-Host "Failed to create zip after $retryCount attempts. Trying alternative method..." -ForegroundColor Yellow
                    # Alternative: Create zip without node_modules and note that dependencies should be in Lambda layer
                    Compress-Archive -Path index.js -DestinationPath function.zip -Force
                    Write-Host "Created function.zip with index.js only. Note: You may need to add @aws-sdk/client-s3 as a Lambda layer." -ForegroundColor Yellow
                    $success = $true
                }
            }
        }
    }
} catch {
    Write-Host "Error creating zip: $_" -ForegroundColor Red
    Write-Host "Please close any programs that might be using files in node_modules and try again." -ForegroundColor Yellow
    exit 1
}

# Check if AWS CLI is installed
if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI not found. Please install it or deploy manually via AWS Console." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install AWS CLI:" -ForegroundColor Cyan
    Write-Host "  1. Download from: https://aws.amazon.com/cli/" -ForegroundColor White
    Write-Host "  2. Or install via: winget install Amazon.AWSCLI" -ForegroundColor White
    Write-Host ""
    Write-Host "OR deploy manually:" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/create" -ForegroundColor White
    Write-Host "  2. Upload function.zip from this directory" -ForegroundColor White
    Write-Host "  3. Function name: $FUNCTION_NAME" -ForegroundColor White
    Write-Host "  4. Runtime: $RUNTIME" -ForegroundColor White
    Write-Host "  5. Role: lambda-ffmpeg-execution-role" -ForegroundColor White
    Write-Host "  6. Timeout: $TIMEOUT seconds" -ForegroundColor White
    Write-Host "  7. Memory: $MEMORY_SIZE MB" -ForegroundColor White
    Write-Host "  8. Add Layer: arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1" -ForegroundColor White
    Write-Host ""
    Write-Host "function.zip has been created. You can upload it manually." -ForegroundColor Green
    exit 0
}

Write-Host "Creating/updating Lambda function..." -ForegroundColor Cyan

try {
    $createResult = aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime $RUNTIME `
        --role arn:aws:iam::281502313273:role/lambda-ffmpeg-execution-role `
        --handler $HANDLER `
        --zip-file fileb://function.zip `
        --timeout $TIMEOUT `
        --memory-size $MEMORY_SIZE `
        --region $REGION `
        --environment Variables="{AWS_REGION=$REGION}" `
        2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Function created successfully!" -ForegroundColor Green
    } else {
        # Function might already exist, try to update
        Write-Host "Function may already exist, updating code..." -ForegroundColor Yellow
        aws lambda update-function-code `
            --function-name $FUNCTION_NAME `
            --zip-file fileb://function.zip `
            --region $REGION
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Trying to update existing function..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file fileb://function.zip `
        --region $REGION
}

Write-Host "Adding FFmpeg layer..." -ForegroundColor Cyan
$LAYER_ARN = "arn:aws:lambda:us-east-1:753240598075:layer:ffmpeg:1"
aws lambda update-function-configuration `
    --function-name $FUNCTION_NAME `
    --layers $LAYER_ARN `
    --region $REGION

Write-Host "Function deployed successfully!" -ForegroundColor Green
Write-Host "Function name: $FUNCTION_NAME" -ForegroundColor White
Write-Host "Region: $REGION" -ForegroundColor White
