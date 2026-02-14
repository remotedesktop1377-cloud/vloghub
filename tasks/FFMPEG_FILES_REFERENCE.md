# FFmpeg-Related Files Reference

This document lists all files related to FFmpeg Lambda functionality and indicates which should be committed to Git.

## 📁 Core Lambda Function Files (COMMIT ✅)

### Essential Code Files
- `index.js` - Main Lambda function handler (uses FFmpeg to cut video clips)
- `package.json` - Dependencies for Lambda function
- `package-lock.json` - Lock file for dependencies

### Build & Deployment Scripts
- `create-zip.js` - Node.js script to create function.zip (uses archiver)
- `deploy.ps1` - PowerShell deployment script for Windows
- `deploy.sh` - Bash deployment script for Linux/Mac

## 📁 Documentation Files (COMMIT ✅)

### Setup & Deployment Guides
- `README.md` - Main documentation for the Lambda function
- `MANUAL_DEPLOYMENT.md` - Manual deployment instructions
- `CREATE_FFMPEG_LAYER.md` - Instructions for creating FFmpeg layer
- `QUICK_FFMPEG_LAYER_SETUP.md` - Quick setup guide for FFmpeg layer
- `UPLOAD_VIA_S3.md` - Instructions for uploading layer via S3 (for files > 50MB)
- `UPDATE_FUNCTION.md` - Instructions for updating function code
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `FFMPEG_FILES_REFERENCE.md` - This file

### Helper Scripts (COMMIT ✅)
- `create-ffmpeg-layer.ps1` - Script to create FFmpeg layer (has syntax issues, but keep for reference)
- `optimize-layer.ps1` - Script to optimize layer size
- `quick-test.ps1` - Quick verification script
- `upload-test-video.ps1` - Script to upload test video to S3

## 📁 Generated/Build Files (DO NOT COMMIT ❌)

### Build Artifacts
- `function.zip` - Compiled Lambda function package (regenerated on build)
- `ffmpeg-layer.zip` - FFmpeg layer package (too large, > 50MB)
- `node_modules/` - Dependencies (should be in .gitignore)

### Extracted Archives (DO NOT COMMIT ❌)
- `ffmpeg.tar.xz` - Downloaded FFmpeg archive
- `ffmpeg-7.0.2-amd64-static/` - Extracted FFmpeg binaries and documentation
- `ffmpeg-layer/` - Layer directory structure (contains binaries)

## 📁 Frontend Integration Files (COMMIT ✅)

### API Routes
- `frontend/app/api/lambda/cut-clips/route.ts` - Lambda proxy API route
- `frontend/app/api/cut-clips/route.ts` - Main cut-clips route (delegates to Lambda if enabled)

### Frontend Components (Local FFmpeg - separate from Lambda)
- `frontend/src/components/editor/render/Ffmpeg/Ffmpeg.tsx` - Local FFmpeg render component
- `frontend/src/components/editor/render/Ffmpeg/FfmpegRender.tsx` - FFmpeg render wrapper
- `frontend/src/components/editor/render/Ffmpeg/FfmpegRender.module.css` - Styles
- `frontend/src/components/editor/render/Ffmpeg/ProgressBar.tsx` - Progress bar component
- `frontend/src/components/editor/render/Ffmpeg/Export.tsx` - Export component

### Services & Utils
- `frontend/src/services/processService.ts` - Process service (may reference FFmpeg)
- `frontend/src/utils/extractConfigs.ts` - Config extraction (may use FFmpeg)

## 📁 Root Documentation (COMMIT ✅)

### Setup Guides
- `frontend/TESTING_LAMBDA_FFMPEG.md` - Testing guide for Lambda FFmpeg
- `frontend/QUICK_START_LAMBDA_FFMPEG.md` - Quick start guide
- `frontend/DEPLOY_LAMBDA_FUNCTION.md` - Deployment instructions
- `frontend/AWS_PERMISSIONS_FIX.md` - IAM permissions guide

## 📋 Recommended .gitignore Entries

Add these to your `.gitignore`:

```gitignore
# Lambda function build artifacts
lambda-functions/ffmpeg-clip-cutter/function.zip
lambda-functions/ffmpeg-clip-cutter/ffmpeg-layer.zip
lambda-functions/ffmpeg-clip-cutter/node_modules/

# FFmpeg binaries and archives
lambda-functions/ffmpeg-clip-cutter/ffmpeg.tar.xz
lambda-functions/ffmpeg-clip-cutter/ffmpeg-*.tar.xz
lambda-functions/ffmpeg-clip-cutter/ffmpeg-*-static/
lambda-functions/ffmpeg-clip-cutter/ffmpeg-layer/
lambda-functions/ffmpeg-clip-cutter/ffmpeg-extract/

# Test files
lambda-functions/ffmpeg-clip-cutter/test-payload.json
lambda-functions/ffmpeg-clip-cutter/response.json
```

## 📦 What Gets Deployed

### To AWS Lambda:
1. `function.zip` - Contains `index.js` + `node_modules/`
2. `ffmpeg-layer.zip` - FFmpeg binaries (uploaded separately as Lambda layer)

### Not Deployed:
- Documentation files
- Build scripts
- Test scripts
- Extracted binaries

## 🔄 Workflow Summary

1. **Development**: Edit `index.js`, test locally
2. **Build**: Run `npm run create-zip` to create `function.zip`
3. **Deploy**: Upload `function.zip` to Lambda (via Console or script)
4. **Layer**: FFmpeg layer is separate, uploaded once via S3

## 📝 Key Files to Review Before Committing

1. **`index.js`** - Main Lambda function logic
2. **`package.json`** - Dependencies
3. **`app/api/lambda/cut-clips/route.ts`** - API integration
4. **Documentation files** - Keep updated with changes

## ⚠️ Important Notes

- **Never commit** `function.zip` or `ffmpeg-layer.zip` (too large, regenerated)
- **Never commit** `node_modules/` (standard practice)
- **Never commit** extracted FFmpeg binaries (too large, ~150MB+)
- **Do commit** all documentation and scripts
- **Do commit** source code files (`index.js`, `route.ts`, etc.)
