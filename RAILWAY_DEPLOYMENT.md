# Railway Deployment Guide

This guide will help you deploy the FastAPI backend to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Your project repository on GitHub (or connect directly)

## Deployment Steps

### 1. Connect Your Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 1.5. Configure Builder (CRITICAL - DO THIS FIRST!)

**Railway may have cached Docker detection. You MUST manually configure it:**

1. After connecting your repository, go to your service in Railway dashboard
2. Click on **Settings** tab (gear icon)
3. Scroll down to **Build & Deploy** section
4. Find **Builder** dropdown
5. **Change it from "Docker" to "Nixpacks"**
6. Click **Save** or **Deploy**

**Alternative method if above doesn't work:**
1. Go to your service → **Settings**
2. Click **Clear Build Cache**
3. Go to **Deployments** tab
4. Click **Redeploy** or trigger a new deployment
5. Railway should now detect `nixpacks.toml` and use Nixpacks

**Note:** The `Dockerfile` has been renamed to `Dockerfile.full` to prevent auto-detection, but Railway may have cached the Docker configuration. You must manually set the builder to Nixpacks.

### 2. Configure Environment Variables

In Railway, go to your service → Variables tab and add:

**Required:**
- `FRONTEND_URL` - Your frontend URL (e.g., `https://your-app.vercel.app`)
- `GEMINI_API_KEY` - Your Google Gemini API key
- `GOOGLE_DRIVE_FOLDER_ID` - Your Google Drive root folder ID
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Your Google service account credentials (as JSON string)

**Optional:**
- `DEBUG` - Set to `false` for production
- `API_HOST` - Defaults to `0.0.0.0` (don't change)
- `PORT` - Automatically set by Railway (don't set manually)

### 3. Deploy

Railway will automatically:
1. Detect Python from `requirements.txt`
2. Install dependencies
3. Run the app using the `Procfile` or `railway.json` configuration

### 4. Verify Deployment

1. Check the deployment logs in Railway
2. Visit your Railway service URL (provided by Railway)
3. Test the health endpoint: `https://your-service.railway.app/health`
4. Test the root endpoint: `https://your-service.railway.app/`

## Important Notes

### FFmpeg Installation

Railway uses Nixpacks which will automatically install FFmpeg from the `nixpacks.toml` configuration.

### File Storage

- Railway has an **ephemeral filesystem** - files in `temp/` and `exports/` will be lost on restart
- **Important**: Clips are automatically uploaded to Google Drive, so local file paths won't persist
- Make sure `FRONTEND_URL` is set correctly so clips can be uploaded to Google Drive

### Port Configuration

- Railway automatically sets the `PORT` environment variable
- The app is configured to use `PORT` (with fallback to `API_PORT` for local dev)
- Don't manually set `PORT` in Railway

### CORS Configuration

The app is configured to allow all origins (`allow_origins=["*"]`). For production, consider restricting this to your frontend domain.

## Troubleshooting

### Build Fails

1. Check that all dependencies in `requirements.txt` are uncommented and have versions
2. Verify Python version compatibility (3.11)
3. Check Railway build logs for specific errors

### App Crashes on Startup

1. Verify all required environment variables are set
2. Check that FFmpeg is installed (should be automatic via nixpacks.toml)
3. Review application logs in Railway

### Connection Issues

1. Ensure `FRONTEND_URL` is set correctly
2. Verify the frontend can reach the Railway backend URL
3. Check CORS settings if frontend requests are blocked

### File Upload Issues

1. Verify Google Drive credentials are correct
2. Check that `FRONTEND_URL` points to your deployed frontend
3. Review logs for upload errors

## Monitoring

- Railway provides built-in logging and metrics
- Check the "Logs" tab in Railway dashboard
- Set up alerts for deployment failures

## Custom Domain

1. Go to your service → Settings → Domains
2. Add your custom domain
3. Railway will provide DNS configuration

## Scaling

Railway automatically scales based on traffic. For high-traffic scenarios:
- Consider upgrading your Railway plan
- Monitor resource usage in the Railway dashboard
- Optimize video processing for better performance

