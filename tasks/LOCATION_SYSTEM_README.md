# Enhanced Location System for Trending Topics

## Overview

The trending topics page now supports multiple location types: **Region**, **City**, **Country**, and **Global**. This enhancement provides users with more granular control over the content they want to explore based on their geographical or topical interests.

## Features

### 1. Location Type Selection
- **Region**: Geographic regions (e.g., Pakistan, India, USA)
- **City**: Specific cities within countries (e.g., Karachi, Mumbai, New York)
- **Country**: Nation-level locations (e.g., Pakistan, India, USA)
- **Global**: Worldwide trending topics and international content

### 2. Smart Filtering
- Cities are automatically filtered based on their parent country
- Each location type provides contextually relevant trending topics
- Seamless switching between location types without losing context

### 3. Enhanced API Integration
- Gemini API prompts are customized based on location type
- More specific and relevant trending topics for each location type
- Improved fallback data for different location categories

## Components

### LocationSelector
- **File**: `src/components/TrendingTopics/LocationSelector.tsx`
- **CSS**: `src/components/TrendingTopics/TrendingTopics.module.css`
- **Features**: 
  - Two-dropdown system (Type + Location)
  - Visual indicators with flags and emojis
  - Responsive design for mobile devices

### HeaderSection
- **File**: `src/components/TrendingTopics/HeaderSection.tsx`
- **Integration**: Replaces old region selector with new LocationSelector
- **Maintains**: All existing functionality (refresh, cache clear, etc.)

## Data Structure

### Location Data
- **File**: `src/data/locationData.ts`
- **Structure**: Organized by location type with helper functions
- **Features**:
  - 20+ regions
  - 50+ cities across major countries
  - 50+ countries worldwide
  - 10 global categories

### Helper Functions
```typescript
getCitiesByCountry(countryValue: string): LocationOption[]
getLocationsByType(type: 'region' | 'city' | 'country' | 'global'): LocationOption[]
getLocationByValue(value: string): LocationOption | undefined
```

## API Enhancements

### Gemini Trending Topics API
- **Endpoint**: `/api/gemini-trending-topics`
- **New Parameters**:
  - `location`: The selected location value
  - `locationType`: The type of location (region/city/country/global)
- **Enhanced Prompts**: Context-specific prompts for each location type

### Prompt Customization
- **City**: Focus on local events, community news, city-specific developments
- **Country**: National news, government policies, country-wide trends
- **Global**: International news, worldwide trends, cross-border developments
- **Region**: Regional events, local interests, cultural developments

## Usage Examples

### Selecting a City
1. Choose "City" from the Type dropdown
2. Select a city (e.g., "Karachi")
3. Get trending topics specific to Karachi

### Selecting Global Content
1. Choose "Global" from the Type dropdown
2. Select a global category (e.g., "Trending Everywhere")
3. Get worldwide trending topics

### Switching Location Types
- Changing location type automatically resets location selection
- Previous selections are cleared to prevent confusion
- Cache is managed separately for each location type + location combination

## Cache Management

### Cache Keys
- Format: `{locationType}_{location}`
- Examples: `city_karachi`, `country_pakistan`, `global_trending`

### Cache Operations
- **Clear Cache**: Removes cached data for current location
- **Auto-refresh**: Fetches fresh data when cache expires
- **Force Refresh**: Bypasses cache for immediate fresh data

## Responsive Design

### Mobile Optimization
- Dropdowns stack vertically on small screens
- Touch-friendly interface elements
- Optimized spacing for mobile devices

### Desktop Experience
- Side-by-side dropdown layout
- Hover effects and visual feedback
- Efficient use of horizontal space

## Future Enhancements

### Planned Features
- **Location History**: Remember user's recent location selections
- **Favorites**: Allow users to save preferred locations
- **Auto-detection**: Detect user's current location automatically
- **Trending Locations**: Show which locations are currently trending

### API Improvements
- **Real-time Updates**: WebSocket integration for live trending data
- **Location Analytics**: Track which locations generate most engagement
- **Smart Suggestions**: AI-powered location recommendations

## Technical Notes

### State Management
- Location type and location are managed separately
- State changes trigger appropriate API calls
- Cache invalidation on location changes

### Performance
- Lazy loading of location options
- Efficient caching strategy
- Minimal re-renders on location changes

### Error Handling
- Graceful fallback to mock data
- User-friendly error messages
- Automatic retry mechanisms

## Migration Notes

### From Old System
- Old `selectedRegion` → New `selectedLocation` + `selectedLocationType`
- Cache keys updated to include location type
- API calls now include both parameters

### Backward Compatibility
- Existing region-based functionality preserved
- Default location type is 'region'
- Legacy cache keys still supported

## Troubleshooting

### Common Issues
1. **No cities showing**: Check if country is selected when city type is chosen
2. **Cache not clearing**: Verify cache key format matches new structure
3. **API errors**: Ensure both location and locationType parameters are provided

### Debug Information
- Check browser console for API call details
- Verify cache keys in localStorage
- Monitor network requests for parameter validation

## Contributing

When adding new locations:
1. Update `locationData.ts` with new entries
2. Ensure proper categorization by type
3. Add appropriate flags/emojis
4. Test with different location types
5. Update documentation if needed
