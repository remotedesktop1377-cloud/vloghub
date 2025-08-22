import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from '../../src/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

interface TopicSuggestionsRequest {
  topic: string;
  region?: string;
  currentSuggestions?: string[];
}

interface TopicSuggestionsResponse {
  suggestions: string[];
  topic: string;
  region: string;
}

async function withRetry<T>(fn: () => Promise<T>, tries = AI_CONFIG.GEMINI.MAX_RETRIES) {
  let delay: number = AI_CONFIG.GEMINI.INITIAL_DELAY;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (!AI_CONFIG.RETRY.STATUS_CODES.includes(status)) throw err;
      if (i === tries - 1) throw err;
      const jitter = delay * AI_CONFIG.GEMINI.JITTER_FACTOR * Math.random();
      await new Promise(r => setTimeout(r, delay + jitter));
      delay = Math.min(delay * AI_CONFIG.GEMINI.BACKOFF_MULTIPLIER, AI_CONFIG.RETRY.MAX_DELAY);
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

async function getTopicSuggestionsFromGemini({ topic, region = AI_CONFIG.CONTENT.DEFAULT_REGION, currentSuggestions = [] }: TopicSuggestionsRequest) {
  const avoidDuplicatesSection = currentSuggestions.length > 0 
    ? `\n\nIMPORTANT: Generate DIFFERENT suggestions from these existing ones:\n${currentSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
      `Your new suggestions should:\n` +
      `- Explore different angles and perspectives\n` +
      `- Avoid similar wording or concepts\n` +
      `- Bring fresh insights and unique approaches\n` +
      `- Be distinctly different from the existing suggestions\n`
    : '';

  const prompt = `You are a creative content strategist specializing in video content creation.\n\n` +
    `Analyze the topic and generate engaging topic suggestions that would make compelling video content.\n\n` +
    `Guidelines:\n` +
    `- Generate ${AI_CONFIG.CONTENT.MAX_TOPIC_SUGGESTIONS} unique topic suggestions\n` +
    `- Each suggestion should be specific and actionable\n` +
    `- Consider local context and cultural relevance for ${region}\n` +
    `- Focus on trending angles, controversies, or unique perspectives\n` +
    `- Make suggestions that would generate viewer interest and engagement\n` +
    `- Keep each suggestion concise but descriptive (15–25 words)\n` +
    `- Avoid generic or overly broad topics\n` +
    avoidDuplicatesSection +
    `Topic: "${topic}"\n\n` +
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
        `The hidden story behind ${topic} that nobody talks about`,
        `How ${topic} is changing the landscape in ${region}`,
        `The controversy surrounding ${topic} - what you need to know`,
        `${AI_CONFIG.CONTENT.MAX_TOPIC_SUGGESTIONS} surprising facts about ${topic} that will shock you`,
        `Why ${topic} matters more than you think`
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
    const { topic, region, currentSuggestions } = req.body as TopicSuggestionsRequest;
    
    console.log('🎯 API received request:', { topic, region, currentSuggestionsCount: currentSuggestions?.length || 0 });
    console.log('📋 Current suggestions:', currentSuggestions);

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const suggestions = await getTopicSuggestionsFromGemini({ topic, region, currentSuggestions });
    console.log('✨ Generated new suggestions:', suggestions.suggestions);

    return res.status(200).json({
      suggestions: suggestions.suggestions,
      topic,
      region: region || AI_CONFIG.CONTENT.DEFAULT_REGION
    });

  } catch (error) {
    console.error('Error in get-topic-suggestions API:', error);
    return res.status(500).json({ error: 'Failed to generate topic suggestions' });
  }
}
