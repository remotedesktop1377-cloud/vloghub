import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: 0.7 }
});

interface EnhanceRequest {
  topic: string;
  details: string;
  region?: string;
  targetWords?: number; // optional length hint
}

interface EnhanceResponse {
  enhancedOptions: string[];
}

async function withRetry<T>(fn: () => Promise<T>, tries = 6) {
  let delay = 400;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (!(status === 429 || status === 503 || status === 504)) throw err;
      if (i === tries - 1) throw err;
      const jitter = delay * (0.3 * Math.random());
      await new Promise(r => setTimeout(r, delay + jitter));
      delay *= 2;
    }
  }
  throw new Error('unreachable');
}

function extractJsonFromText(text: string): any | null {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  try { return JSON.parse(cleaned); } catch {}
  return null;
}

async function enhanceWithGemini({ topic, details, region, targetWords }: EnhanceRequest): Promise<EnhanceResponse> {
  const prompt = `You are an expert video script editor. Create 4-5 different enhanced versions of the following topic details, each offering a unique perspective or approach while maintaining the core message.\n\n` +
    `Constraints:\n` +
    `- Keep factual meaning; do not invent facts.\n` +
    `- Make each option compelling and concise (~${targetWords} words).\n` +
    `- Add smooth flow and readability for voiceover.\n` +
    `- Consider ${region} audience context if relevant.\n` +
    `- Each option should have a distinct angle or style.\n` +
    `- Keep the user's tone, but polish grammar and structure.\n\n` +
    `Topic: "${topic}"\n\n` +
    `Original details:\n${details}\n\n` +
    `Return ONLY valid JSON in this exact shape (no markdown, no commentary):\n` +
    `{ "enhancedOptions": [string, string, string, string] }`;

  return withRetry(async () => {
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    console.log('text', text);
    const parsed = extractJsonFromText(text);
    if (parsed && Array.isArray(parsed.enhancedOptions) && parsed.enhancedOptions.length > 0) {
      return { enhancedOptions: parsed.enhancedOptions };
    }
    // Fallback: create simple variations if JSON failed
    const fallbackOptions = [
      `${details} (refined for clarity and impact)`,
      `${details} (enhanced with engaging narrative flow)`,
      `${details} (optimized for voiceover delivery)`,
      `${details} (restructured for better audience engagement)`
    ];
    return { enhancedOptions: fallbackOptions };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<EnhanceResponse | { error: string }>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, details, region, targetWords }: EnhanceRequest = req.body || {};
    if (!topic || !details) {
      return res.status(400).json({ error: 'Missing required fields: topic, details' });
    }

    const result = await enhanceWithGemini({ topic, details, region, targetWords });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error enhancing topic details:', error);
    return res.status(500).json({ error: 'Failed to enhance topic details' });
  }
}
