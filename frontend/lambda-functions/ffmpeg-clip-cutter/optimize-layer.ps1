$ErrorActionPreference = "Continue"

Write-Host "Optimizing FFmpeg Layer for Lambda (50 MB limit)..." -ForegroundColor Cyan

$layerDir = Join-Path $PSScriptRoot "ffmpeg-layer"
$binDir = Join-Path $layerDir "bin"
$zipFile = Join-Path $PSScriptRoot "ffmpeg-layer-optimized.zip"

if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

if (-not (Test-Path $binDir)) {
    Write-Host "✗ ffmpeg-layer\bin not found. Please create the layer first." -ForegroundColor Red
    exit 1
}

Write-Host "Checking current sizes..." -ForegroundColor Cyan
$ffmpegPath = Join-Path $binDir "ffmpeg"
$ffprobePath = Join-Path $binDir "ffprobe"

if (Test-Path $ffmpegPath) {
    $ffmpegSize = (Get-Item $ffmpegPath).Length / 1MB
    Write-Host "  ffmpeg: $([math]::Round($ffmpegSize, 2)) MB" -ForegroundColor White
}

if (Test-Path $ffprobePath) {
    $ffprobeSize = (Get-Item $ffprobePath).Length / 1MB
    Write-Host "  ffprobe: $([math]::Round($ffprobeSize, 2)) MB" -ForegroundColor White
}

Write-Host ""
Write-Host "Option 1: Use a smaller FFmpeg build (Recommended)" -ForegroundColor Yellow
Write-Host "  Download a minimal FFmpeg build from:" -ForegroundColor White
Write-Host "  https://github.com/eugeneware/ffmpeg-static/releases" -ForegroundColor Cyan
Write-Host "  Or use a pre-built Lambda layer from AWS Marketplace" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Strip binaries (if on Linux/WSL)" -ForegroundColor Yellow
Write-Host "  If you have access to Linux or WSL, you can strip the binaries:" -ForegroundColor White
Write-Host "  strip ffmpeg-layer/bin/ffmpeg" -ForegroundColor Cyan
Write-Host "  strip ffmpeg-layer/bin/ffprobe" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 3: Use UPX compression (may not work in Lambda)" -ForegroundColor Yellow
Write-Host "  UPX can compress binaries but may cause issues in Lambda" -ForegroundColor White
Write-Host ""

Write-Host "Option 4: Upload via S3 (for files > 50 MB)" -ForegroundColor Yellow
Write-Host "  Lambda allows uploading layers from S3 for larger files" -ForegroundColor White
Write-Host ""

$totalSize = 0
if (Test-Path $ffmpegPath) { $totalSize += (Get-Item $ffmpegPath).Length }
if (Test-Path $ffprobePath) { $totalSize += (Get-Item $ffprobePath).Length }
$totalSizeMB = $totalSize / 1MB

Write-Host "Current total size: $([math]::Round($totalSizeMB, 2)) MB" -ForegroundColor Cyan

if ($totalSizeMB -gt 50) {
    Write-Host ""
    Write-Host "⚠ Layer exceeds 50 MB limit. Use S3 upload method:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Upload ffmpeg-layer.zip to S3:" -ForegroundColor White
    Write-Host "   aws s3 cp ffmpeg-layer.zip s3://YOUR-BUCKET/ffmpeg-layer.zip" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Create layer from S3:" -ForegroundColor White
    Write-Host "   - In Lambda Console, select 'Upload a file from Amazon S3'" -ForegroundColor Cyan
    Write-Host "   - Enter S3 link: s3://YOUR-BUCKET/ffmpeg-layer.zip" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Creating optimized ZIP..." -ForegroundColor Cyan
    
    if (Get-Command "7z" -ErrorAction SilentlyContinue) {
        Push-Location $layerDir
        & 7z a -tzip $zipFile bin -mx=9 2>&1 | Out-Null
        Pop-Location
    } else {
        Compress-Archive -Path (Join-Path $layerDir "bin") -DestinationPath $zipFile -Force
    }
    
    if (Test-Path $zipFile) {
        $zipSize = (Get-Item $zipFile).Length / 1MB
        Write-Host "✓ Optimized ZIP created: $zipFile ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
        
        if ($zipSize -gt 50) {
            Write-Host "⚠ Still exceeds 50 MB. Use S3 upload method above." -ForegroundColor Yellow
        } else {
            Write-Host "✓ Ready to upload to Lambda!" -ForegroundColor Green
        }
    }
}
