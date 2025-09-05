# Gemini API Setup Guide

## Overview
This project now integrates with Google's Gemini AI API to fetch trending topics for different regions, including Pakistan.

## Setup Instructions

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables
Create a `.env.local` file in the frontend directory with:

```bash
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. API Endpoint
The Gemini trending topics are fetched from:
```
GET /api/gemini-trending-topics?location=pakistan
```

### 4. Features
- **Left Word Cloud**: Displays trending topics from Gemini AI
- **Right Word Cloud**: Displays trending topics from Twitter API
- **Region Support**: Works with all configured regions
- **Fallback Data**: Provides Pakistan-specific trending topics if API fails

### 5. Trending Topics Categories
Gemini AI generates topics in these categories:
- News
- Entertainment
- Sports
- Technology
- Politics
- Social
- Business
- Education
- Health
- Culture

### 6. Error Handling
- If Gemini API fails, falls back to curated Pakistan trending topics
- Logs errors to console for debugging
- Graceful degradation to mock data

### 7. Customization
You can modify the Gemini prompt in `frontend/pages/api/gemini-trending-topics.ts` to:
- Change the number of topics (currently 10)
- Modify categories
- Adjust topic generation criteria
- Add region-specific prompts

## Troubleshooting

### Common Issues
1. **API Key Not Set**: Ensure `GEMINI_API_KEY` is in `.env.local`
2. **Rate Limiting**: Gemini has rate limits; check Google AI Studio dashboard
3. **Invalid Response**: Check console logs for API response format issues

### Testing
1. Start the development server: `npm run dev`
2. Navigate to the trending topics page
3. Check browser console for API calls and responses
4. Verify both word clouds display different data

## API Response Format
```json
{
  "success": true,
  "location": "pakistan",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": [
    {
      "ranking": 1,
      "category": "Politics",
      "topic": "Election Updates",
      "postCount": "45,000 posts",
      "postCountValue": 45000,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
``` 