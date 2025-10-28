# Envato Elements API Integration Setup

This guide will help you set up the Envato Elements API integration for image search functionality.

## Prerequisites

1. **Envato Elements Account**: You need an active Envato Elements subscription
2. **Envato API Access**: You need to have API access enabled on your account

## Getting Your API Key

### Step 1: Access Envato API
1. Go to [Envato API Documentation](https://build.envato.com/api/)
2. Sign in with your Envato account
3. Navigate to the "Personal Token" section

### Step 2: Generate Personal Token
1. Click on "Create a Personal Token"
2. Give your token a descriptive name (e.g., "YouTube Clip Searcher")
3. Select the required scopes:
   - `view-sensitive`: Required for accessing catalog data
   - `purchase:read`: Optional, for purchase history
4. Click "Create Token"
5. **Important**: Copy and save your token immediately - you won't be able to see it again

## Environment Configuration

### Step 3: Add API Key to Environment Variables

Add the following to your `frontend/.env.local` file:

```env
# Envato Elements API Configuration
ENVATO_API_KEY=your_personal_token_here

# Optional: Configure items per page (default: 20, max: 100)
ENVATO_ITEMS_PER_PAGE=20
```

### Example Configuration
```env
ENVATO_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
ENVATO_ITEMS_PER_PAGE=20
```

## API Endpoints Used

The integration uses the following Envato API endpoints:

### Search Catalog
- **Endpoint**: `https://api.envato.com/v1/discovery/search/search/item`
- **Method**: GET
- **Purpose**: Search for images, graphics, and templates
- **Authentication**: Bearer token in Authorization header

### Parameters Supported
- `term`: Search query
- `site`: Envato marketplace site (photodune.net, graphicriver.net, themeforest.net, etc.)
- `page`: Page number (1-60)
- `page_size`: Items per page (1-100)
- `sort_by`: Sort order (relevance, popularity, etc.)

### Default Site Configuration
- **Default Site**: `photodune.net` - Stock photography only
- **Content Type**: High-quality stock photos and images

## Features Integrated

### 1. Image Search
- **Photos Only**: Stock photography from PhotoDune
- **High Quality**: Professional stock images

### 2. Search Functionality
- Auto-generated search queries from SceneData narration
- Manual search with custom queries
- Pagination support

### 3. Image Information
- High-quality preview images
- Author information
- Pricing information (Free with subscription)
- Download links to Envato Elements
- Image dimensions and metadata

## Usage in Application

### Accessing Envato Images
1. Open the Media Management dialog for any SceneData
2. Click on the "Envato Elements" tab
3. Search results will auto-populate based on SceneData narration
4. Use category filters to refine results
5. Select images and click "Done" to add to SceneData

### Search Tips
- Use descriptive keywords for better results
- Try different categories for varied content types
- Combine with Google Images for comprehensive coverage
- Use the "Search Both" button to query both APIs simultaneously

## Troubleshooting

### Common Issues

#### 1. "Envato API not configured" Error
**Problem**: API key not set in environment variables
**Solution**: Add `ENVATO_API_KEY` to your `.env.local` file

#### 2. "Unauthorized" Error (401)
**Problem**: Invalid or expired API key
**Solution**: 
- Verify your API key is correct
- Check if your Envato Elements subscription is active
- Regenerate your personal token if needed

#### 3. "No images found" Message
**Problem**: Search query returns no results
**Solutions**:
- Try broader search terms
- Switch between different categories
- Check your internet connection
- Verify the Envato API service is operational

#### 4. Rate Limiting
**Problem**: Too many API requests
**Solution**: 
- The app includes built-in rate limiting
- Wait a few minutes before making more requests
- Consider reducing search frequency

### API Limits

- **Rate Limiting**: Envato API has rate limits per account
- **Daily Quota**: Check your account for daily request limits
- **Items per Page**: Maximum 100 items per request
- **Pages**: Maximum 60 pages per search (6,000 items total per query)
- **Site-Specific**: Each category maps to a specific Envato marketplace site

## Development Notes

### File Structure
```
frontend/
├── app/api/envato-image-search/
│   └── route.ts                    # Envato API endpoint
├── src/components/TrendingTopicsComponent/
│   ├── ImageSearch.tsx            # Combined image search component
│   └── ImageSearch.module.css     # Component styles
└── src/config/
    └── apiEndpoints.ts            # API endpoint configuration
```

### API Response Structure
The Envato API returns data in this format:
```json
{
  "total_hits": 77017,
  "matches": [
    {
      "id": 4972569,
      "name": "cat",
      "description": "surprised cat on white background",
      "site": "photodune.net",
      "classification": "misc",
      "price_cents": 500,
      "author_username": "cristi180884",
      "author_url": "https://photodune.net/user/cristi180884",
      "url": "https://photodune.net/item/cat/4972569",
      "previews": {
        "thumbnail_preview": {
          "small_url": "https://...",
          "large_url": "https://...",
          "large_width": 320,
          "large_height": 269
        },
        "icon_with_thumbnail_preview": {
          "icon_url": "https://...",
          "thumbnail_url": "https://..."
        }
      },
      "photo_attributes": [
        {
          "name": "max_width",
          "value": 3237
        },
        {
          "name": "full_resolution_in_megapixels",
          "value": 8.8
        }
      ],
      "tags": ["cat", "feline", "furry", "gray"]
    }
  ]
}
```

## Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Environment Variables**: Always use `.env.local` for sensitive data
3. **Server-Side Only**: API calls are made server-side to protect credentials
4. **CORS**: API endpoints are configured for same-origin requests only

## Support

For issues with:
- **Envato API**: Contact [Envato Support](https://help.market.envato.com/)
- **Application Integration**: Check the troubleshooting section above
- **Account Issues**: Verify your Envato Elements subscription status

## Additional Resources

- [Envato API Documentation](https://build.envato.com/api/)
- [Envato Elements](https://elements.envato.com/)
- [API Rate Limits](https://build.envato.com/api/#rate-limiting)
- [Personal Token Management](https://build.envato.com/api/#personal-token)
