import { NextRequest, NextResponse } from 'next/server';
import { HelperFunctions } from '@/utils/helperFunctions';
import { getGeminiClient } from '@/utils/geminiService';

// Helper function to generate random trending topics
const fetchGeminiTrendingTopics = async (region: string, dateRange: string) => {
  try {
    // Inside your model initialization helper
    const getGeminiModel = () => {
      const genAI = getGeminiClient();
      return genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // Use your 2.5/2.0 flash version
        tools: [{ googleSearch: {} } as any] // ADD THIS LINE TO ENABLE GROUNDING
      });
    };

    // Get the Gemini model instance with grounding enabled
    const model = getGeminiModel();

    // Get time range description for the prompt
    const timeRangeDescription = HelperFunctions.getTimeRangeDescription(dateRange);
    
    // Build date range context for search queries
    let dateRangeQuery = '';
    switch (dateRange) {
      case '24h':
        dateRangeQuery = 'past 24 hours';
        break;
      case '7d':
        dateRangeQuery = 'past week';
        break;
      case '30d':
        dateRangeQuery = 'past month';
        break;
      case 'anytime':
        dateRangeQuery = 'all time';
        break;
      default:
        dateRangeQuery = 'past 24 hours';
    }

    // Add this line to the top of your existing prompt variable
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Enhanced prompt based on location type and date range
    let prompt = `ACTUAL REAL-TIME DATA REQUIRED: Use Google Search grounding to find the top 20 VIDEO-WORTHY TRENDING TOPICS 
from social media platforms (Twitter/X, Reddit, TikTok, Instagram) in the ${region} region from the ${dateRangeQuery} (${timeRangeDescription}). 

CRITICAL REQUIREMENT: Find topics that are SUITABLE FOR CREATING VIDEO CONTENT - NOT news headlines. 
These should be DISCUSSION-WORTHY topics that people are actively talking about, analyzing, debating, and exploring from multiple angles.
The topics must be suitable for creating engaging video scripts and content - topics you can analyze, explain, debate, or explore in depth.

Use grounding to search for topics from the ${dateRangeQuery}:
- "trending topics ${dateRangeQuery} [region]" or "viral topics ${dateRangeQuery} [region]"
- "trending discussions ${dateRangeQuery} [region]" or "viral debates ${dateRangeQuery} [region]"
- "topics people are talking about ${dateRangeQuery} [region]"
- "controversial topics trending ${dateRangeQuery} [region]"
- "topics being discussed ${dateRangeQuery} [region]"
- "trending conversations ${dateRangeQuery} [region]"
- "what people are debating ${dateRangeQuery} [region]"
- "video-worthy topics ${dateRangeQuery} [region]"

IMPORTANT: Fetch ONLY News and Politics topics that are VIDEO-WORTHY and DISCUSSION-BASED. These topics should:
- Be suitable for creating video content/scripts (not just news headlines)
- Have multiple perspectives, angles, or viewpoints that can be explored
- Generate conversation, debate, or analysis
- Be topics people are actively discussing, analyzing, or debating
- NOT be simple news headlines, breaking news events, or one-time announcements
- Be topics that can be expanded into longer-form video content (5-15 minutes)
- Have enough depth for analysis, explanation, or exploration

Exclude:
- Simple news headlines (e.g., "President announces new policy" - instead find "debate about the new policy")
- Breaking news events without discussion (e.g., "Earthquake hits city" - instead find "discussion about earthquake response")
- One-time announcements without ongoing discussion
- Entertainment, Sports, Technology, Business, Education, Health, Culture, and Social topics
- Topics that are just facts without discussion or analysis potential

Prioritize trending topics that are:
- Being actively debated and discussed on social media (${dateRangeQuery})
- Controversial topics with multiple viewpoints that can be explored
- Policy discussions with different perspectives and analysis
- Political issues people are analyzing, discussing, or debating
- Topics generating conversation threads, debates, and analysis
- Issues with ongoing discussion suitable for video content
- Topics suitable for creating educational, analytical, or explanatory videos
- Discussions that can be expanded into engaging video scripts
- Topics that spark conversation and have depth for content creation

Use the grounding tool to search for actual trending VIDEO-WORTHY DISCUSSION topics from these platforms from the ${dateRangeQuery}.`;

    prompt += ` Return the response as a JSON array with exactly 20 items, each containing:
    - topic: the video-worthy topic name (keep it concise, 2-6 words, should be a topic suitable for video content, NOT a news headline - e.g., "Debate on Immigration Policy" not "New Immigration Law Passed")
    - category: must be either "News" or "Politics" only
    - engagement_count: realistic number representing actual social media engagement from the ${dateRangeQuery} (likes + retweets + shares + mentions + comments) from the grounding search results (range: 50,000 to 2,000,000)
    - source_reference: the actual platform where it's being discussed like "Twitter", "Reddit", "X", "Social Media", etc. (use actual data from grounding)
    - description: brief explanation of why this topic is video-worthy and being discussed/debated - should explain what makes it suitable for video content creation (must be news or politics related, should indicate it's a topic for discussion/analysis/exploration in video format, NOT just a news event)
    Sort by engagement_count (highest first). Make the engagement numbers realistic and varied based on actual grounding data from the ${dateRangeQuery}.
    Format: [{"topic": "video-worthy topic name (not a headline)", "category": "News" or "Politics", "engagement_count": 150000, "source_reference": "Twitter", "description": "why this topic is video-worthy and being discussed"}]`;

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

