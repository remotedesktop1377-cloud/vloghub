import { NextRequest, NextResponse } from 'next/server';
import { HelperFunctions } from '@/utils/helperFunctions';
import { getGeminiActiveModel } from '@/utils/geminiService';

// Helper function to generate random trending topics
const fetchGeminiTrendingTopics = async (region: string, dateRange: string) => {
  try {
    const model = getGeminiActiveModel();

    // Get time range description for the prompt
    const timeRangeDescription = HelperFunctions.getTimeRangeDescription(dateRange);

    // Enhanced prompt based on location type and date range
    let prompt = '';

    prompt = `Generate the top 20 trending topics for the city of ${region} from the ${timeRangeDescription} with realistic engagement metrics. 
        Focus on local events, city-specific news, local businesses, community happenings, city sports teams, local entertainment, and urban development that are popular in ${region}.
        Include topics that residents of ${region} would be discussing on social media, local news, and community platforms.`;

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
    // console.log('🟢 Gemini Prompt result:', result);
    const response = result.response;
    const text = response.text();
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Transform to match our interface
    const transformedData = parsedData.map((item: any, index: number) => ({
      id: `topic-${index + 1}`,
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
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'global';
    const dateRange = searchParams.get('dateRange') || '24h';

    // console.log('🟢 Gemini trending topics request:', region, dateRange);

    // // Generate real-time trending topics data
    const trendingTopics = await fetchGeminiTrendingTopics(region, dateRange);

    // Simulate API delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

    return NextResponse.json(trendingTopics);

  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

