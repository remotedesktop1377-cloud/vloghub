import { NextRequest, NextResponse } from 'next/server';
import { HelperFunctions } from '@/utils/helperFunctions';
import { getGeminiModel } from '@/utils/geminiService';

// Helper function to generate random trending topics
const fetchGeminiTrendingTopics = async (region: string, dateRange: string) => {
  try {
    const model = getGeminiModel();

    // Get time range description for the prompt
    const timeRangeDescription = HelperFunctions.getTimeRangeDescription(dateRange);

    // Enhanced prompt based on location type and date range
    let prompt = '';

    prompt = `Fetch the top 20 trending topics from the ${region} region within the last ${timeRangeDescription} with realistic engagement metrics. 
        IMPORTANT: Only return topics related to News and Politics. Exclude all other categories such as Entertainment, Sports, Technology, Business, Education, Health, Culture, and Social topics.
        Prioritize the most relevant and important news and politics topics, including:
- Political developments, government policies, and political announcements
- Breaking news stories and current events
- Political rumors, leaks, and speculations
- Political leader statements, arrests, or significant events
- Government budget, economic policies, and political decisions
- Supreme Court rulings and legal-political developments
- Political party activities and opposition movements
- News from recognized news media outlets
- Political analysis from experts and commentators
- Local news with political significance
- Social media trends related to news and politics
- Google trends for news and political topics`;

    prompt += ` Return the response as a JSON array with exactly 20 items, each containing:
    - topic: the trending topic name (keep it concise, 2-5 words)
    - category: must be either "News" or "Politics" only
    - engagement_count: realistic number representing posts/mentions/views (range: 50,000 to 2,000,000)
    - source_reference: a brief source like "Twitter", "News Media", "Local News", "Expert Analysis", etc.
    - description: brief explanation of why it's trending (must be news or politics related)
    Sort by engagement_count (highest first). Make the engagement numbers realistic and varied.
    Format: [{"topic": "topic name", "category": "News" or "Politics", "engagement_count": 150000, "source_reference": "Twitter", "description": "brief description"}]`;

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
      category: (item.category === 'News' || item.category === 'Politics') ? item.category : 'News',
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
    console.log('Error fetching Gemini trending topics:', error);
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
    console.log('Error fetching trending topics:', error);
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

