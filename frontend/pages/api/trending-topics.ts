import { NextApiRequest, NextApiResponse } from 'next';

interface TrendingTopic {
  id: string;
  name: string;
  tweet_volume: number;
  url: string;
  promoted_content?: string;
  query: string;
  category: string;
  postCountText: string;
}

interface TrendingTopicsResponse {
  trends: TrendingTopic[];
  region: string;
  timestamp: string;
}

// Mock data for development - replace with actual Twitter API calls
export const getMockTrendingTopics = (region: string): TrendingTopic[] => {
  const mockData: { [key: string]: TrendingTopic[] } = {
    pakistan: [
      { id: '1', name: '#PakistanHameshaZindabad', tweet_volume: 8773, url: '#', query: '#PakistanHameshaZindabad', category: 'Only on X · Trending', postCountText: '8,773 posts' },
      { id: '2', name: '#14AugustBalochistanKeSang', tweet_volume: 0, url: '#', query: '#14AugustBalochistanKeSang', category: '#14AugustBalochistanKeSang', postCountText: '' },
      { id: '3', name: '#آزادی_بھی_قید_میں_ہے', tweet_volume: 10100, url: '#', query: '#آزادی_بھی_قید_میں_ہے', category: '#آزادی_بھی_قید_میں_ہے', postCountText: '10.1K posts' },
      { id: '4', name: 'Sir Abdullah Haroon', tweet_volume: 0, url: '#', query: 'Sir Abdullah Haroon', category: 'Pakistan', postCountText: '' },
      { id: '5', name: '#حقیقی_آزادی_کی_تحریک', tweet_volume: 157000, url: '#', query: '#حقیقی_آزادی_کی_تحریک', category: '#حقیقی_آزادی_کی_تحریک', postCountText: '157K posts' },
      { id: '6', name: '#BajaurUnderStateAttack', tweet_volume: 6072, url: '#', query: '#BajaurUnderStateAttack', category: '#BajaurUnderStateAttack', postCountText: '6,072 posts' },
      { id: '7', name: 'Shai Hope', tweet_volume: 3784, url: '#', query: 'Shai Hope', category: 'Pakistan', postCountText: '3,784 posts' },
      { id: '8', name: 'Quaid-e-Azam', tweet_volume: 0, url: '#', query: 'Quaid-e-Azam', category: 'Pakistan', postCountText: '' },
      { id: '9', name: 'bla and majeed brigade', tweet_volume: 2439, url: '#', query: 'bla and majeed brigade', category: 'Pakistan', postCountText: '2,439 posts' },
      { id: '10', name: 'Jayden Seales', tweet_volume: 1877, url: '#', query: 'Jayden Seales', category: 'Pakistan', postCountText: '1,877 posts' },
      { id: '11', name: 'governor house sindh', tweet_volume: 0, url: '#', query: 'governor house sindh', category: 'Pakistan', postCountText: '' },
      { id: '12', name: 'Rizwan', tweet_volume: 6217, url: '#', query: 'Rizwan', category: 'Pakistan', postCountText: '6,217 posts' },
      { id: '13', name: 'governor kamran tessori', tweet_volume: 0, url: '#', query: 'governor kamran tessori', category: 'Pakistan', postCountText: '' },
      { id: '14', name: 'kaifi khalil', tweet_volume: 0, url: '#', query: 'kaifi khalil', category: 'Pakistan', postCountText: '' },
      { id: '15', name: 'hasan raheem', tweet_volume: 0, url: '#', query: 'hasan raheem', category: 'Pakistan', postCountText: '' },
      { id: '16', name: 'Caa2', tweet_volume: 0, url: '#', query: 'Caa2', category: 'Pakistan', postCountText: '' },
      { id: '17', name: 'West Indies', tweet_volume: 10800, url: '#', query: 'West Indies', category: '', postCountText: '10.8K posts' },
      { id: '18', name: 'Mumbai Indians · Trending', tweet_volume: 9456, url: '#', query: 'Mumbai Indians · Trending', category: '', postCountText: '9,456 posts' },
      { id: '19', name: '3rd odi', tweet_volume: 0, url: '#', query: '3rd odi', category: 'Pakistan', postCountText: '' },
      { id: '20', name: 'Taylor', tweet_volume: 483000, url: '#', query: 'Taylor', category: 'Pakistan', postCountText: '483K posts' },
      { id: '21', name: '$SPECT', tweet_volume: 1478, url: '#', query: '$SPECT', category: 'Pakistan', postCountText: '1,478 posts' },
      { id: '22', name: 'Indus Waters Treaty', tweet_volume: 8903, url: '#', query: 'Indus Waters Treaty', category: 'Pakistan', postCountText: '8,903 posts' },
      { id: '23', name: 'Naseem Shah', tweet_volume: 0, url: '#', query: 'Naseem Shah', category: 'Pakistan', postCountText: '' },
      { id: '24', name: 'Bilawal Bhutto Zardari', tweet_volume: 0, url: '#', query: 'Bilawal Bhutto Zardari', category: 'Pakistan', postCountText: '' },
      { id: '25', name: 'Adiala Jail', tweet_volume: 10700, url: '#', query: 'Adiala Jail', category: 'Pakistan', postCountText: '10.7K posts' },
      { id: '26', name: 'SKYNANI SMYLE NEONA AT SF', tweet_volume: 284000, url: '#', query: 'SKYNANI SMYLE NEONA AT SF', category: 'Pakistan', postCountText: '284K posts' },
      { id: '27', name: '$SOL', tweet_volume: 124000, url: '#', query: '$SOL', category: 'Pakistan', postCountText: '124K posts' },
      { id: '28', name: 'Gandapur', tweet_volume: 1563, url: '#', query: 'Gandapur', category: 'Pakistan', postCountText: '1,563 posts' },
      { id: '29', name: 'Politics · Trending', tweet_volume: 8720, url: '#', query: 'Politics · Trending', category: 'Azerbaijan', postCountText: '8,720 posts' },
      { id: '30', name: 'Mohsin Naqvi', tweet_volume: 0, url: '#', query: 'Mohsin Naqvi', category: 'Pakistan', postCountText: '' },
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
