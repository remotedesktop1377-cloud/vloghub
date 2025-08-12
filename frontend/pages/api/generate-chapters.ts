import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

const ScriptSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    durationSeconds: { type: "number" },
    targetPlatform: { type: "string" },
    tone: { type: "string" },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          heading: { type: "string" },
          narration: { type: "string" },
          visuals: { type: "string" },
          brollIdeas: { type: "array", items: { type: "string" } }
        },
        required: ["id", "heading", "narration", "visuals"]
      }
    },
    cta: { type: "string" },
    metadata: {
      type: "object",
      properties: {
        keywords: { type: "array", items: { type: "string" } },
        thumbnailIdeas: { type: "array", items: { type: "string" } }
      }
    }
  },
  required: ["title", "durationSeconds", "chapters"]
} as const;

interface GenerateChaptersRequest {
  topic: string;
  hypothesis: string;
  duration: number;
}

interface Chapter {
  id: string;
  heading: string;
  narration: string;
  visuals: string;
  brollIdeas: string[];
  duration: string;
}

interface GenerateChaptersResponse {
  chapters: Chapter[];
  totalDuration: string;
  topic: string;
  hypothesis: string;
  title: string;
  cta: string;
  keywords: string[];
  thumbnailIdeas: string[];
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

    // Convert minutes to seconds
    const durationSeconds = duration * 60;
    
    // Generate video script using the new schema
    const script = await generateVideoScript({
      topic: `${topic} - ${hypothesis}`,
      durationSeconds,
      platform: "YouTube",
      tone: "Engaging, clear, research-focused",
      audience: "General audience interested in research and analysis"
    });

    // Transform script chapters to match our Chapter interface
    const chapters: Chapter[] = script.chapters.map((chapter: any, index: number) => {
      // Calculate proportional duration for this chapter
      const totalChapters = script.chapters.length;
      const baseSecondsPerChapter = durationSeconds / totalChapters;
      let chapterSeconds = baseSecondsPerChapter;
      
      // First and last chapters get slightly more time
      if (index === 0 || index === totalChapters - 1) {
        chapterSeconds = baseSecondsPerChapter * 1.2;
      }
      
      const chapterMinutes = Math.round((chapterSeconds / 60) * 10) / 10;
      
      return {
        id: chapter.id || (index + 1).toString(),
        heading: chapter.heading,
        narration: chapter.narration,
        visuals: chapter.visuals,
        brollIdeas: chapter.brollIdeas || [],
        duration: `${chapterMinutes} min`,
      };
    });

    const response: GenerateChaptersResponse = {
      chapters,
      totalDuration: `${duration} minutes`,
      topic,
      hypothesis,
      title: script.title,
      cta: script.cta || "Thanks for watching! Don't forget to like and subscribe.",
      keywords: script.metadata?.keywords || [],
      thumbnailIdeas: script.metadata?.thumbnailIdeas || [],
    };
    console.log(response);
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
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
You are a professional video scriptwriter.
Write a tightly structured script in JSON that I can render into a storyboard and TTS.
Hard rules:
- Keep narration within ${durationSeconds} total seconds at 150 wpm.
- Make chapter headings short and scannable.
- Add practical "visuals" directions the editor can follow.
- Include 3–5 "brollIdeas" per chapter.
- Keep tone: ${tone}. Platform: ${platform}. Audience: ${audience}.
- Create a compelling narrative that flows logically from chapter to chapter.
- Include introduction and conclusion chapters.
- Make content engaging, research-focused, and educational.

Topic: "${topic}"

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
  const numChapters = Math.max(3, Math.ceil(durationSeconds / 30));
  const baseSecondsPerChapter = durationSeconds / numChapters;
  
  const chapters = [];
  for (let i = 0; i < numChapters; i++) {
    const chapterSeconds = Math.round(baseSecondsPerChapter * 10) / 10;
    chapters.push({
      id: (i + 1).toString(),
      heading: `Chapter ${i + 1}: ${topic} Insights`,
      narration: `This is the narration content for Chapter ${i + 1}. It explores the topic of "${topic}" and provides detailed insights and analysis.`,
      visuals: `Show relevant graphics, charts, or footage related to ${topic}. Include text overlays and visual elements that support the narration.`,
      brollIdeas: [
        `B-roll footage related to ${topic}`,
        `Supporting graphics and charts`,
        `Relevant images and illustrations`,
        `Text overlays and key points`
      ]
    });
  }

  return {
    title: `Complete Guide to ${topic}`,
    durationSeconds,
    targetPlatform: "YouTube",
    tone: "Engaging, clear, research-focused",
    chapters,
    cta: "Thanks for watching! Don't forget to like and subscribe.",
    metadata: {
      keywords: [topic, "research", "analysis", "insights"],
      thumbnailIdeas: [
        `Eye-catching thumbnail with ${topic} text`,
        `Professional design with key insights`,
        `Engaging visual that represents the content`
      ]
    }
  };
}
