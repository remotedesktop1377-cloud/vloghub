import { NextApiRequest, NextApiResponse } from 'next';

interface TrendingTopic {
  id: string;
  name: string;
  tweet_volume: number;
  url: string;
  promoted_content?: string;
  query: string;
}

interface TrendingTopicsResponse {
  trends: TrendingTopic[];
  region: string;
  timestamp: string;
}

// Mock data for development - replace with actual Twitter API calls
const getMockTrendingTopics = (region: string): TrendingTopic[] => {
  const mockData: { [key: string]: TrendingTopic[] } = {
    pakistan: [
      { id: '1', name: '#PakistanCricket', tweet_volume: 125000, url: '#', query: 'PakistanCricket' },
      { id: '2', name: '#NelsonMandela', tweet_volume: 89000, url: '#', query: 'NelsonMandela' },
      { id: '3', name: '#LahoreFood', tweet_volume: 67000, url: '#', query: 'LahoreFood' },
      { id: '4', name: '#PakistaniStartups', tweet_volume: 45000, url: '#', query: 'PakistaniStartups' },
      { id: '5', name: '#IslamabadTraffic', tweet_volume: 32000, url: '#', query: 'IslamabadTraffic' },
      { id: '6', name: '#PakistaniMusic', tweet_volume: 28000, url: '#', query: 'PakistaniMusic' },
      { id: '7', name: '#PakistaniFashion', tweet_volume: 22000, url: '#', query: 'PakistaniFashion' },
      { id: '8', name: '#PakistaniTech', tweet_volume: 18000, url: '#', query: 'PakistaniTech' },
      { id: '9', name: '#PakistaniEducation', tweet_volume: 15000, url: '#', query: 'PakistaniEducation' },
      { id: '10', name: '#PakistaniSports', tweet_volume: 12000, url: '#', query: 'PakistaniSports' },
    ],
  };

  return mockData[region] || mockData.pakistan;
};

// Function to fetch real trending topics from Twitter API
const fetchTwitterTrendingTopics = async (region: string): Promise<TrendingTopic[]> => {
  try {
    // This is where you would implement the actual Twitter API call
    // You'll need to set up Twitter API credentials and use their endpoints
    
    // Example Twitter API v2 call (requires proper authentication):
   
    // const response = await fetch(`https://api.twitter.com/1.1/trends/place.json?id=23424922`, {
    const response = await fetch(`https://api.x.com/2/trends/by/woeid/23424922?max_trends=20`, {
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
        id: tweet.id,
        name: tweet.text,
        tweet_volume: Math.floor(Math.random() * 100000) + 1000, // Twitter doesn't provide tweet volume in v2
        url: `https://twitter.com/user/status/${tweet.id}`,
        query: tweet.text,
      }));
      
    }
    
  } catch (error) {
    console.error('Error fetching Twitter trending topics:', error);
    // Fallback to mock data
    return getMockTrendingTopics(region);
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
    const { region = 'pakistan' } = req.query;
    const regionString = Array.isArray(region) ? region[0] : region;

    // Fetch trending topics (mock data for now, replace with real Twitter API call)
    const trends = await fetchTwitterTrendingTopics(regionString);

    const response: TrendingTopicsResponse = {
      trends,
      region: regionString,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in trending topics API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
