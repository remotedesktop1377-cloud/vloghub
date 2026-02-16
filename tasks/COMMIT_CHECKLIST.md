# Pre-Commit Checklist for FFmpeg Lambda

## ✅ Files to COMMIT

### Core Code
- [ ] `index.js` - Lambda function handler
- [ ] `package.json` - Dependencies
- [ ] `package-lock.json` - Lock file

### Scripts
- [ ] `create-zip.js` - Build script
- [ ] `deploy.ps1` - Deployment script
- [ ] `deploy.sh` - Deployment script
- [ ] `create-ffmpeg-layer.ps1` - Layer creation script
- [ ] `optimize-layer.ps1` - Optimization script
- [ ] `quick-test.ps1` - Test script
- [ ] `upload-test-video.ps1` - Upload helper

### Documentation
- [ ] `README.md`
- [ ] `MANUAL_DEPLOYMENT.md`
- [ ] `CREATE_FFMPEG_LAYER.md`
- [ ] `QUICK_FFMPEG_LAYER_SETUP.md`
- [ ] `UPLOAD_VIA_S3.md`
- [ ] `UPDATE_FUNCTION.md`
- [ ] `TESTING_GUIDE.md`
- [ ] `FFMPEG_FILES_REFERENCE.md`
- [ ] `COMMIT_CHECKLIST.md` (this file)

### Frontend Integration
- [ ] `app/api/lambda/cut-clips/route.ts`
- [ ] `app/api/cut-clips/route.ts` (if modified for Lambda)

## ❌ Files to IGNORE (Already in .gitignore)

- [ ] `function.zip` - Build artifact (regenerated)
- [ ] `ffmpeg-layer.zip` - Layer package (too large, >50MB)
- [ ] `node_modules/` - Dependencies
- [ ] `ffmpeg.tar.xz` - Downloaded archive
- [ ] `ffmpeg-*-static/` - Extracted binaries
- [ ] `ffmpeg-layer/` - Layer directory with binaries
- [ ] `test-payload.json` - Test file
- [ ] `response.json` - Test output

## 🔍 Quick Verification

Before committing, verify:

1. **No large binaries**: Check that no `.zip` files > 10MB are being committed
2. **No node_modules**: Ensure `node_modules/` is ignored
3. **Documentation updated**: All docs reflect current state
4. **Code reviewed**: `index.js` and API routes are correct

## 📝 Commit Message Template

```
feat: Add FFmpeg Lambda function for video clip cutting

- Lambda function for cutting video clips on AWS
- API route integration for Lambda invocation
- Documentation and deployment scripts
- FFmpeg layer setup instructions
```

## 🚀 After Committing

1. Verify `.gitignore` is working (check `git status`)
2. Ensure no large files are tracked
3. Test that others can build from source (they'll need to run `npm install` and `npm run create-zip`)
