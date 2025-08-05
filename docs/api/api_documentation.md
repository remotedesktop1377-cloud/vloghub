# API Documentation

This document provides comprehensive documentation for the YouTube Research Video Clip Finder API.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.youtube-clip-finder.example.com/v1
```

For local development:

```
http://localhost:5000/v1
```

## Authentication

All API requests require authentication using a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

To obtain a token, use the authentication endpoint:

```
POST /auth/token
```

With the following body:

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

## Response Format

All responses are returned in JSON format with the following structure:

```json
{
  "status": "success|error",
  "data": {}, // Response data (if success)
  "error": {  // Error information (if error)
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per user. Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1628610000
```

## Endpoints

### YouTube Search

#### Search Videos

```
GET /youtube/search
```

Search for videos on YouTube.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Search query |
| max_results | integer | No | Maximum number of results (default: 10, max: 50) |
| page_token | string | No | Token for pagination |
| published_after | string | No | ISO 8601 date (e.g., 2021-01-01T00:00:00Z) |
| published_before | string | No | ISO 8601 date (e.g., 2021-12-31T23:59:59Z) |
| region_code | string | No | ISO 3166-1 alpha-2 country code |
| language | string | No | ISO 639-1 language code |
| caption | boolean | No | Filter for videos with captions |
| license | string | No | License type (any, creativeCommon, youtube) |

**Example Request:**

```
GET /youtube/search?query=nelson+mandela+speech&max_results=5&caption=true
```

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "videoId1",
        "title": "Nelson Mandela's First Speech After Release",
        "description": "Historic speech given by Nelson Mandela after his release from prison in 1990.",
        "thumbnail_url": "https://i.ytimg.com/vi/videoId1/default.jpg",
        "channel_title": "History Channel",
        "published_at": "2015-05-10T14:30:00Z",
        "duration": "PT15M30S",
        "view_count": 1500000,
        "has_captions": true
      },
      // More items...
    ],
    "next_page_token": "CBQQAA",
    "total_results": 243
  }
}
```

### Transcription

#### Get Video Transcript

```
GET /transcription/{video_id}
```

Get the transcript for a specific video.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| video_id | string | Yes | YouTube video ID |
| source | string | No | Transcript source (youtube, whisper, auto) |
| language | string | No | Language code (default: en) |

**Example Request:**

```
GET /transcription/videoId1?source=auto
```

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "transcript": [
      {
        "start": 0.0,
        "end": 5.2,
        "text": "Friends, comrades and fellow South Africans."
      },
      {
        "start": 5.3,
        "end": 10.5,
        "text": "I greet you all in the name of peace, democracy and freedom for all."
      },
      // More segments...
    ],
    "language": "en",
    "source": "youtube",
    "duration": 930.5
  }
}
```

### Clip Detection

#### Detect Clips

```
POST /clip-detection/{video_id}
```

Detect potential clips in a video using AI.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| video_id | string | Yes | YouTube video ID |
| method | string | No | Detection method (topic, speaker, hybrid) |
| min_duration | number | No | Minimum clip duration in seconds (default: 10) |
| max_duration | number | No | Maximum clip duration in seconds (default: 120) |
| keywords | array | No | Keywords to focus on |

**Example Request:**

```
POST /clip-detection/videoId1
```

```json
{
  "method": "hybrid",
  "min_duration": 15,
  "max_duration": 90,
  "keywords": ["freedom", "democracy", "peace"]
}
```

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "clips": [
      {
        "start": 45.2,
        "end": 95.7,
        "confidence": 0.87,
        "topic": "Freedom and Democracy",
        "speaker": "Nelson Mandela",
        "keywords": ["freedom", "democracy"]
      },
      // More clips...
    ]
  }
}
```

### Metadata

#### Get Clip Metadata

```
GET /metadata/clip/{clip_id}
```

Get metadata for a specific clip.

**Example Request:**

```
GET /metadata/clip/clip123
```

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "id": "clip123",
    "title": "Mandela on Democracy",
    "description": "Nelson Mandela discusses the importance of democracy",
    "tags": ["mandela", "democracy", "south africa", "speech"],
    "date": "1990-02-11",
    "location": {
      "country": "South Africa",
      "city": "Cape Town",
      "coordinates": {
        "latitude": -33.9249,
        "longitude": 18.4241
      }
    },
    "speaker": "Nelson Mandela",
    "sentiment": "inspiring",
    "created_at": "2023-05-10T14:30:00Z",
    "updated_at": "2023-05-15T09:45:00Z"
  }
}
```

#### Update Clip Metadata

```
PUT /metadata/clip/{clip_id}
```

Update metadata for a specific clip.

**Example Request:**

```
PUT /metadata/clip/clip123
```

```json
{
  "title": "Mandela on Democracy and Freedom",
  "tags": ["mandela", "democracy", "freedom", "south africa", "speech"],
  "sentiment": "powerful"
}
```

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "id": "clip123",
    "updated_at": "2023-07-20T11:23:45Z"
  }
}
```

### Download

#### Download Clip

```
GET /download/clip/{clip_id}
```

Download a specific clip.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| format | string | No | Video format (mp4, webm) |
| quality | string | No | Video quality (360p, 720p, 1080p) |
| include_subtitles | boolean | No | Include subtitles file |

**Example Request:**

```
GET /download/clip/clip123?format=mp4&quality=720p&include_subtitles=true
```

**Response:**

Binary file download with appropriate Content-Type and Content-Disposition headers.

#### Queue Batch Download

```
POST /download/batch
```

Queue multiple clips for batch download.

**Example Request:**

```
POST /download/batch
```

```json
{
  "clip_ids": ["clip123", "clip456", "clip789"],
  "format": "mp4",
  "quality": "720p",
  "include_subtitles": true
}
```

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "batch_id": "batch456",
    "estimated_completion_time": "2023-07-20T12:30:00Z",
    "clips_count": 3
  }
}
```

### Projects

#### List Projects

```
GET /projects
```

List all projects for the current user.

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "projects": [
      {
        "id": "project123",
        "name": "Nelson Mandela Documentary",
        "description": "Research for documentary on Mandela's speeches",
        "created_at": "2023-04-15T10:20:30Z",
        "clip_count": 24
      },
      // More projects...
    ]
  }
}
```

#### Create Project

```
POST /projects
```

Create a new project.

**Example Request:**

```
POST /projects
```

```json
{
  "name": "South African Leaders",
  "description": "Research on speeches by South African leaders"
}
```

**Example Response:**

```json
{
  "status": "success",
  "data": {
    "id": "project456",
    "name": "South African Leaders",
    "created_at": "2023-07-20T11:30:00Z"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Authentication is required |
| INVALID_TOKEN | Invalid or expired token |
| PERMISSION_DENIED | User does not have permission |
| RESOURCE_NOT_FOUND | Requested resource not found |
| INVALID_PARAMETERS | Invalid request parameters |
| QUOTA_EXCEEDED | API quota exceeded |
| YOUTUBE_API_ERROR | Error from YouTube API |
| INTERNAL_ERROR | Internal server error |

## Webhooks

The API supports webhooks for asynchronous notifications:

```
POST /webhooks
```

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["download.complete", "transcription.complete"]
}
```

## SDK

We provide official SDK libraries for easy integration:

- [JavaScript/TypeScript SDK](https://github.com/youtube-clip-finder/js-sdk)
- [Python SDK](https://github.com/youtube-clip-finder/python-sdk)
- [Java SDK](https://github.com/youtube-clip-finder/java-sdk) 