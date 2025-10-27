# Google Image Search Integration Setup

This guide explains how to set up the Google Custom Search API for image search functionality in the application.

## Prerequisites

### Required Google Cloud APIs

1. **Google Custom Search JSON API**
2. **Google Drive API** (for future image storage features)

### Required Credentials

1. **Google Custom Search API Key**
2. **Google Custom Search Engine ID (CX)**

## Setup Instructions

### 1. Google Cloud Console Setup

#### Enable APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Custom Search JSON API
   - Google Drive API (optional, for future features)

#### Create Custom Search Engine
1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. Set "Sites to search" to `www.google.com`
4. Enable "Image search" in the setup
5. Create the search engine and note the **Search engine ID (CX)**

#### Get Custom Search API Key
1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key for later use
4. (Optional) Restrict the API key to only the Custom Search JSON API

### 2. Environment Configuration

Create a `.env.local` file in the `frontend` directory with the following content:

```env
# Google Custom Search API Configuration
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=your_search_engine_id_here

# Search Configuration
IMAGES_PER_PAGE=15
ENABLE_UNIQUE_FILTERING=true
```

### 3. API Endpoint

The Google Image Search API endpoint is available at:
```
POST /api/google-image-search
```

**Request Body:**
```json
{
  "query": "search term",
  "page": 1
}
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "image_url",
      "url": "full_image_url",
      "thumbnail": "thumbnail_url",
      "title": "image_title",
      "context": "source_page_url",
      "width": 1920,
      "height": 1080,
      "size": "file_size_in_bytes",
      "mime": "image/jpeg"
    }
  ],
  "totalResults": 1000,
  "currentPage": 1,
  "hasMore": true
}
```

## Features

### 🔍 **Google Image Search**
- Search for images using Google's Custom Search API
- Auto-generates search queries from SceneData narration
- Supports pagination for large result sets

### 🖼️ **Image Preview**
- Click on thumbnails to view full-size images
- Opens images in new tab for preview
- Responsive grid layout for different screen sizes

### ✅ **Multi-Select**
- Select multiple images with checkboxes
- Select all/deselect all functionality
- Batch add selected images to SceneData

### 📊 **Image Information**
- Display image dimensions, file size, and format
- Show image titles and source context
- Download images directly to local storage

### 🎯 **Smart Search**
- Automatically uses SceneData narration as initial search query
- Allows manual search query input
- Error handling and loading states

## Usage

1. **Navigate to Script Production** - Go to the script production page
2. **Open Media Management** - Click on the media management button for any SceneData
3. **Select Google Search Tab** - Click on the "Google Search" tab
4. **Search Images** - The search will automatically use your SceneData narration, or enter a custom search term
5. **Select Images** - Click on images to select them, or use the select all/deselect all buttons
6. **Add to SceneData** - Click "Add X Images" to add selected images to your SceneData

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure your API key is correct and not restricted
   - Check that the Custom Search JSON API is enabled

2. **Search Engine ID Errors**
   - Verify your search engine ID (CX) is correct
   - Ensure image search is enabled in your search engine

3. **Rate Limiting**
   - Google Custom Search API has daily quotas
   - Monitor usage in Google Cloud Console

4. **Environment Variables**
   - Ensure `.env.local` file is in the correct location
   - Restart the development server after adding environment variables

### Debug Tools

Use the debug tool at `/debug-google-search` to:
- Test your API configuration
- Verify environment variables are loaded
- Test the search API directly
- View detailed error messages

### Quick Debug Steps

1. **Check Configuration**: Visit `/debug-google-search` and click "Test Config"
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Test API Directly**: Use the debug tool to test search functionality
4. **Check Console Logs**: Look for detailed error messages in browser console
5. **Verify API Quotas**: Check Google Cloud Console for API usage limits

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API credentials are correct
3. Ensure all environment variables are set
4. Check Google Cloud Console for API usage and quotas
