# YouTube OAuth Setup Guide

## Overview
This guide explains how to set up YouTube OAuth authentication for connecting YouTube accounts to the VlogHub platform.

## Prerequisites
1. Google Cloud Console account
2. YouTube Data API enabled
3. OAuth 2.0 credentials configured

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**

## Step 2: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in required information (App name, User support email, Developer contact)
   - Add scopes:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Add test users (if in testing mode)
   - Save and continue

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `VlogHub YouTube OAuth`
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/youtube-oauth/callback`
     - Production: `https://yourdomain.com/api/youtube-oauth/callback`
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**

## Step 3: Environment Variables

Add the following to your `.env.local` file in the `frontend` directory:

```env
# YouTube OAuth Configuration
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube-oauth/callback
```

For production, update `NEXT_PUBLIC_YOUTUBE_REDIRECT_URI` to your production URL.

## Step 4: Database Schema Update

Run the following SQL in your Supabase SQL Editor to add the OAuth tokens column:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS youtube_oauth_tokens JSONB;
```

Or use the provided migration file:
```bash
# In Supabase SQL Editor, run:
frontend/supabase/add_youtube_oauth_tokens.sql
```

## Step 5: How It Works

### OAuth Flow:
1. User clicks "Connect YouTube" button
2. Frontend calls `/api/youtube-oauth/initiate` with user ID
3. Backend generates OAuth URL with state parameter
4. User is redirected to Google OAuth consent screen
5. User grants permissions
6. Google redirects to `/api/youtube-oauth/callback` with authorization code
7. Backend exchanges code for access/refresh tokens
8. Backend fetches YouTube channel information
9. Tokens and channel info are saved to database
10. User is redirected back to social media page with success message

### Stored Data:
- `access_token`: Used for API requests
- `refresh_token`: Used to get new access tokens when expired
- `expires_at`: Token expiration timestamp
- `channel_info`: Channel details (ID, title, subscriber count, etc.)
- `connected_at`: Connection timestamp

## Step 6: Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/social-media`
3. Click "Connect YouTube" on the YouTube card
4. Complete the OAuth flow
5. Verify the account shows as connected with channel information

## Troubleshooting

### "YouTube OAuth client ID not configured"
- Ensure `NEXT_PUBLIC_YOUTUBE_CLIENT_ID` is set in `.env.local`
- Restart your development server after adding environment variables

### "redirect_uri_mismatch"
- Verify the redirect URI in Google Cloud Console matches exactly
- Check that `NEXT_PUBLIC_YOUTUBE_REDIRECT_URI` matches the configured URI

### "invalid_grant"
- The authorization code may have expired (codes expire quickly)
- Try the OAuth flow again

### Database errors
- Ensure the `youtube_oauth_tokens` column exists in the `profiles` table
- Check that RLS policies allow updates to the profiles table

## Security Notes

1. **Never commit** `.env.local` to version control
2. **Client Secret** should only be in server-side environment variables
3. **Access Tokens** are stored encrypted in the database
4. **Refresh Tokens** should be rotated periodically
5. Use HTTPS in production for all OAuth redirects

## Next Steps

After successful connection, you can:
- Use the stored access token to upload videos to YouTube
- Fetch channel statistics
- Manage YouTube content programmatically
- Display connected account information in the UI

