# Quick Fix: Force Railway to Use Nixpacks

## The Problem
Railway is trying to use Docker (which builds the frontend) instead of Nixpacks (which only builds the backend).

## The Solution

### Step 1: Change Builder in Railway Dashboard

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your service** (the one that's failing)
3. **Click "Settings"** (gear icon on the right)
4. **Scroll to "Build & Deploy" section**
5. **Find "Builder" dropdown** - it probably says "Docker"
6. **Change it to "Nixpacks"**
7. **Click "Save"** or the deploy button

### Step 2: Clear Build Cache (Optional but Recommended)

1. Still in **Settings**
2. Scroll to find **"Clear Build Cache"** button
3. Click it
4. This ensures Railway starts fresh

### Step 3: Redeploy

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** or trigger a new deployment
3. Railway should now use Nixpacks and build successfully

## What Should Happen

After switching to Nixpacks, Railway will:
- ✅ Detect Python from `requirements.txt`
- ✅ Install FFmpeg, gcc, g++ (from `nixpacks.toml`)
- ✅ Install Python dependencies
- ✅ Start the app with `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`

## Verification

Check the build logs - you should see:
- `Using Nixpacks builder` (not Docker)
- Python installation
- FFmpeg installation
- `pip install -r requirements.txt`
- No frontend/Node.js build steps

## Still Having Issues?

If Railway still tries to use Docker after changing the builder:

1. **Delete the service** and create a new one
2. **Or** contact Railway support to clear the cached configuration
3. **Or** make sure `Dockerfile.full` and `Dockerfile.railway` are in `.railwayignore` (they already are)

