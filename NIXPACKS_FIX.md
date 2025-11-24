# Fixing Nixpacks Syntax Error

## The Error
```
error: syntax error, unexpected CONCAT
at /app/.nixpacks/nixpkgs-<hash>.nix:19:17
```

This error occurs when Nixpacks generates an invalid Nix file from the `nixpacks.toml` configuration.

## Solution Applied

1. **Removed problematic packages**: Changed from `["python311", "ffmpeg", "gcc", "g++"]` to just `["ffmpeg"]`
2. **Let Nixpacks auto-detect Python**: Nixpacks will automatically detect Python from `requirements.txt` and `runtime.txt`
3. **Simplified configuration**: Only specify FFmpeg explicitly since it's not auto-detected

## Current Configuration

The `nixpacks.toml` now only specifies:
- `ffmpeg` - Required for video processing
- Python will be auto-detected from `runtime.txt` (python-3.11)
- Build tools (gcc/g++) will be installed automatically if needed by pip packages

## If Build Still Fails

If you still get errors, try:

1. **Remove nixpacks.toml entirely** - Let Nixpacks fully auto-detect:
   ```bash
   # Delete nixpacks.toml
   # Railway will auto-detect Python and install packages
   # But FFmpeg won't be available - you'll need to install it via pip or apt
   ```

2. **Use a different format** - Try specifying packages differently:
   ```toml
   [phases.setup]
   nixPkgs = { python3 = "latest", ffmpeg = "latest" }
   ```

3. **Install FFmpeg via pip** - Add `ffmpeg-python` to requirements.txt and handle FFmpeg binary separately

4. **Check Railway logs** - The exact error message will help identify the issue

## Alternative: Use Dockerfile.railway

If Nixpacks continues to have issues, you can:
1. Rename `Dockerfile.railway` to `Dockerfile`
2. Set Railway builder back to "Docker"
3. This will use the simplified Dockerfile that only builds the backend

