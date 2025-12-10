# YouTube Channel OAuth Setup

Follow these steps to obtain the YouTube OAuth Client ID and Client Secret needed for connecting channels.

## 1) Google Cloud setup
- Open https://console.cloud.google.com and select or create a project.
- Enable API: APIs & Services → Library → search “YouTube Data API v3” → Enable.

## 2) OAuth consent screen
- Go to APIs & Services → OAuth consent screen.
- Choose External, fill app info, add scopes:
  - https://www.googleapis.com/auth/youtube.upload
  - https://www.googleapis.com/auth/youtube.readonly
  - https://www.googleapis.com/auth/userinfo.profile
- Add test users (for testing mode) and save.

## 3) Create OAuth credentials
- APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.
- Authorized redirect URIs:
  - Dev: http://localhost:3000/api/youtube-oauth/callback
  - Prod: https://yourdomain.com/api/youtube-oauth/callback (update with your domain)
- Create and copy the Client ID and Client Secret.

## 4) Environment variables
- In `frontend/.env.local` (create if missing):
```
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube-oauth/callback
```
- Restart the dev server after setting these.

## 5) Database column (Supabase)
- Ensure the `profiles` table has `youtube_oauth_tokens` (JSONB). Run in Supabase SQL:
```
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS youtube_oauth_tokens JSONB;
```

## 6) Flow summary
- User clicks “Connect YouTube” → `/api/youtube-oauth/initiate` builds auth URL → Google consent → redirect to `/api/youtube-oauth/callback` → tokens exchanged and saved → user returned to `/social-media` showing connected status.

