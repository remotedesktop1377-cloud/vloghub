import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

interface GeminiTrendingTopic {
  ranking: number;
  category: string;
  topic: string;
  postCount: string;
  postCountValue: number;
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
    return parsedData.map((item: any, index: number) => ({
      ranking: index + 1,
      category: item.category || 'Social',
      topic: item.topic || 'Unknown Topic',
      postCount: `${(21 - (index + 1)) * 5000} posts`,
      postCountValue: 21 - (index + 1), // Higher ranking = larger value = bigger word in cloud
      timestamp: new Date().toISOString(),
    }));

  } catch (error) {
    console.error('Error fetching Gemini trending topics:', error);
    
    // Fallback data for Pakistan
    const fallbackTopics: GeminiTrendingTopic[] = [
      {
        ranking: 1,
        category: 'Politics',
        topic: 'Imran Khan Cases',
        postCount: '100,000 posts',
        postCountValue: 20,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 2,
        category: 'Sports',
        topic: 'T20 World Cup 2024',
        postCount: '95,000 posts',
        postCountValue: 19,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 3,
        category: 'Politics',
        topic: 'Federal Budget FY25',
        postCount: '90,000 posts',
        postCountValue: 18,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 4,
        category: 'News',
        topic: 'Heatwave & Loadshedding',
        postCount: '85,000 posts',
        postCountValue: 17,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 5,
        category: 'Business',
        topic: 'IMF Loan Negotiations',
        postCount: '80,000 posts',
        postCountValue: 16,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 6,
        category: 'Culture',
        topic: 'Eid-ul-Adha Shopping',
        postCount: '75,000 posts',
        postCountValue: 15,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 7,
        category: 'News',
        topic: 'Petrol Price Increase',
        postCount: '70,000 posts',
        postCountValue: 14,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 8,
        category: 'Entertainment',
        topic: 'Pakistani Dramas',
        postCount: '65,000 posts',
        postCountValue: 13,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 9,
        category: 'Technology',
        topic: 'AI Adoption Pakistan',
        postCount: '60,000 posts',
        postCountValue: 12,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 10,
        category: 'Social',
        topic: 'Social Media Challenges',
        postCount: '55,000 posts',
        postCountValue: 11,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 11,
        category: 'Education',
        topic: 'Online Learning',
        postCount: '50,000 posts',
        postCountValue: 10,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 12,
        category: 'Health',
        topic: 'Mental Health',
        postCount: '45,000 posts',
        postCountValue: 9,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 13,
        category: 'Business',
        topic: 'Startup Ecosystem',
        postCount: '40,000 posts',
        postCountValue: 8,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 14,
        category: 'Technology',
        topic: 'Digital Pakistan',
        postCount: '35,000 posts',
        postCountValue: 7,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 15,
        category: 'Entertainment',
        topic: 'Bollywood News',
        postCount: '30,000 posts',
        postCountValue: 6,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 16,
        category: 'Sports',
        topic: 'Cricket Updates',
        postCount: '25,000 posts',
        postCountValue: 5,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 17,
        category: 'Social',
        topic: 'Climate Change',
        postCount: '20,000 posts',
        postCountValue: 4,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 18,
        category: 'Culture',
        topic: 'Pakistani Cuisine',
        postCount: '15,000 posts',
        postCountValue: 3,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 19,
        category: 'News',
        topic: 'Regional Updates',
        postCount: '10,000 posts',
        postCountValue: 2,
        timestamp: new Date().toISOString(),
      },
      {
        ranking: 20,
        category: 'Health',
        topic: 'Wellness Trends',
        postCount: '5,000 posts',
        postCountValue: 1,
        timestamp: new Date().toISOString(),
      },
    ];
    
    return fallbackTopics;
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