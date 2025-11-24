# Nixpacks Troubleshooting Guide

## Current Issue: Syntax Error

Error: `syntax error, unexpected CONCAT` in generated Nix file

## Solutions to Try

### Solution 1: Simplified nixPkgs (Current)

The `nixpacks.toml` now only specifies `ffmpeg`:
```toml
[phases.setup]
nixPkgs = ["ffmpeg"]
```

**Push this and test.** If it still fails, try Solution 2.

### Solution 2: Remove nixpacks.toml Entirely

1. Delete or rename `nixpacks.toml`
2. Let Nixpacks fully auto-detect Python
3. Install FFmpeg via pip package `ffmpeg-python` (but this won't install the binary)

**Note:** This won't install FFmpeg binary, only the Python wrapper.

### Solution 3: Use Dockerfile Instead

If Nixpacks continues to have issues:

1. Rename `Dockerfile.railway` to `Dockerfile`
2. In Railway Settings → Builder → Change to "Docker"
3. This uses the simplified Dockerfile that only builds backend

### Solution 4: Try Different Package Names

Try these variations in `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["ffmpeg_6"]
```

Or:
```toml
[phases.setup]
nixPkgs = ["ffmpeg-full"]
```

### Solution 5: Install FFmpeg in Install Phase

If Nix packages don't work, try installing via system package manager in install phase:
```toml
[phases.install]
cmds = [
  "nix-env -iA nixpkgs.ffmpeg || apt-get update && apt-get install -y ffmpeg",
  "pip install --upgrade pip",
  "pip install -r requirements.txt"
]
```

## Recommended Next Steps

1. **Try Solution 1 first** (current simplified config)
2. If that fails, **try Solution 3** (use Dockerfile.railway)
3. If you need Nixpacks specifically, contact Railway support with the error

## Why This Happens

Nixpacks generates Nix files from your `nixpacks.toml`. Sometimes the generated Nix syntax is invalid due to:
- Package name conflicts
- Nixpacks version bugs
- Invalid package specifications

The simplest solution is often to use Docker instead of Nixpacks.

