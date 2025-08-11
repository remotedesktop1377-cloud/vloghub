# Twitter API Integration Setup Guide

## Overview
This application now uses a server-side proxy to call the Twitter API, which solves the CORS issues and keeps your API credentials secure.

## Setup Steps

### 1. Create Environment File
Create a `.env.local` file in your `frontend` directory with the following content:

```bash
# Twitter API Configuration
X_BEARER_TOKEN=your_actual_twitter_bearer_token_here

# OpenAI API Configuration (for chapter generation)
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Get Your Twitter Bearer Token
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use an existing one
3. Navigate to "Keys and Tokens"
4. Copy your "Bearer Token"

### 3. How It Works
- **Frontend**: Calls `/api/x/trends?region=pakistan` (or other regions)
- **Backend**: Proxy route at `pages/api/x/trends.ts` handles the Twitter API call
- **Security**: Your Twitter API token stays on the server, never exposed to the browser
- **CORS**: No more CORS issues since the frontend calls your own server

### 4. Supported Regions
The system automatically maps these regions to their Twitter WOEIDs:
- Pakistan (23424922)
- Global (1)
- India (23424848)
- United States (23424977)
- United Kingdom (23424975)
- Canada (23424775)
- Australia (23424748)

### 5. Error Handling
- If Twitter API fails, the system falls back to mock data
- All errors are logged on the server side
- Frontend gracefully handles failures and shows appropriate messages

### 6. Testing
1. Set up your `.env.local` file
2. Restart your Next.js development server
3. Navigate to the Trending Topics page
4. Select different regions to test the API calls

## Troubleshooting

### "Server misconfigured: missing X_BEARER_TOKEN"
- Check that your `.env.local` file exists and has the correct variable name
- Ensure you've restarted the development server after adding the environment variable
- **Debug Environment Variables**: Visit `/api/debug-env` in your browser to see what environment variables are loaded
- **File Location**: Make sure `.env.local` is in the `frontend` directory (same level as `package.json`)
- **File Format**: Ensure no spaces around the `=` sign: `X_BEARER_TOKEN=your_token_here`
- **No Quotes**: Don't wrap the token in quotes: `X_BEARER_TOKEN=your_token_here` (not `X_BEARER_TOKEN="your_token_here"`)

### "Upstream error" responses
- Verify your Twitter API credentials are correct
- Check that your Twitter app has the necessary permissions
- Ensure you haven't exceeded Twitter API rate limits

### Still seeing mock data
- Check the browser console for any error messages
- Verify the API route is working by testing `/api/x/trends?region=pakistan` directly
- Check server logs for any backend errors

## Security Notes
- Never commit your `.env.local` file to version control
- The Twitter API token is only used server-side
- All API calls go through your secure proxy route
- Rate limiting and error handling are implemented on the server
