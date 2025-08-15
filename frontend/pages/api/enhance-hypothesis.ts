import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

interface EnhanceHypothesisRequest {
  topic: string;
  hypothesis: string;
  details?: string;
  region?: string;
}

interface EnhanceHypothesisResponse {
  enhancedText: string;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<EnhanceHypothesisResponse | { error: string }>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { topic, hypothesis, details, region } = req.body as EnhanceHypothesisRequest;
    if (!topic || !hypothesis) return res.status(400).json({ error: 'Topic and hypothesis are required' });

    const prompt = `You are an expert script editor. Improve the following hypothesis to be clear, testable, and compelling in one sentence.\n` +
      `- Keep original meaning, adjust for clarity and strength.\n` +
      `- Avoid buzzwords, keep it specific.\n` +
      `- Consider audience in ${region}.\n\n` +
      `Topic: "${topic}"\n` +
      (details ? `Details: ${details}\n` : '') +
      `Original hypothesis: ${hypothesis}\n\n` +
      `Return just the improved one-line hypothesis (no JSON, no extra text).`;

    const result = await withRetry(async () => {
      const resGen = await model.generateContent(prompt);
      return resGen.response.text().trim();
    });

    return res.status(200).json({ enhancedText: result });
  } catch (e) {
    console.error('Error enhancing hypothesis:', e);
    return res.status(500).json({ error: 'Failed to enhance hypothesis' });
  }
}
