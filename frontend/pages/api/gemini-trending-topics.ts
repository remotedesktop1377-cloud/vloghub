import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

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
  timestamp: string;
  data: GeminiTrendingTopic[];
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const fetchGeminiTrendingTopics = async (region: string): Promise<GeminiTrendingTopic[]> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI.MODEL });

    const prompt = `Generate the top 20 trending topics for ${region} as of last thirty minutes with realistic engagement metrics. 
    
    Focus on current events, social media trends, news, entertainment, sports, technology, and local interests that are popular in ${region}.
    
    Return the response as a JSON array with exactly 20 items, each containing:
    - topic: the trending topic name (keep it concise, 2-5 words)
    - category: one of [News, Entertainment, Sports, Technology, Politics, Social, Business, Education, Health, Culture]
    - engagement_count: realistic number representing posts/mentions/views (range: 50,000 to 2,000,000)
    - source_reference: a brief source like "Twitter", "News Media", "YouTube", "TikTok", etc.
    - description: brief explanation of why it's trending
    
    Sort by engagement_count (highest first). Make the engagement numbers realistic and varied.
    
    Format: [{"topic": "topic name", "category": "category", "engagement_count": 150000, "source_reference": "Twitter", "description": "brief description"}]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    // console.log('📊 Gemini API Response:', {
    //   totalTopics: parsedData.length,
    //   sampleTopic: parsedData[0],
    // });

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
    
    // Fallback data for Pakistan with realistic engagement metrics
    const fallbackTopics: GeminiTrendingTopic[] = [
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
      {
        id: 'gemini-3',
        category: 'Politics',
        topic: 'Federal Budget FY25',
        value: 1420000,
        timestamp: new Date().toISOString(),
        description: 'Public discourse on the newly announced federal budget and its impact on economy and taxation',
        source_reference: 'News Media, Economic Forums',
        engagement_count: 1420000,
      },
      {
        id: 'gemini-4',
        category: 'News',
        topic: 'Heatwave & Loadshedding',
        value: 1280000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-5',
        category: 'Business',
        topic: 'IMF Loan Negotiations',
        value: 1150000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-6',
        category: 'Culture',
        topic: 'Eid-ul-Adha Shopping',
        value: 980000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-7',
        category: 'News',
        topic: 'Petrol Price Increase',
        value: 850000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-8',
        category: 'Entertainment',
        topic: 'Pakistani Dramas',
        value: 720000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-9',
        category: 'Technology',
        topic: 'AI Adoption Pakistan',
        value: 650000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-10',
        category: 'Social',
        topic: 'Social Media Challenges',
        value: 580000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-11',
        category: 'Education',
        topic: 'Online Learning',
        value: 520000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-12',
        category: 'Health',
        topic: 'Mental Health',
        value: 450000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-13',
        category: 'Business',
        topic: 'Startup Ecosystem',
        value: 380000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-14',
        category: 'Technology',
        topic: 'Digital Pakistan',
        value: 320000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-15',
        category: 'Entertainment',
        topic: 'Bollywood News',
        value: 280000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-16',
        category: 'Sports',
        topic: 'Cricket Updates',
        value: 220000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-17',
        category: 'Social',
        topic: 'Climate Change',
        value: 180000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-18',
        category: 'Culture',
        topic: 'Pakistani Cuisine',
        value: 150000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-19',
        category: 'News',
        topic: 'Regional Updates',
        value: 120000,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'gemini-20',
        category: 'Health',
        topic: 'Wellness Trends',
        value: 95000,
        timestamp: new Date().toISOString(),
      },
    ];
    
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
    const { location = 'pakistan' } = req.query;
    const regionString = Array.isArray(location) ? location[0] : location;

    // Fetch trending topics from Gemini API
    const trends = await fetchGeminiTrendingTopics(regionString);

    const response: GeminiTrendingTopicsResponse = {
      success: true,
      location: regionString,
      timestamp: new Date().toISOString(),
      data: trends,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in Gemini trending topics API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 