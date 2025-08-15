import { NextApiRequest, NextApiResponse } from 'next';
import { mockTrendingTopics, TrendingTopic } from '../../src/data/mockTrendingTopics';

interface TrendingTopicsResponse {
  success: boolean;
  location: string;
  timestamp: string;
  data: TrendingTopic[];
}

// Function to fetch real trending topics from Twitter API
const fetchTwitterTrendingTopics = async (region: string): Promise<TrendingTopic[]> => {
  try {
    // This is where you would implement the actual Twitter API call
    // You'll need to set up Twitter API credentials and use their endpoints

    // Example Twitter API v2 call (requires proper authentication):

    // const response = await fetch(`https://api.twitter.com/1.1/trends/place.json?id=23424922`, {
    const response = await fetch(`https://af2ff5074c59.ngrok-free.app/api/trending?authkey=9876_secure_authentication_key_4321`, {
      headers: {
        'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    // console.log(response)
    if (!response.ok) {
      throw new Error('Twitter API request failed');
    } else {
      const data = await response.json();
      // Transform Twitter API response to match our TrendingTopic interface
      return data.data.map((tweet: any, index: number) => ({
        ranking: index + 1,
        category: tweet.category || '',
        topic: tweet.text,
        postCount: `${Math.floor(Math.random() * 100000) + 1000} posts`,
        postCountValue: Math.floor(Math.random() * 100000) + 1000,
        timestamp: new Date().toISOString(),
      }));

    }

  } catch (error) {
    console.error('Error fetching Twitter trending topics:', error);
    // Fallback to mock data
    return mockTrendingTopics;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrendingTopicsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { location = 'pakistan' } = req.query;
    const regionString = Array.isArray(location) ? location[0] : location;

    // Fetch trending topics (mock data for now, replace with real Twitter API call)
    const trends = await fetchTwitterTrendingTopics(regionString);

    const response: TrendingTopicsResponse = {
      success: true,
      location: regionString,
      timestamp: new Date().toISOString(),
      data: trends,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in trending topics API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
