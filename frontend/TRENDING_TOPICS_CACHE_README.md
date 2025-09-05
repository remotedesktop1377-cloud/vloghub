# Trending Topics Caching System

## Overview
The Trending Topics feature now includes a robust caching system that stores trending topics data locally and only fetches fresh data when explicitly requested via the refresh button.

## Features

### 🚀 **Smart Caching**
- **Automatic Cache**: Trending topics are automatically cached in localStorage
- **Cache Duration**: Data is cached for 30 minutes before expiring
- **Region-Specific**: Each region has its own cache (e.g., `trending_topics_pakistan`)
- **Automatic Cleanup**: Expired cache entries are automatically removed

### 📱 **User Experience**
- **Instant Loading**: Page loads instantly from cache on refresh
- **Visual Indicators**: Clear indicators show when data is from cache vs fresh
- **Cache Status**: Header shows last updated time and cache status
- **Manual Control**: Users can manually clear cache or force refresh

### 🔄 **Refresh Behavior**
- **Page Load/Refresh**: Always fetches fresh data from Gemini API (ignores cache)
- **Location/Date Change**: Uses cached data if available and valid (within 30 minutes)
- **Refresh Button**: Fetches fresh data from Gemini API
- **Cache Expiry**: Automatically falls back to API when cache expires

## Implementation Details

### Cache Structure
```typescript
interface CachedData<T> {
  data: T;
  timestamp: string;
}
```

### Cache Key Format
```
trending_topics_{region}
```
Example: `trending_topics_pakistan`, `trending_topics_global`

### Cache Validation
- **Fresh Data**: Less than 30 minutes old (shows "Fresh" badge)
- **Cached Data**: Up to 30 minutes old (shows "Cached" badge)
- **Expired Data**: Automatically removed and replaced with fresh data

## User Interface Elements

### Header Section
- **Last Updated**: Shows when data was last fetched
- **Status Badge**: "Fresh" (green) or "Cached" (gray)
- **Expiry Info**: Shows when cache will expire (for cached data)
- **Refresh Button**: Fetches fresh data from Gemini API
- **Clear Cache Button**: Manually clears cache for current region

### Topic Items
- **Cache Indicator**: Small "Cached" badge on each topic (when applicable)
- **Tooltip**: Hover to see "Data from cache - click refresh for fresh data"

### Word Cloud View
- **Cache Badge**: Shows "Cached" indicator in top-right corner
- **Visual Feedback**: Clear indication of data freshness

## Technical Implementation

### Custom Hook: `useTrendingTopicsCache`
```typescript
const {
  getCachedData,
  setCachedData,
  clearCache,
  isCacheValid,
  getCacheAge,
  getCacheKey
} = useTrendingTopicsCache();
```

### Cache Functions
- `getCachedData<T>(region)`: Retrieves cached data for a region
- `setCachedData(region, data)`: Stores data in cache for a region
- `clearCache(region?)`: Clears cache for specific region or all regions
- `isCacheValid(region)`: Checks if cache is still valid
- `getCacheAge(region)`: Gets age of cached data in milliseconds

### Error Handling
- **Graceful Fallback**: Falls back to mock data if cache operations fail
- **Console Logging**: Detailed error logging for debugging
- **User Feedback**: Toast notifications for cache operations

## Benefits

### 🎯 **Performance**
- **Faster Page Loads**: No API calls on page refresh
- **Reduced API Usage**: Only calls Gemini API when needed
- **Better UX**: Instant data display from cache

### 💰 **Cost Optimization**
- **API Call Reduction**: Minimizes Gemini API usage
- **Rate Limit Management**: Better control over API requests
- **Efficient Resource Usage**: Cached data reduces server load

### 🔒 **Reliability**
- **Offline Support**: Works even when API is temporarily unavailable
- **Consistent Experience**: Same data shown across page refreshes
- **Fallback Protection**: Graceful degradation to mock data

## Usage Examples

### Basic Usage
1. **First Visit**: Data fetched from Gemini API and cached
2. **Page Refresh**: Fresh data fetched from API (cache ignored)
3. **Location/Date Change**: Cached data used if available and valid
4. **Manual Refresh**: Click refresh button for fresh data
5. **Cache Clear**: Use clear cache button to remove stored data

### Advanced Usage
```typescript
// Force refresh (bypass cache)
fetchTrendingTopics(selectedRegion, true);

```

## Configuration

### Cache Duration
```typescript
const maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds
```

### Fresh Data Threshold
```typescript
const isDataFresh = diffMinutes < 30; // Consider data fresh if less than 30 minutes old
```

### Cache Keys
```typescript
const getCacheKey = (region: string) => `trending_topics_${region}`;
```

## Troubleshooting

### Common Issues
1. **Cache Not Working**: Check browser localStorage support
2. **Data Not Updating**: Clear cache manually or wait for expiry
3. **Performance Issues**: Check cache size and clear if needed

### Debug Mode
Enable console logging to see cache operations:
```typescript
console.log('Cache operations:', {
  region: selectedRegion,
  cacheKey: `trending_topics_${selectedRegion}`,
  lastUpdated,
  isDataFresh: isDataFresh(lastUpdated)
});
```

## Future Enhancements

### Planned Features
- **Cache Analytics**: Track cache hit rates and performance
- **Smart Refresh**: Automatic refresh based on data age
- **Cache Compression**: Reduce localStorage usage
- **Background Sync**: Update cache in background
- **Cache Sharing**: Share cache across browser tabs

### Advanced Caching
- **Service Worker**: Offline-first caching strategy
- **IndexedDB**: Larger cache storage for historical data
- **Cache Invalidation**: Smart cache invalidation strategies
- **Prefetching**: Preload data for adjacent regions

## Conclusion

The caching system provides a significant improvement in user experience while maintaining data freshness and reducing API costs. Users can now enjoy instant page loads while still having control over when to fetch fresh data.
