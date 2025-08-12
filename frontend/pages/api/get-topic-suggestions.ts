import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { temperature: 0.8 }
});

interface TopicSuggestionsRequest {
  hashtag: string;
  region?: string;
}

interface TopicSuggestionsResponse {
  suggestions: string[];
  hashtag: string;
  region: string;
}

async function withRetry<T>(fn: () => Promise<T>, tries = 6) {
  let delay = 400; // ms
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (!(status === 429 || status === 503 || status === 504)) throw err;
      if (i === tries - 1) throw err;
      const jitter = delay * (0.3 * Math.random());
      await new Promise(r => setTimeout(r, delay + jitter));
      delay *= 2;
    }
  }
  throw new Error("unreachable");
}

function extractJsonFromText(text: string): any | null {
  if (!text) return null;
  let cleaned = text.trim();
  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  // Find JSON object boundaries
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  // Prefer object; fallback to array
  const candidates: string[] = [];
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(cleaned.slice(firstBracket, lastBracket + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  // Last attempt: try raw cleaned
  try {
    return JSON.parse(cleaned);
  } catch {}
  return null;
}

async function getTopicSuggestionsFromGemini({ hashtag, region = 'pakistan' }: TopicSuggestionsRequest) {
  const prompt = `You are a creative content strategist specializing in video content creation.\n\n` +
    `Analyze the hashtag and generate engaging topic suggestions that would make compelling video content.\n\n` +
    `Guidelines:\n` +
    `- Generate 5 unique topic suggestions\n` +
    `- Each suggestion should be specific and actionable\n` +
    `- Consider local context and cultural relevance for ${region}\n` +
    `- Focus on trending angles, controversies, or unique perspectives\n` +
    `- Make suggestions that would generate viewer interest and engagement\n` +
    `- Keep each suggestion concise but descriptive (15–25 words)\n` +
    `- Avoid generic or overly broad topics\n\n` +
    `Hashtag: "${hashtag}"\n\n` +
    `Return ONLY valid JSON in this exact shape (no markdown, no commentary):\n` +
    `{ "suggestions": string[] }`;

  return withRetry(async () => {
    const res = await model.generateContent(prompt);
    const text = res.response.text();

    const parsed = extractJsonFromText(text);
    if (parsed) {
      if (Array.isArray(parsed)) {
        return { suggestions: parsed as string[] };
      }
      if (parsed && Array.isArray((parsed as any).suggestions)) {
        return { suggestions: (parsed as any).suggestions as string[] };
      }
    }

    // Fallback
    return {
      suggestions: [
        `The hidden story behind ${hashtag} that nobody talks about`,
        `How ${hashtag} is changing the landscape in ${region}`,
        `The controversy surrounding ${hashtag} - what you need to know`,
        `5 surprising facts about ${hashtag} that will shock you`,
        `Why ${hashtag} matters more than you think`
      ]
    };
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TopicSuggestionsResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hashtag, region } = req.body as TopicSuggestionsRequest;

    if (!hashtag) {
      return res.status(400).json({ error: 'Hashtag is required' });
    }

    const suggestions = await getTopicSuggestionsFromGemini({ hashtag, region });

    return res.status(200).json({
      suggestions: suggestions.suggestions,
      hashtag,
      region: region || 'pakistan'
    });

  } catch (error) {
    console.error('Error in get-topic-suggestions API:', error);
    return res.status(500).json({ error: 'Failed to generate topic suggestions' });
  }
}
