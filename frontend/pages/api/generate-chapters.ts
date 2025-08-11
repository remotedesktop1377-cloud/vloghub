import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateChaptersRequest {
  topic: string;
  hypothesis: string;
  duration: number;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  duration: string;
  keyPoints?: string[];
}

interface GenerateChaptersResponse {
  chapters: Chapter[];
  totalDuration: string;
  topic: string;
  hypothesis: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateChaptersResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, hypothesis, duration }: GenerateChaptersRequest = req.body;

    // Validate input
    if (!topic || !hypothesis || !duration) {
      return res.status(400).json({
        error: 'Missing required fields: topic, hypothesis, duration'
      });
    }

    if (duration < 1 || duration > 120) {
      return res.status(400).json({
        error: 'Duration must be between 1 and 120 minutes'
      });
    }

    // Calculate chapters based on duration
    const numChapters = Math.max(3, Math.ceil(duration / 10));
    // Remove the incorrect chapterDuration calculation since we're not using it
    
    // Generate chapters using OpenAI API
    const chapters = await generateChaptersWithOpenAI(topic, hypothesis, duration, numChapters);

    const response: GenerateChaptersResponse = {
      chapters,
      totalDuration: `${duration} minutes`,
      topic,
      hypothesis,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating chapters:', error);
    res.status(500).json({ error: 'Failed to generate chapters' });
  }
}

async function generateChaptersWithOpenAI(
  topic: string,
  hypothesis: string,
  duration: number,
  numChapters: number
): Promise<Chapter[]> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Fallback to mock data if no API key
      return generateMockChapters(topic, hypothesis, duration, numChapters);
    }

    const prompt = `Generate ${numChapters} video chapters for a ${duration}-minute video about "${topic}".

User's hypothesis/angle: "${hypothesis}"

Requirements:
- Each chapter should have a clear title, description, and 3-5 key points
- Chapters should flow logically and build upon each other
- Total duration should be approximately ${duration} minutes
- Make content engaging and research-focused
- Include introduction and conclusion chapters

Format each chapter as JSON with: title, description, duration (in minutes), and keyPoints array.

Return only valid JSON array.`;

    // Use the official OpenAI SDK
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Latest and most cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a professional video content planner and researcher. Generate well-structured video chapters based on the user\'s requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    // Try to parse the JSON response
    try {
      const parsedChapters = JSON.parse(content);
      if (Array.isArray(parsedChapters)) {
        // Use the same duration calculation logic as mock chapters
        const baseDurationPerScene = Math.floor((duration / numChapters) * 10) / 10;
        const remainingTime = Math.round((duration - (baseDurationPerScene * numChapters)) * 10) / 10;
        
        return parsedChapters.map((chapter, index) => {
          let sceneDuration = baseDurationPerScene;
          
          // Distribute remaining time to the first few scenes
          if (index < remainingTime * 100) {
            sceneDuration += 0.01;
          }
          
          // Round to 2 decimal places max
          sceneDuration = Math.round(sceneDuration * 100) / 100;
          
          return {
            id: (index + 1).toString(),
            title: chapter.title || `Chapter ${index + 1}`,
            description: chapter.description || 'Chapter description',
            duration: chapter.duration ? `${chapter.duration} min` : `${sceneDuration} min`,
            keyPoints: Array.isArray(chapter.keyPoints) ? chapter.keyPoints : ['Key point 1', 'Key point 2', 'Key point 3'],
          };
        });
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Raw response content:', content);
    }

    // Fallback to mock data if parsing fails
    return generateMockChapters(topic, hypothesis, duration, numChapters);

  } catch (error) {
    console.error('OpenAI API error:', error instanceof Error ? error.message : String(error));
    // Fallback to mock data
    return generateMockChapters(topic, hypothesis, duration, numChapters);
  }
}

function generateMockChapters(
  topic: string,
  hypothesis: string,
  duration: number,
  numChapters: number
): Chapter[] {
  // Calculate base duration per scene using Math.floor to ensure we don't exceed total time
  const baseDurationPerScene = Math.floor((duration / numChapters) * 100) / 100;
  const remainingTime = Math.round((duration - (baseDurationPerScene * numChapters)) * 100) / 100;
  
  const allScripts = [
    'February 11th, 1990. A day etched in history.',
    'Nelson Mandela, finally free. But what would he say?',
    'Then, his voice. Calm, resolute. It was incredible.',
    'After 27 years, he spoke not of bitterness, but of peace.',
    'He called for unity, for a democratic South Africa.',
    'His message resonated. The world listened, captivated.',
    'That speech wasn\'t just words; it was a turning point.',
    'A beacon of hope for millions. Truly unforgettable.',
    'His legacy lives on, inspiring us all.',
  ];
  
  const mockChapters: Chapter[] = [];
  
  // Create chapters with proper duration distribution
  for (let i = 0; i < numChapters; i++) {
    let sceneDuration = baseDurationPerScene;
    
    // Distribute remaining time to the first few scenes
    if (i < remainingTime * 100) {
      sceneDuration += 0.01;
    }
    
    // Round to 2 decimal places max
    sceneDuration = Math.round(sceneDuration * 100) / 100;
    
    mockChapters.push({
      id: (i + 1).toString(),
      title: allScripts[i] || `Chapter ${i + 1}: Additional Insights`,
      duration: `${sceneDuration} min`,
    });
  }

  return mockChapters;
}
