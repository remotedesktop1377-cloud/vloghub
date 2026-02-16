Write-Host "=== FFmpeg Lambda Function Quick Test ===" -ForegroundColor Cyan
Write-Host ""

$functionName = "ffmpeg-clip-cutter"
$region = "us-east-1"

Write-Host "1. Checking Lambda function exists..." -ForegroundColor Yellow
try {
    $function = aws lambda get-function --function-name $functionName --region $region 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Function exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Function not found" -ForegroundColor Red
        Write-Host "   Please deploy the function first" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ✗ Error checking function: $_" -ForegroundColor Red
    Write-Host "   Make sure AWS CLI is installed and configured" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Checking function configuration..." -ForegroundColor Yellow
$config = aws lambda get-function-configuration --function-name $functionName --region $region 2>&1 | ConvertFrom-Json

if ($config.Layers.Count -gt 0) {
    Write-Host "   ✓ Layer attached: $($config.Layers[0])" -ForegroundColor Green
} else {
    Write-Host "   ⚠ No layers attached" -ForegroundColor Yellow
    Write-Host "   Please attach the FFmpeg layer" -ForegroundColor Yellow
}

Write-Host "   Runtime: $($config.Runtime)" -ForegroundColor White
Write-Host "   Memory: $($config.MemorySize) MB" -ForegroundColor White
Write-Host "   Timeout: $($config.Timeout) seconds" -ForegroundColor White

Write-Host ""
Write-Host "3. Testing function with sample payload..." -ForegroundColor Yellow

$testPayload = @{
    videoUrl = "s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4"
    scenes = @(
        @{
            id = "scene-1"
            startTime = 0
            endTime = 10
        }
    )
    jobId = "test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    fps = 30
    bucketName = "remotionlambda-useast1-o5o2xdg7ne"
    region = "us-east-1"
} | ConvertTo-Json -Depth 10

$testPayload | Out-File -FilePath "test-payload.json" -Encoding utf8

Write-Host "   Note: This requires a test video at s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4" -ForegroundColor Yellow
Write-Host "   To test, run:" -ForegroundColor Cyan
Write-Host "   aws lambda invoke --function-name $functionName --region $region --payload file://test-payload.json response.json" -ForegroundColor White
Write-Host ""

Write-Host "4. Checking API endpoint..." -ForegroundColor Yellow
Write-Host "   Make sure your Next.js app is running:" -ForegroundColor White
Write-Host "   cd d:\Projects\vloghub\frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Then test with:" -ForegroundColor White
Write-Host "   curl -X POST http://localhost:3000/api/lambda/cut-clips -F `"file=@test-video.mp4`" -F `"scenes=[{\`"id\`":\`"scene-1\`",\`"startTime\`":0,\`"endTime\`":10}]`" -F `"jobId=test-123`" -F `"fps=30`"" -ForegroundColor Cyan
Write-Host ""

Write-Host "5. Check CloudWatch Logs:" -ForegroundColor Yellow
Write-Host "   https://console.aws.amazon.com/cloudwatch/home?region=$region#logsV2:log-groups/log-group/%2Faws%2Flambda%2F$functionName" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload a test video to S3: s3://remotionlambda-useast1-o5o2xdg7ne/test-video.mp4" -ForegroundColor White
Write-Host "2. Test the Lambda function directly (see command above)" -ForegroundColor White
Write-Host "3. Test via API endpoint (see command above)" -ForegroundColor White
Write-Host "4. Check CloudWatch logs for any errors" -ForegroundColor White
