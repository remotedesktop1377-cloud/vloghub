import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

interface HypothesisSuggestionsRequest {
  topic: string;
  details?: string;
  region?: string;
  num?: number;
  tone?: string;
  currentSuggestions?: string[];
}

interface HypothesisSuggestionsResponse {
  suggestions: string[];
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
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  const candidates: string[] = [];
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(cleaned.slice(firstBracket, lastBracket + 1));
  }

  for (const candidate of candidates) {
    try { return JSON.parse(candidate); } catch {}
  }
  try { return JSON.parse(cleaned); } catch {}
  return null;
}

async function getHypothesisSuggestions({ topic, details = '', region = 'pakistan', num = 5, tone = 'Engaging, research-focused', currentSuggestions = [] }: HypothesisSuggestionsRequest) {
  const avoidDuplicatesSection = currentSuggestions.length > 0 
    ? `\n\nIMPORTANT: Generate DIFFERENT hypotheses from these existing ones:\n${currentSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
      `Your new hypotheses should:\n` +
      `- Explore different research angles and perspectives\n` +
      `- Avoid similar hypotheses or conclusions\n` +
      `- Bring fresh investigative approaches\n` +
      `- Be distinctly different from the existing hypotheses\n` +
      `- Consider alternative viewpoints and methodologies\n`
    : '';

  const prompt = `You are a senior editorial strategist for video scripts. Generate concise hypothesis options a creator could explore for the ${topic}.\n\n` +
    `Requirements:\n` +
    `- Return exactly ${num} distinct hypotheses\n` +
    `- Each hypothesis should be a single sentence (max 25 words)\n` +
    `- Style: ${tone}\n` +
    `- Consider audience in ${region}\n` +
    `- Use the topic details if provided to specialize the angle\n` +
    avoidDuplicatesSection +
    `Topic: "${topic}"\n` +
    (details ? `Details:\n${details}\n` : '') +
    `\nReturn ONLY valid JSON in this shape (no markdown fences, no commentary):\n{ "suggestions": string[] }`;

  return withRetry(async () => {
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    const parsed = extractJsonFromText(text);
    if (parsed) {
      if (Array.isArray(parsed)) return { suggestions: parsed };
      if (Array.isArray(parsed.suggestions)) return { suggestions: parsed.suggestions };
    }
    return { suggestions: [
      `Exploring the real-world impact of ${topic} on everyday life in ${region}.`,
      `Testing whether public perception of ${topic} matches the data in ${region}.`,
      `How ${topic} narratives differ across communities in ${region}.`,
      `Whether policy or culture drives ${topic} outcomes in ${region}.`,
      `If ${topic} momentum is sustainable or a short-term spike.`
    ]};
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HypothesisSuggestionsResponse | { error: string }>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { topic, details, region, num, tone, currentSuggestions } = req.body as HypothesisSuggestionsRequest;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });
    // console.log("Hypothesis current Suggestions: ", currentSuggestions)
    const data = await getHypothesisSuggestions({ topic, details, region, num, tone, currentSuggestions });
    
    return res.status(200).json({ suggestions: data.suggestions });
  } catch (e) {
    console.error('Error in get-hypothesis-suggestions:', e);
    return res.status(500).json({ error: 'Failed to generate hypothesis suggestions' });
  }
}
