# Multi-User OAuth System - How It Works

## Overview

Your VlogHub application is already set up for **multi-user OAuth**. Each user can connect their own YouTube channel and Facebook page, and content is published to their connected accounts automatically.

## Understanding the Credentials

### Application-Level Credentials (in `.env.local`)

These are **NOT** user-specific channel/page IDs. They are **OAuth application credentials** that enable the entire system:

```env
# These are YOUR APP's OAuth credentials (shared by all users)
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_app_client_id
YOUTUBE_CLIENT_SECRET=your_app_client_secret

NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

**Think of these like:**
- A master key that allows your app to connect to YouTube/Facebook
- One set of credentials for your entire application
- Used by ALL users when they connect their accounts

### User-Specific Tokens (stored in database)

Each user's tokens are stored separately in the `social_accounts` table:

```sql
social_accounts table:
- user_id (UUID) - Which user owns this account
- platform (youtube/facebook) - Which platform
- channel_id - User's specific channel/page ID
- oauth_tokens (JSONB) - User's access tokens, refresh tokens, etc.
```

## How It Works

### 1. User Connects Their Account

```
User clicks "Connect YouTube"
    ↓
OAuth flow starts (uses app's CLIENT_ID)
    ↓
User authorizes YOUR app to access THEIR channel
    ↓
User's tokens saved to social_accounts table with their user_id
```

### 2. Publishing Content

```
User publishes a video
    ↓
System fetches user's tokens from social_accounts table
    ↓
Uses user's tokens to publish to THEIR channel/page
    ↓
Video appears on user's connected account
```

## Current Implementation Status

✅ **Already Automated:**
- Each user connects their own account
- Tokens stored per-user in database
- Publishing uses user's own tokens
- Facebook page selection supported

✅ **No Hardcoded Channel/Page IDs:**
- All channel/page IDs come from user's OAuth tokens
- Stored dynamically in database
- Retrieved per-user when publishing

## Database Schema

### `social_accounts` Table

```sql
CREATE TABLE social_accounts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    platform TEXT NOT NULL,  -- 'youtube' or 'facebook'
    channel_id TEXT,         -- User's channel/page ID
    channel_name TEXT,       -- User's channel/page name
    oauth_tokens JSONB,       -- User's tokens (access_token, refresh_token, etc.)
    connected BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(user_id, platform)
);
```

### Example Data

**User 1's YouTube Account:**
```json
{
  "user_id": "user-1-uuid",
  "platform": "youtube",
  "channel_id": "UCabc123xyz",
  "channel_name": "User 1's Channel",
  "oauth_tokens": {
    "access_token": "user1-access-token",
    "refresh_token": "user1-refresh-token",
    "channel_info": { ... }
  }
}
```

**User 2's YouTube Account:**
```json
{
  "user_id": "user-2-uuid",
  "platform": "youtube",
  "channel_id": "UCdef456uvw",
  "channel_name": "User 2's Channel",
  "oauth_tokens": {
    "access_token": "user2-access-token",
    "refresh_token": "user2-refresh-token",
    "channel_info": { ... }
  }
}
```

## Code Flow

### 1. OAuth Initiation (`/api/youtube-oauth/initiate`)

```typescript
// Uses app's CLIENT_ID (from .env.local)
const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
// Creates OAuth URL with user's ID in state
const state = { userId, timestamp };
// User authorizes → redirects to callback
```

### 2. OAuth Callback (`/api/youtube-oauth/callback`)

```typescript
// Exchanges code for tokens
const tokens = await exchangeCodeForTokens(code);
// Gets user's channel info
const channelInfo = await getChannelInfo(tokens.access_token);
// Saves to database with user_id
await saveToSocialAccounts({
  user_id: userId,
  platform: 'youtube',
  channel_id: channelInfo.channelId,
  oauth_tokens: tokens
});
```

### 3. Publishing (`/api/youtube-publish`)

```typescript
// Fetches user's tokens from database
const socialAccount = await getSocialAccount(userId, 'youtube');
// Uses user's access token
const accessToken = socialAccount.oauth_tokens.access_token;
// Publishes to user's channel
await publishToYouTube(video, accessToken);
```

## Verification

To verify your system is working correctly:

1. **Check Database:**
   ```sql
   SELECT user_id, platform, channel_id, channel_name, connected
   FROM social_accounts;
   ```
   You should see different `channel_id` values for different users.

2. **Test Flow:**
   - User A connects their YouTube → Check database has User A's channel ID
   - User B connects their YouTube → Check database has User B's channel ID
   - User A publishes → Video goes to User A's channel
   - User B publishes → Video goes to User B's channel

3. **Check Publishing Code:**
   - `youtube-publish/route.ts` line 130-136: Fetches user's account
   - `youtube-publish/route.ts` line 153-154: Uses user's tokens
   - No hardcoded channel IDs anywhere

## Common Misconceptions

❌ **"The CLIENT_ID in .env.local is my channel ID"**
- No, it's your app's OAuth client ID (shared by all users)

❌ **"All users publish to the same channel"**
- No, each user's tokens are stored separately and used for their own channel

❌ **"I need to change .env.local for each user"**
- No, .env.local contains app-level credentials (one set for entire app)

✅ **"Each user connects their own account"**
- Yes! This is already how it works

✅ **"Publishing uses the user's own tokens"**
- Yes! Tokens are fetched from database per-user

## Troubleshooting

### Issue: All users publishing to same channel

**Check:**
1. Are tokens being saved with correct `user_id`?
   ```sql
   SELECT user_id, platform, channel_id FROM social_accounts;
   ```

2. Is publishing fetching correct user's account?
   - Check `youtube-publish/route.ts` line 130-136
   - Verify `userId` parameter is correct

### Issue: User can't connect account

**Check:**
1. OAuth credentials in `.env.local` are correct
2. Redirect URIs match in OAuth provider settings
3. User is properly authenticated (has `user.id`)

### Issue: Token refresh not working

**Check:**
1. Refresh tokens are being saved in `oauth_tokens` JSONB
2. Token refresh logic in `youtube-publish/route.ts` lines 163-214

## Summary

Your system is **already fully automated** for multi-user OAuth:

- ✅ App-level credentials in `.env.local` (one set for entire app)
- ✅ User-specific tokens in database (one per user)
- ✅ Publishing uses user's own tokens automatically
- ✅ No hardcoded channel/page IDs
- ✅ Each user publishes to their own connected account

**No changes needed** - the system is production-ready for multi-user scenarios!

