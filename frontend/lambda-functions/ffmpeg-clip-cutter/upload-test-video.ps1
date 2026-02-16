Write-Host "Upload Test Video to S3" -ForegroundColor Cyan
Write-Host ""

$bucketName = "remotionlambda-useast1-o5o2xdg7ne"
$region = "us-east-1"
$testVideoPath = ""

Write-Host "This script will help you upload a test video to S3." -ForegroundColor Yellow
Write-Host ""

if ($args.Count -gt 0) {
    $testVideoPath = $args[0]
} else {
    Write-Host "Please provide the path to your test video file:" -ForegroundColor Yellow
    Write-Host "Example: .\upload-test-video.ps1 C:\Videos\test.mp4" -ForegroundColor White
    Write-Host ""
    Write-Host "Or enter the path now:" -ForegroundColor Cyan
    $testVideoPath = Read-Host "Video file path"
}

if (-not (Test-Path $testVideoPath)) {
    Write-Host "✗ File not found: $testVideoPath" -ForegroundColor Red
    exit 1
}

$fileName = Split-Path $testVideoPath -Leaf
$s3Key = "test-video.mp4"

Write-Host ""
Write-Host "Uploading to S3..." -ForegroundColor Cyan
Write-Host "  Bucket: $bucketName" -ForegroundColor White
Write-Host "  Key: $s3Key" -ForegroundColor White
Write-Host "  Region: $region" -ForegroundColor White
Write-Host ""

try {
    aws s3 cp $testVideoPath "s3://$bucketName/$s3Key" --region $region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Video uploaded successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "S3 URL: s3://$bucketName/$s3Key" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "You can now test the Lambda function with:" -ForegroundColor Yellow
        Write-Host '  {"videoUrl":"s3://' + "$bucketName/$s3Key" + '","scenes":[{"id":"scene-1","startTime":0,"endTime":10}],"jobId":"test-123","fps":30,"bucketName":"' + "$bucketName" + '","region":"' + "$region" + '"}' -ForegroundColor White
    } else {
        Write-Host "✗ Upload failed. Make sure AWS CLI is configured." -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative: Upload via AWS Console:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://s3.console.aws.amazon.com/s3/buckets/$bucketName" -ForegroundColor White
        Write-Host "2. Click 'Upload'" -ForegroundColor White
        Write-Host "3. Select your video file" -ForegroundColor White
        Write-Host "4. Set object key to: $s3Key" -ForegroundColor White
        Write-Host "5. Click 'Upload'" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Upload via AWS Console instead:" -ForegroundColor Yellow
    Write-Host "https://s3.console.aws.amazon.com/s3/buckets/$bucketName" -ForegroundColor Cyan
}
