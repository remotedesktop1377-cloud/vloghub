import { NextApiRequest, NextApiResponse } from 'next';

interface GenerateChaptersRequest {
  topic: string;
  hypothesis: string;
  duration: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: string;
  keyPoints: string[];
}

interface GenerateChaptersResponse {
  chapters: Chapter[];
  topic: string;
  totalDuration: number;
}

// Mock function to generate chapters - replace with actual ChatGPT API call
const generateChaptersWithAI = async (topic: string, hypothesis: string, duration: number): Promise<Chapter[]> => {
  // This is where you would implement the actual ChatGPT API call
  // For now, return mock data based on the topic and duration
  
  const baseChapters = [
    {
      id: '1',
      title: 'Introduction & Context',
      description: 'Setting the stage for the topic and providing background information',
      duration: '2-3 min',
      keyPoints: ['Topic overview', 'Current relevance', 'Why it matters today'],
    },
    {
      id: '2',
      title: 'Main Discussion Points',
      description: 'Deep dive into the core aspects of the topic',
      duration: '4-6 min',
      keyPoints: ['Key arguments', 'Supporting evidence', 'Different perspectives'],
    },
    {
      id: '3',
      title: 'Analysis & Implications',
      description: 'Exploring the broader impact and future considerations',
      duration: '2-3 min',
      keyPoints: ['What this means', 'Future outlook', 'Call to action'],
    },
  ];

  // Adjust chapters based on duration
  if (duration <= 10) {
    return baseChapters.slice(0, 2).map(chapter => ({
      ...chapter,
      duration: duration <= 5 ? '2-3 min' : '3-5 min'
    }));
  } else if (duration <= 20) {
    return baseChapters;
  } else if (duration <= 30) {
    return [
      ...baseChapters,
      {
        id: '4',
        title: 'Deep Dive Analysis',
        description: 'Comprehensive analysis of specific aspects',
        duration: '5-8 min',
        keyPoints: ['Detailed examination', 'Expert insights', 'Case studies'],
      },
      {
        id: '5',
        title: 'Conclusion & Next Steps',
        description: 'Wrapping up and providing actionable insights',
        duration: '3-5 min',
        keyPoints: ['Summary of key points', 'Practical takeaways', 'Future considerations'],
      }
    ];
  } else {
    // For longer videos, add more detailed chapters
    return [
      ...baseChapters,
      {
        id: '4',
        title: 'Deep Dive Analysis',
        description: 'Comprehensive analysis of specific aspects',
        duration: '8-12 min',
        keyPoints: ['Detailed examination', 'Expert insights', 'Case studies', 'Data analysis'],
      },
      {
        id: '5',
        title: 'Expert Perspectives',
        description: 'Insights from industry experts and thought leaders',
        duration: '6-10 min',
        keyPoints: ['Expert interviews', 'Industry insights', 'Professional opinions'],
      },
      {
        id: '6',
        title: 'Practical Applications',
        description: 'Real-world applications and examples',
        duration: '5-8 min',
        keyPoints: ['Real examples', 'Practical tips', 'Implementation strategies'],
      },
      {
        id: '7',
        title: 'Conclusion & Next Steps',
        description: 'Wrapping up and providing actionable insights',
        duration: '4-6 min',
        keyPoints: ['Summary of key points', 'Practical takeaways', 'Future considerations', 'Call to action'],
      }
    ];
  }
};

// Function to call actual ChatGPT API
const callChatGPTAPI = async (topic: string, hypothesis: string, duration: number): Promise<Chapter[]> => {
  try {
    console.log(`Generating chapters for topic: "${topic}" with hypothesis: "${hypothesis}" for ${duration} minutes`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a video content strategist. Create detailed video chapters for a ${duration}-minute video about "${topic}". The user's hypothesis/angle is: "${hypothesis}". 

Return a JSON array of chapters with the following structure:
[
  {
    "id": "1",
    "title": "Chapter Title",
    "description": "Detailed description of what this chapter covers",
    "duration": "X-Y min",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
  }
]

Make sure the total duration of all chapters equals approximately ${duration} minutes. For shorter videos (5-15 min), create 2-3 chapters. For medium videos (20-30 min), create 4-5 chapters. For longer videos (45+ min), create 6-8 chapters.

Focus on creating engaging, structured content that flows logically from introduction to conclusion.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Try to parse the JSON response
      const parsedChapters = JSON.parse(content);
      
      // Validate the response structure
      if (Array.isArray(parsedChapters) && parsedChapters.length > 0) {
        // Ensure each chapter has the required fields
        const validatedChapters = parsedChapters.map((chapter, index) => ({
          id: chapter.id || (index + 1).toString(),
          title: chapter.title || `Chapter ${index + 1}`,
          description: chapter.description || 'Chapter description',
          duration: chapter.duration || '2-3 min',
          keyPoints: Array.isArray(chapter.keyPoints) ? chapter.keyPoints : ['Key point']
        }));
        
        return validatedChapters;
      } else {
        throw new Error('Invalid response structure from OpenAI');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw response content:', content);
      // Fallback to mock data if parsing fails
      return generateChaptersWithAI(topic, hypothesis, duration);
    }
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    // Fallback to mock data
    return generateChaptersWithAI(topic, hypothesis, duration);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateChaptersResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, hypothesis, duration }: GenerateChaptersRequest = req.body;

    if (!topic || !hypothesis || !duration) {
      return res.status(400).json({ error: 'Missing required fields: topic, hypothesis, duration' });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using mock data');
      const mockChapters = await generateChaptersWithAI(topic, hypothesis, duration);
      const response: GenerateChaptersResponse = {
        chapters: mockChapters,
        topic,
        totalDuration: duration,
      };
      return res.status(200).json(response);
    }

    // Generate chapters using ChatGPT API (or fallback to mock data)
    const chapters = await callChatGPTAPI(topic, hypothesis, duration);

    const response: GenerateChaptersResponse = {
      chapters,
      topic,
      totalDuration: duration,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in generate chapters API:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API')) {
        return res.status(500).json({ 
          error: 'Failed to generate chapters with AI. Please try again or contact support.' 
        });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
