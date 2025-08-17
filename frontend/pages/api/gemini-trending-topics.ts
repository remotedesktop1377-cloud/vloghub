import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

interface GeminiTrendingTopic {
  category: string;
  topic: string;
  value: number;
  timestamp: string;
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

    const prompt = `Generate the top 20 trending topics for ${region} as of today. 
    
    Focus on current events, social media trends, news, entertainment, sports, technology, and local interests that are popular in ${region}.
    
    Return the response as a JSON array with exactly 20 items, each containing:
    - topic: the trending topic name (keep it concise, 2-5 words)
    - category: one of [News, Entertainment, Sports, Technology, Politics, Social, Business, Education, Health, Culture]
    - description: brief explanation of why it's trending
    
    Format: [{"topic": "topic name", "category": "category", "description": "brief description"}]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    console.log(parsedData.length)

    // Transform to match our interface
    const transformedData = parsedData.map((item: any, index: number) => ({
      category: item.category || 'Social',
      topic: item.topic || 'Unknown Topic',
      value: 21 - (index + 1), // Higher index = larger value = bigger word in cloud
      timestamp: new Date().toISOString(),
    }));
    
    // Sort by value (higher = first)
    return transformedData.sort((a: any, b: any) => b.value - a.value);

  } catch (error) {
    console.error('Error fetching Gemini trending topics:', error);
    
    // Fallback data for Pakistan
    const fallbackTopics: GeminiTrendingTopic[] = [
      {
        category: 'Politics',
        topic: 'Imran Khan Cases',
        value: 20,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Sports',
        topic: 'T20 World Cup 2024',
        value: 19,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Politics',
        topic: 'Federal Budget FY25',
        value: 18,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'News',
        topic: 'Heatwave & Loadshedding',
        value: 17,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Business',
        topic: 'IMF Loan Negotiations',
        value: 16,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Culture',
        topic: 'Eid-ul-Adha Shopping',
        value: 15,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'News',
        topic: 'Petrol Price Increase',
        value: 14,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Entertainment',
        topic: 'Pakistani Dramas',
        value: 13,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Technology',
        topic: 'AI Adoption Pakistan',
        value: 12,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Social',
        topic: 'Social Media Challenges',
        value: 11,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Education',
        topic: 'Online Learning',
        value: 10,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Health',
        topic: 'Mental Health',
        value: 9,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Business',
        topic: 'Startup Ecosystem',
        value: 8,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Technology',
        topic: 'Digital Pakistan',
        value: 7,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Entertainment',
        topic: 'Bollywood News',
        value: 6,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Sports',
        topic: 'Cricket Updates',
        value: 5,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Social',
        topic: 'Climate Change',
        value: 4,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Culture',
        topic: 'Pakistani Cuisine',
        value: 3,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'News',
        topic: 'Regional Updates',
        value: 2,
        timestamp: new Date().toISOString(),
      },
      {
        category: 'Health',
        topic: 'Wellness Trends',
        value: 1,
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