# Trending Topics Feature

## Overview
The Trending Topics feature displays real-time trending topics from Twitter API for different regions, with Pakistan as the default region. It provides a modern, responsive interface to view what's currently trending across various locations.

## Features

### 🎯 **Regional Trending Topics**
- **Pakistan** (default) - Local Pakistani trends
- **Global** - Worldwide trending topics
- **India** - Indian regional trends
- **USA** - American trending topics
- **UK** - British trending topics
- **Canada** - Canadian trending topics
- **Australia** - Australian trending topics

### 🎨 **Visual Design**
- Modern gradient background with glassmorphism effects
- Color-coded ranking system (Gold, Silver, Bronze for top 3)
- Responsive grid layout
- Hover animations and smooth transitions
- Material-UI components with custom styling

### ⚡ **Functionality**
- Real-time data fetching from Twitter API
- Region selection dropdown with flag emojis
- Refresh button with rotation animation
- Loading states and error handling
- Tweet volume display with smart formatting (K, M)
- Last updated timestamp

## Components

### TrendingTopics Component
**Location**: `src/components/TrendingTopics/TrendingTopics.tsx`

**Props**:
- `region?: string` - Default region to display (defaults to 'pakistan')

**Features**:
- Fetches trending topics from API
- Handles region switching
- Displays trending topics in cards
- Shows ranking, topic name, and tweet volume

### TrendingTopicsPage Component
**Location**: `src/pages/TrendingTopics/TrendingTopicsPage.tsx`

**Purpose**: Page wrapper for the TrendingTopics component

## API Integration

### Current Implementation
- **Mock Data**: Currently uses mock data for development
- **API Endpoint**: `/api/trending-topics?region={region}`
- **Fallback**: Automatically falls back to mock data if API fails

### Twitter API Integration (Future)
To integrate with real Twitter API:

1. **Set up Twitter Developer Account**:
   - Apply for Twitter API access at [developer.twitter.com](https://developer.twitter.com)
   - Get your Bearer Token

2. **Environment Variables**:
   ```env
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
   ```

3. **Update API Function**:
   In `pages/api/trending-topics.ts`, uncomment and modify the Twitter API call:
   ```typescript
   const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${region}&max_results=10`, {
     headers: {
       'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
       'Content-Type': 'application/json',
     },
   });
   ```

4. **Note**: Twitter API v2 doesn't provide trending topics directly. You'll need to:
   - Use the `trends/place` endpoint (requires v1.1 access)
   - Or implement trending detection using search and analytics

## Styling

### CSS Modules
- **Component Styles**: `TrendingTopics.module.css`
- **Page Styles**: `TrendingTopicsPage.module.css`
- **Design System**: Uses custom CSS variables and gradients

### Key Styling Features
- **Gradient Background**: Purple to blue gradient
- **Glassmorphism**: Semi-transparent cards with backdrop blur
- **Color Coding**: Gold (#FFD700), Silver (#C0C0C0), Bronze (#CD7F32)
- **Responsive Design**: Mobile-first approach with breakpoints

## Usage

### Navigation
- **Dashboard Button**: Added to main Dashboard
- **Direct URL**: Navigate to `/trending-topics`
- **Default Region**: Pakistan (can be changed via dropdown)

### User Interaction
1. **Select Region**: Choose from dropdown menu
2. **View Trends**: See trending topics with rankings
3. **Refresh Data**: Click refresh button to update
4. **Responsive**: Works on all device sizes

## Mock Data Structure

```typescript
interface TrendingTopic {
  id: string;
  name: string;           // e.g., "#PakistanCricket"
  tweet_volume: number;   // e.g., 125000
  url: string;            // Twitter URL
  promoted_content?: string; // If promoted
  query: string;          // Search query
}
```

## Future Enhancements

### 🚀 **Planned Features**
- **Real-time Updates**: WebSocket integration for live updates
- **Trending History**: Historical trending data charts
- **Topic Categories**: Filter by news, sports, entertainment
- **User Preferences**: Save favorite regions
- **Export Data**: Download trending topics as CSV/JSON

### 🔗 **API Improvements**
- **Rate Limiting**: Implement proper API rate limiting
- **Caching**: Redis cache for trending data
- **Analytics**: Track trending topic performance
- **Webhooks**: Real-time Twitter webhook integration

## Technical Notes

### Performance
- **Lazy Loading**: Components load only when needed
- **Memoization**: React.memo for performance optimization
- **Error Boundaries**: Graceful fallback to mock data

### Security
- **API Keys**: Environment variable protection
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize region parameters

### Accessibility
- **ARIA Labels**: Proper screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes

## Troubleshooting

### Common Issues
1. **API Errors**: Check Twitter API credentials
2. **Styling Issues**: Verify CSS modules are imported correctly
3. **Performance**: Check for memory leaks in useEffect

### Debug Mode
Enable console logging for debugging:
```typescript
console.log('Fetching trending topics for region:', region);
console.log('API response:', data);
```

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Navigate to `/trending-topics`
4. Test different regions and refresh functionality

### Code Style
- Use TypeScript interfaces for type safety
- Follow React hooks best practices
- Implement proper error handling
- Add loading states for better UX

---

**Note**: This feature currently uses mock data for development. To use real Twitter data, follow the API integration steps above and ensure you have proper Twitter API access.
