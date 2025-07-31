# YouTube API Research

This document provides information about the YouTube Data API v3, its capabilities, limitations, and usage patterns for the YouTube Research Video Clip Finder project.

## API Overview

The YouTube Data API v3 allows developers to integrate YouTube functionality into their applications. It provides access to YouTube data such as videos, playlists, and channels.

### Key Features

- Search for videos, channels, and playlists
- Retrieve video metadata and statistics
- Access video captions/transcripts
- Manage playlists and subscriptions (with authentication)
- Upload videos (with authentication)

## Authentication & Setup

### API Key

For read-only operations like search and retrieving video information:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the YouTube Data API v3
3. Create an API key
4. Use the API key in requests with the `key` parameter

### OAuth 2.0

For operations that require user authorization:

1. Configure OAuth consent screen
2. Create OAuth client ID
3. Implement OAuth 2.0 flow to obtain access tokens
4. Use access tokens in API requests

## Quota Limitations

YouTube Data API v3 uses a quota system to ensure fair usage:

- Each project receives 10,000 units per day by default
- Operations cost different amounts of quota:
  - Simple read operations: 1 unit
  - Search operations: 100 units
  - Video upload: 1,600 units
- Additional quota can be requested for production applications

### Quota Management Strategies

1. **Caching**: Store API responses to reduce duplicate requests
2. **Batching**: Combine multiple operations in a single request
3. **Efficient Queries**: Use specific filters to reduce result set
4. **API Key Rotation**: Use multiple projects/keys for higher quota
5. **Request Throttling**: Implement rate limiting in the application

## Key Endpoints for This Project

### Search Videos

```
GET https://www.googleapis.com/youtube/v3/search
```

Parameters:
- `part`: snippet (required)
- `q`: Search query
- `type`: video
- `videoCaption`: closedCaption (for videos with captions)
- `videoDuration`: short/medium/long
- `publishedAfter`: ISO 8601 timestamp
- `publishedBefore`: ISO 8601 timestamp
- `regionCode`: ISO 3166-1 alpha-2 country code
- `relevanceLanguage`: ISO 639-1 two-letter language code
- `safeSearch`: moderate/none/strict
- `videoLicense`: creativeCommon/youtube
- `maxResults`: 1-50 (default: 5)
- `pageToken`: for pagination

### Get Video Details

```
GET https://www.googleapis.com/youtube/v3/videos
```

Parameters:
- `part`: snippet,contentDetails,statistics
- `id`: Comma-separated video IDs

### Get Captions

```
GET https://www.googleapis.com/youtube/v3/captions
```

Parameters:
- `part`: snippet
- `videoId`: Video ID

### Download Caption Track

```
GET https://www.googleapis.com/youtube/v3/captions/{id}
```

Parameters:
- `tfmt`: Format (srt, vtt)

## Rate Limiting

In addition to daily quota, the API has rate limits:

- Default: 10,000 requests per day
- Maximum: 1,000,000 requests per day (with approval)
- Per-user limit: 300 requests per second
- Per-project limit: Varies based on API method

## Error Handling

Common error codes:
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (invalid credentials)
- `403`: Forbidden (quota exceeded)
- `404`: Resource not found
- `500`: Server error

Best practices:
- Implement exponential backoff for retries
- Handle quota errors gracefully
- Provide clear error messages to users

## Limitations and Considerations

1. **Caption Access**: Not all videos have captions, and some may have auto-generated captions with lower accuracy
2. **Search Precision**: YouTube search is optimized for relevance, not exact matching
3. **API Changes**: The API may change over time, requiring updates to the application
4. **Content Restrictions**: Some content may be region-restricted or age-restricted
5. **Fair Use**: Respect copyright and fair use guidelines when downloading content

## Integration Plan

1. Create a service wrapper for YouTube API operations
2. Implement caching to reduce API calls
3. Add error handling and retry logic
4. Create a quota monitoring system
5. Design fallback mechanisms for when quota is exceeded 