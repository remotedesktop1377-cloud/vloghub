import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

interface EnhanceHypothesisRequest {
  topic: string;
  hypothesis: string;
  details?: string;
  region?: string;
  currentSuggestions?: string[];
}

interface EnhanceHypothesisResponse {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<EnhanceHypothesisResponse | { error: string }>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { topic, hypothesis, details, region, currentSuggestions = [] } = req.body as EnhanceHypothesisRequest;
    if (!topic || !hypothesis) return res.status(400).json({ error: 'Topic and hypothesis are required' });

    const avoidDuplicatesSection = currentSuggestions.length > 0 
      ? `\n\nIMPORTANT: Generate DIFFERENT hypotheses from these existing ones:\n${currentSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
        `Your new hypotheses should:\n` +
        `- Explore different research angles and perspectives\n` +
        `- Avoid similar hypotheses or conclusions\n` +
        `- Bring fresh investigative approaches\n` +
        `- Be distinctly different from the existing hypotheses\n` +
        `- Consider alternative viewpoints and methodologies\n`
      : '';

    const prompt = `You are an expert content paraphraser. Create exactly 5 single-line enhanced paraphrases of the following hypothesis. Each paraphrase should be a complete, standalone sentence that captures the essence of the original.\n\n` +
      `Constraints:\n` +
      `- Each paraphrase must be a SINGLE LINE (no line breaks)\n` +
      `- Maximum 5 paraphrases total\n` +
      `- Keep original meaning; do not invent facts\n` +
      `- Make each option clear, engaging, and concise\n` +
      `- Avoid buzzwords, keep it specific\n` +
      `- Consider audience in ${region}\n` +
      `- Each paraphrase should have a slightly different angle or emphasis\n` +
      `- Polish grammar and improve readability\n` +
      avoidDuplicatesSection +
      `Topic: "${topic}"\n` +
      (details ? `Details: ${details}\n` : '') +
      `Original hypothesis: ${hypothesis}\n\n` +
      `Return ONLY valid JSON in this exact shape (no markdown, no commentary):\n` +
      `{ "enhancedOptions": [string, string, string, string, string] }`;

    const result = await withRetry(async () => {
      const resGen = await model.generateContent(prompt);
      // console.log('resGen', resGen);
      const text = resGen.response.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.enhancedOptions) && parsed.enhancedOptions.length > 0) {
        return parsed.enhancedOptions;
      }
      // Fallback: create simple single-line paraphrases if JSON failed
      return [
        hypothesis.trim(),
        `Enhanced version: ${hypothesis.trim()}`,
        `Refined approach: ${hypothesis.trim()}`,
        `Alternative perspective: ${hypothesis.trim()}`,
        `Polished version: ${hypothesis.trim()}`
      ];
    });

    return res.status(200).json({ enhancedOptions: result });
  } catch (e) {
    console.error('Error enhancing hypothesis:', e);
    return res.status(500).json({ error: 'Failed to enhance hypothesis' });
  }
}
