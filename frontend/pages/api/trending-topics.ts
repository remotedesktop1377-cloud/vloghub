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
      { id: '2', name: '#KarachiWeather', tweet_volume: 89000, url: '#', query: 'KarachiWeather' },
      { id: '3', name: '#LahoreFood', tweet_volume: 67000, url: '#', query: 'LahoreFood' },
      { id: '4', name: '#PakistaniStartups', tweet_volume: 45000, url: '#', query: 'PakistaniStartups' },
      { id: '5', name: '#IslamabadTraffic', tweet_volume: 32000, url: '#', query: 'IslamabadTraffic' },
      { id: '6', name: '#PakistaniMusic', tweet_volume: 28000, url: '#', query: 'PakistaniMusic' },
      { id: '7', name: '#PakistaniFashion', tweet_volume: 22000, url: '#', query: 'PakistaniFashion' },
      { id: '8', name: '#PakistaniTech', tweet_volume: 18000, url: '#', query: 'PakistaniTech' },
      { id: '9', name: '#PakistaniEducation', tweet_volume: 15000, url: '#', query: 'PakistaniEducation' },
      { id: '10', name: '#PakistaniSports', tweet_volume: 12000, url: '#', query: 'PakistaniSports' },
    ],
    global: [
      { id: '1', name: '#ClimateChange', tweet_volume: 1250000, url: '#', query: 'ClimateChange' },
      { id: '2', name: '#AI', tweet_volume: 890000, url: '#', query: 'AI' },
      { id: '3', name: '#SpaceX', tweet_volume: 670000, url: '#', query: 'SpaceX' },
      { id: '4', name: '#Bitcoin', tweet_volume: 450000, url: '#', query: 'Bitcoin' },
      { id: '5', name: '#WorldCup', tweet_volume: 320000, url: '#', query: 'WorldCup' },
      { id: '6', name: '#TechNews', tweet_volume: 280000, url: '#', query: 'TechNews' },
      { id: '7', name: '#Hollywood', tweet_volume: 220000, url: '#', query: 'Hollywood' },
      { id: '8', name: '#Science', tweet_volume: 180000, url: '#', query: 'Science' },
      { id: '9', name: '#Politics', tweet_volume: 150000, url: '#', query: 'Politics' },
      { id: '10', name: '#Sports', tweet_volume: 120000, url: '#', query: 'Sports' },
    ],
    india: [
      { id: '1', name: '#Bollywood', tweet_volume: 225000, url: '#', query: 'Bollywood' },
      { id: '2', name: '#IndianCricket', tweet_volume: 189000, url: '#', query: 'IndianCricket' },
      { id: '3', name: '#DelhiWeather', tweet_volume: 167000, url: '#', query: 'DelhiWeather' },
      { id: '4', name: '#MumbaiNews', tweet_volume: 145000, url: '#', query: 'MumbaiNews' },
      { id: '5', name: '#IndianStartups', tweet_volume: 123000, url: '#', query: 'IndianStartups' },
    ],
    usa: [
      { id: '1', name: '#USPolitics', tweet_volume: 325000, url: '#', query: 'USPolitics' },
      { id: '2', name: '#Hollywood', tweet_volume: 289000, url: '#', query: 'Hollywood' },
      { id: '3', name: '#TechNews', tweet_volume: 267000, url: '#', query: 'TechNews' },
      { id: '4', name: '#NYC', tweet_volume: 198000, url: '#', query: 'NYC' },
      { id: '5', name: '#California', tweet_volume: 156000, url: '#', query: 'California' },
    ],
    uk: [
      { id: '1', name: '#Brexit', tweet_volume: 425000, url: '#', query: 'Brexit' },
      { id: '2', name: '#London', tweet_volume: 389000, url: '#', query: 'London' },
      { id: '3', name: '#UKPolitics', tweet_volume: 367000, url: '#', query: 'UKPolitics' },
      { id: '4', name: '#PremierLeague', tweet_volume: 298000, url: '#', query: 'PremierLeague' },
      { id: '5', name: '#BritishWeather', tweet_volume: 256000, url: '#', query: 'BritishWeather' },
    ],
    canada: [
      { id: '1', name: '#CanadianPolitics', tweet_volume: 125000, url: '#', query: 'CanadianPolitics' },
      { id: '2', name: '#Toronto', tweet_volume: 89000, url: '#', query: 'Toronto' },
      { id: '3', name: '#Vancouver', tweet_volume: 67000, url: '#', query: 'Vancouver' },
      { id: '4', name: '#CanadianHockey', tweet_volume: 45000, url: '#', query: 'CanadianHockey' },
      { id: '5', name: '#CanadianWeather', tweet_volume: 32000, url: '#', query: 'CanadianWeather' },
    ],
    australia: [
      { id: '1', name: '#AustralianPolitics', tweet_volume: 125000, url: '#', query: 'AustralianPolitics' },
      { id: '2', name: '#Sydney', tweet_volume: 89000, url: '#', query: 'Sydney' },
      { id: '3', name: '#Melbourne', tweet_volume: 67000, url: '#', query: 'Melbourne' },
      { id: '4', name: '#AustralianCricket', tweet_volume: 45000, url: '#', query: 'AustralianCricket' },
      { id: '5', name: '#AustralianWeather', tweet_volume: 32000, url: '#', query: 'AustralianWeather' },
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
   
    const response = await fetch(`https://api.twitter.com/1.1/trends/place.json?id=23424922`, {
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
