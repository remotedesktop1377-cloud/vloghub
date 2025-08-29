import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';
import { HelperFunctions } from '@/utils/helperFunctions';

interface GeminiTrendingTopic {
  id: string;
  category: string;
  topic: string;
  value: number;
  timestamp: string;
  description?: string;
  source_reference?: string;
  engagement_count?: number;
}

interface GeminiTrendingTopicsResponse {
  success: boolean;
  location: string;
  locationType: string;
  dateRange: string;
  timestamp: string;
  data: GeminiTrendingTopic[];
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const fetchGeminiTrendingTopics = async (location: string, locationType: string = 'region', dateRange: string = '24h'): Promise<GeminiTrendingTopic[]> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI.MODEL });

    // Get time range description for the prompt
    const timeRangeDescription = HelperFunctions.getTimeRangeDescription(dateRange);

    // Enhanced prompt based on location type and date range
    let prompt = '';
    
    switch (locationType) {
      case 'city':
        prompt = `Generate the top 20 trending topics for the city of ${location} from the ${timeRangeDescription} with realistic engagement metrics. 
        Focus on local events, city-specific news, local businesses, community happenings, city sports teams, local entertainment, and urban development that are popular in ${location}.
        Include topics that residents of ${location} would be discussing on social media, local news, and community platforms.`;
        break;
        
      case 'country':
        prompt = `Generate the top 20 trending topics for ${location} from the ${timeRangeDescription} with realistic engagement metrics. 
        Focus on national news, government policies, national sports events, country-wide entertainment, economic developments, and cultural events that are popular across ${location}.
        Include topics that citizens of ${location} would be discussing on social media, national news, and popular platforms.`;
        break;
        
      case 'global':
        prompt = `Generate a comprehensive list of the top 20 topics from the ${timeRangeDescription} for a global scope. 
        The topics should be based on international news, global events, worldwide entertainment, international sports, global technology trends, and cross-border developments that are trending worldwide.`;
        break;
        
      default: // region
        prompt = `Generate the top 20 trending topics for the ${locationType} of ${location} from the ${timeRangeDescription} with realistic engagement metrics. 
        Focus on regional events, local news, regional entertainment, sports, technology, and cultural interests that are popular in the ${location} ${locationType}.
        Include topics that people in the ${location} ${locationType} would be discussing on social media, regional news, and local platforms.`;
    }

    prompt += ` Return the response as a JSON array with exactly 20 items, each containing:
    - topic: the trending topic name (keep it concise, 2-5 words)
    - category: one of [News, Entertainment, Sports, Technology, Politics, Social, Business, Education, Health, Culture]
    - engagement_count: realistic number representing posts/mentions/views (range: 50,000 to 2,000,000)
    - source_reference: a brief source like "Twitter", "News Media", "YouTube", "TikTok", etc.
    - description: brief explanation of why it's trending
    Sort by engagement_count (highest first). Make the engagement numbers realistic and varied.
    Format: [{"topic": "topic name", "category": "category", "engagement_count": 150000, "source_reference": "Twitter", "description": "brief description"}]`;
    
    // console.log('📌 Gemini Prompt:', prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);

    // Transform to match our interface
    const transformedData = parsedData.map((item: any, index: number) => ({
      id: `gemini-${index + 1}`,
      category: item.category || 'Social',
      topic: item.topic || 'Unknown Topic',
      value: item.engagement_count || (2000000 - (index * 100000)), // Use actual engagement count
      timestamp: new Date().toISOString(),
      description: item.description || undefined,
      source_reference: item.source_reference || undefined,
      engagement_count: item.engagement_count || undefined,
    }));
    
    // Sort by value (higher = first)
    return transformedData.sort((a: any, b: any) => b.value - a.value);

  } catch (error) {
    console.error('Error fetching Gemini trending topics:', error);
    
    // Enhanced fallback data based on location type and date range
    let fallbackTopics: GeminiTrendingTopic[] = [];
    
    if (locationType === 'city') {
      fallbackTopics = [
        {
          id: 'gemini-1',
          category: 'Local News',
          topic: `${location} City Updates`,
          value: 1850000,
          timestamp: new Date().toISOString(),
          description: `Latest local news and developments in ${location}`,
          source_reference: 'Local News, Social Media',
          engagement_count: 1850000,
        },
        {
          id: 'gemini-2',
          category: 'Community',
          topic: `${location} Community Events`,
          value: 1650000,
          timestamp: new Date().toISOString(),
          description: `Upcoming community events and local gatherings in ${location}`,
          source_reference: 'Community Forums, Local Media',
          engagement_count: 1650000,
        },
        // Add more city-specific fallback topics...
      ];
    } else if (locationType === 'country') {
      fallbackTopics = [
        {
          id: 'gemini-1',
          category: 'National News',
          topic: `${location} National Updates`,
          value: 1850000,
          timestamp: new Date().toISOString(),
          description: `Latest national news and developments in ${location}`,
          source_reference: 'National News, Social Media',
          engagement_count: 1850000,
        },
        {
          id: 'gemini-2',
          category: 'Politics',
          topic: `${location} Government News`,
          value: 1650000,
          timestamp: new Date().toISOString(),
          description: `Government policies and political developments in ${location}`,
          source_reference: 'Political News, Social Media',
          engagement_count: 1650000,
        },
        // Add more country-specific fallback topics...
      ];
    } else if (locationType === 'global') {
      fallbackTopics = [
        {
          id: 'gemini-1',
          category: 'International News',
          topic: 'Global Breaking News',
          value: 1850000,
          timestamp: new Date().toISOString(),
          description: 'Latest international breaking news and global developments',
          source_reference: 'International News, Social Media',
          engagement_count: 1850000,
        },
        {
          id: 'gemini-2',
          category: 'Technology',
          topic: 'Global Tech Trends',
          value: 1650000,
          timestamp: new Date().toISOString(),
          description: 'Latest technology trends and innovations worldwide',
          source_reference: 'Tech News, Social Media',
          engagement_count: 1650000,
        },
        // Add more global fallback topics...
      ];
    } else {
      // Default region fallback (existing Pakistan data)
      fallbackTopics = [
        {
          id: 'gemini-1',
          category: 'Politics',
          topic: 'Imran Khan Cases',
          value: 1850000,
          timestamp: new Date().toISOString(),
          description: 'Legal proceedings and court hearings related to former PM Imran Khan continue to dominate headlines',
          source_reference: 'News Media, Twitter',
          engagement_count: 1850000,
        },
        {
          id: 'gemini-2',
          category: 'Sports',
          topic: 'T20 World Cup 2024',
          value: 1650000,
          timestamp: new Date().toISOString(),
          description: 'Cricket fans discussing Pakistan team performance and upcoming matches in the T20 World Cup',
          source_reference: 'Sports Media, Twitter, YouTube',
          engagement_count: 1650000,
        },
        // ... existing fallback topics ...
      ];
    }
    
    // Sort by value (higher = first)
    return fallbackTopics.sort((a, b) => b.value - a.value);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeminiTrendingTopicsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { location = 'pakistan', locationType = 'region', dateRange = '24h' } = req.query;
    const locationString = Array.isArray(location) ? location[0] : location;
    const locationTypeString = Array.isArray(locationType) ? locationType[0] : locationType;
    const dateRangeString = Array.isArray(dateRange) ? dateRange[0] : dateRange;

    // Validate location type
    const validLocationTypes = ['region', 'city', 'country', 'global'];
    if (!validLocationTypes.includes(locationTypeString)) {
      return res.status(400).json({ error: 'Invalid location type. Must be one of: region, city, country, global' });
    }

    // Validate date range
    const validDateRanges = ['24h', '7d', '30d', 'anytime'];
    if (!validDateRanges.includes(dateRangeString)) {
      return res.status(400).json({ error: 'Invalid date range. Must be one of: 24h, 7d, 30d, anytime' });
    }

    // Fetch trending topics from Gemini API with location type and date range
    const trends = await fetchGeminiTrendingTopics(locationString, locationTypeString, dateRangeString);

    const response: GeminiTrendingTopicsResponse = {
      success: true,
      location: locationString,
      locationType: locationTypeString,
      dateRange: dateRangeString,
      timestamp: new Date().toISOString(),
      data: trends,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in Gemini trending topics API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 
