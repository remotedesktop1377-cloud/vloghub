import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from '@/config/aiConfig';
import { Chapter } from '@/types/chapters';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const ScriptSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    duration: { type: "string" },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          time_range: { type: "string" },
          narration: { type: "string" },
          voiceover_style: { type: "string" },
          visual_guidance: { type: "string" },
          on_screen_text: { type: "string" }
        },
        required: ["id", "time_range", "narration", "voiceover_style", "visual_guidance", "on_screen_text"]
      }
    }
  },
  required: ["title", "duration", "chapters"]
} as const;

interface GenerateChaptersRequest {
  topic: string;
  hypothesis: string;
  duration: number;
  selectedTopicSuggestions?: string[];
  selectedHypothesisSuggestions?: string[];
  topicDetails?: string;
}

interface GenerateChaptersResponse {
  chapters: Chapter[];
  totalDuration: string;
  topic: string;
  hypothesis: string;
  title: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateChaptersResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      topic, 
      hypothesis, 
      duration, 
      selectedTopicSuggestions = [], 
      selectedHypothesisSuggestions = [],
      topicDetails 
    }: GenerateChaptersRequest = req.body;

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

    // Convert minutes to seconds
    const durationSeconds = duration * 60;

    // Build comprehensive topic including selected suggestions
    let comprehensiveTopic = `${topic} - ${hypothesis}`;
    
    // Add topic details if provided
    if (topicDetails) {
      comprehensiveTopic += `\n\nTopic Details: ${topicDetails}`;
    }
    
    // Add selected topic suggestions
    if (selectedTopicSuggestions.length > 0) {
      comprehensiveTopic += `\n\nSelected Topic Aspects to Cover: ${selectedTopicSuggestions.join(', ')}`;
    }
    
    // Add selected hypothesis suggestions
    if (selectedHypothesisSuggestions.length > 0) {
      comprehensiveTopic += `\n\nSelected Hypothesis Angles to Explore: ${selectedHypothesisSuggestions.join(', ')}`;
    }

    // Generate video script using the new schema
    const script = await generateVideoScript({
      topic: comprehensiveTopic,
      durationSeconds,
      platform: "YouTube",
      tone: "Engaging, clear, research-focused",
      audience: "General audience interested in research and analysis"
    });

    // Transform script chapters to match our Chapter interface
    const chapters: Chapter[] = script.chapters.map((chapter: any, index: number) => {
      // Parse time range to calculate duration in minutes
      const timeRange = chapter.time_range || '0:00-0:10';
      const [start, end] = timeRange.split('–').map((time: string) => {
        const [minutes, seconds] = time.split(':').map(Number);
        return minutes * 60 + seconds;
      });
      const chapterSeconds = end - start;
      const chapterMinutes = Math.round((chapterSeconds / 60) * 10) / 10;

      return {
        id: chapter.id || `chapter-${index + 1}`,
        heading: chapter.on_screen_text || `Chapter ${index + 1}`,
        narration: chapter.narration,
        visuals: chapter.visual_guidance || '',
        brollIdeas: chapter.brollIdeas || [],
        duration: `${chapterMinutes} min`,
        voiceover_style: chapter.voiceover_style,
        media: {
          image: null,
          audio: null,
          video: null
        }
      };
    });

    const response: GenerateChaptersResponse = {
      chapters,
      totalDuration: `${duration} minutes`,
      topic,
      hypothesis,
      title: script.title,
    };
    // console.log(response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating chapters:', error);
    res.status(500).json({ error: 'Failed to generate chapters' });
  }
}

async function generateVideoScript({
  topic,
  durationSeconds = 150,
  platform = "YouTube",
  tone = "Engaging, clear, non‑technical",
  audience = "General audience",
}: {
  topic: string;
  durationSeconds?: number;
  platform?: "YouTube" | "TikTok" | "Reels" | "Shorts" | "Documentary";
  tone?: string;
  audience?: string;
}) {
  const model = genAI.models.generateContent({
    model: AI_CONFIG.GEMINI.MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are an AI assistant that generates structured YouTube video scripts in JSON format for AI-powered video applications.

Task:
Generate a ${Math.round(durationSeconds / 60)}-minute YouTube script on the topic: ${topic}.

Rules:
- Break the script into **time-based chapters** (≈8–12 seconds each).
- Use JSON format only. No explanations, no markdown, no extra text.
- Each chapter object must include:
  - "id": unique identifier (e.g., "chapter-1")
  - "time_range": string (e.g., "0:00–0:10")
  - "narration": concise narration text sized for that slot
  - "voiceover_style": tone, pace, emotion
  - "visual_guidance": suggested visuals or animations
  - "on_screen_text": short caption or overlay

Constraints:
- Keep narration ~130 words per minute total.
- Make narration conversational and engaging.
- Ensure flow is logical across chapters.

Output strictly in this JSON schema:

{
  "title": "string",
  "duration": "string",
  "chapters": [
    {
      "id": "string",
      "time_range": "string",
      "narration": "string",
      "voiceover_style": "string",
      "visual_guidance": "string",
      "on_screen_text": "string"
    }
  ]
}

Return ONLY valid JSON that matches the provided schema.
Do not include markdown code fences or extra commentary.`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: ScriptSchema as any,
      temperature: 0.7,
    },
  });

  try {
    const res = await model;
    const text = res.text || '';
    const json = JSON.parse(text);
    return json;
  } catch (error) {
    console.error('Error generating video script:', error);
    // Fallback to mock data
    return generateMockScript(topic, durationSeconds);
  }
}

function generateMockScript(topic: string, durationSeconds: number) {
  // Generate chapters with 8-12 seconds each
  const targetChapterLength = 10; // seconds
  const numChapters = Math.max(3, Math.ceil(durationSeconds / targetChapterLength));
  const actualChapterLength = durationSeconds / numChapters;

  const chapters = [];
  let currentTime = 0;

  for (let i = 0; i < numChapters; i++) {
    const startMinutes = Math.floor(currentTime / 60);
    const startSeconds = Math.floor(currentTime % 60);
    const endTime = currentTime + actualChapterLength;
    const endMinutes = Math.floor(endTime / 60);
    const endSeconds = Math.floor(endTime % 60);

    const timeRange = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}–${endMinutes}:${endSeconds.toString().padStart(2, '0')}`;

    chapters.push({
      id: `chapter-${i + 1}`,
      time_range: timeRange,
      narration: `This is the narration content for Chapter ${i + 1}. It explores the topic of "${topic}" and provides detailed insights and analysis.`,
      voiceover_style: i === 0 ? "energetic, welcoming" : i === numChapters - 1 ? "conclusive, encouraging" : "conversational, informative",
      visual_guidance: `Show relevant graphics, charts, or footage related to ${topic}. Include text overlays and visual elements that support the narration.`,
      on_screen_text: `${topic} - Key Insight ${i + 1}`,
      assets: {
        image: null,
        audio: null,
        video: null
      }
    });

    currentTime = endTime;
  }

  const totalMinutes = Math.floor(durationSeconds / 60);
  const totalSeconds = durationSeconds % 60;
  const durationString = totalSeconds > 0 ? `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}` : `${totalMinutes}:00`;

  return {
    title: `Complete Guide to ${topic}`,
    duration: durationString,
    chapters
  };
}
