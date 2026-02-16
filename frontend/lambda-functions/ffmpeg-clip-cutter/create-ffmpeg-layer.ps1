$ErrorActionPreference = "Continue"

Write-Host "Creating FFmpeg Lambda Layer..." -ForegroundColor Cyan

$layerDir = Join-Path $PSScriptRoot "ffmpeg-layer"
$binDir = Join-Path $layerDir "bin"
$zipFile = Join-Path $PSScriptRoot "ffmpeg-layer.zip"

if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

if (Test-Path $layerDir) {
    Remove-Item $layerDir -Recurse -Force
}

New-Item -ItemType Directory -Path $binDir -Force | Out-Null

Write-Host "Downloading FFmpeg static build..." -ForegroundColor Cyan
$ffmpegUrl = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
$tarFile = Join-Path $PSScriptRoot "ffmpeg.tar.xz"
$extractDir = Join-Path $PSScriptRoot "ffmpeg-extract"

if (Test-Path $tarFile) {
    Remove-Item $tarFile -Force
}
if (Test-Path $extractDir) {
    Remove-Item $extractDir -Recurse -Force
}

try {
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $tarFile -UseBasicParsing
    Write-Host "✓ Downloaded FFmpeg" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download FFmpeg: $_" -ForegroundColor Red
    Write-Host "Please download manually from: $ffmpegUrl" -ForegroundColor Yellow
    exit 1
}

Write-Host "Extracting archive..." -ForegroundColor Cyan

$extracted = $false

if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
    Push-Location $extractDir
    & 7z x $tarFile 2>&1 | Out-Null
    $tarFile2 = Get-ChildItem -Filter "*.tar" | Select-Object -First 1
    if ($tarFile2) {
        & 7z x $tarFile2.FullName 2>&1 | Out-Null
        $extracted = $true
    }
    Pop-Location
} elseif (Get-Command "tar" -ErrorAction SilentlyContinue) {
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
    Push-Location $extractDir
    tar -xf $tarFile 2>&1 | Out-Null
    $tarFile2 = Get-ChildItem -Filter "*.tar" | Select-Object -First 1
    if ($tarFile2) {
        tar -xf $tarFile2.FullName 2>&1 | Out-Null
        $extracted = $true
    }
    Pop-Location
}

if (-not $extracted) {
    Write-Host "⚠ 7zip or tar not found. Please extract manually:" -ForegroundColor Yellow
    Write-Host "  1. Extract $tarFile" -ForegroundColor White
    Write-Host "  2. Extract the resulting .tar file" -ForegroundColor White
    Write-Host "  3. Copy ffmpeg and ffprobe from ffmpeg-*-static/ to $binDir" -ForegroundColor White
    exit 1
}

$ffmpegStaticDir = Get-ChildItem -Path $extractDir -Directory -Filter "ffmpeg-*-static" | Select-Object -First 1

if ($ffmpegStaticDir) {
    $ffmpegSource = Join-Path $ffmpegStaticDir.FullName "ffmpeg"
    $ffprobeSource = Join-Path $ffmpegStaticDir.FullName "ffprobe"
    
    if (Test-Path $ffmpegSource) {
        Copy-Item $ffmpegSource $binDir -Force
        Write-Host "✓ Copied ffmpeg" -ForegroundColor Green
    }
    
    if (Test-Path $ffprobeSource) {
        Copy-Item $ffprobeSource $binDir -Force
        Write-Host "✓ Copied ffprobe" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Could not find ffmpeg binaries. Please copy manually:" -ForegroundColor Yellow
    Write-Host "  Copy ffmpeg and ffprobe to: $binDir" -ForegroundColor White
    exit 1
}

Write-Host "Creating layer ZIP..." -ForegroundColor Cyan

if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    Push-Location $layerDir
    & 7z a -tzip $zipFile bin -mx=9 2>&1 | Out-Null
    Pop-Location
} else {
    Compress-Archive -Path (Join-Path $layerDir "bin") -DestinationPath $zipFile -Force
}

if (Test-Path $zipFile) {
    $size = (Get-Item $zipFile).Length / 1MB
    Write-Host "✓ Layer ZIP created: $zipFile ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/layers" -ForegroundColor White
    Write-Host "2. Click 'Create layer'" -ForegroundColor White
    Write-Host "3. Name: ffmpeg-layer" -ForegroundColor White
    Write-Host "4. Upload: $zipFile" -ForegroundColor White
    Write-Host "5. Compatible runtimes: Node.js 20.x" -ForegroundColor White
    Write-Host "6. After creation, add the layer to your Lambda function" -ForegroundColor White
} else {
    Write-Host "✗ Failed to create layer ZIP" -ForegroundColor Red
    exit 1
}

if (Test-Path $extractDir) {
    Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path $tarFile) {
    Remove-Item $tarFile -Force -ErrorAction SilentlyContinue
}
