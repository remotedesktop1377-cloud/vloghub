import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '../../src/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

interface EnhanceTopicSuggestionsRequest {
  suggestions: string[];
  topic: string;
  region?: string;
}

interface EnhanceTopicSuggestionsResponse {
  enhancedSuggestions: string[];
  originalSuggestions: string[];
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

function calculateSimilarity(str1: string, str2: string): number {
  // Simple similarity calculation based on common words
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
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

async function enhanceTopicSuggestionsWithGemini({ suggestions, topic, region = AI_CONFIG.CONTENT.DEFAULT_REGION }: EnhanceTopicSuggestionsRequest) {
  const prompt = `You are a viral content strategist who specializes in creating click-worthy video titles.\n\n` +
    `CRITICAL: Do NOT simply repeat the original suggestions. You must transform them into more compelling, specific, and engaging versions.\n\n` +
    `Your task: Transform these basic topic suggestions into irresistible video titles that would get millions of views.\n\n` +
    `TRANSFORMATION RULES:\n` +
    `- Add specific numbers, percentages, or time frames where relevant\n` +
    `- Include power words like "shocking," "hidden," "secret," "exposed," "revealed"\n` +
    `- Create curiosity gaps ("What happens when...", "The truth about...", "Why nobody talks about...")\n` +
    `- Add emotional triggers (fear, surprise, excitement, controversy)\n` +
    `- Include regional relevance for ${region} when appropriate\n` +
    `- Use proven viral patterns: "X Things You Didn't Know About...", "The Real Reason Why...", "What [Expert] Doesn't Want You to Know"\n` +
    `- Make them specific and actionable, not generic\n` +
    `- Length: 25-45 words for maximum impact\n\n` +
    `MAIN TOPIC: "${topic}"\n` +
    `REGION FOCUS: ${region}\n\n` +
    `ORIGINAL BASIC SUGGESTIONS TO TRANSFORM:\n` +
    suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n') +
    `\n\nEXAMPLE TRANSFORMATIONS:\n` +
    `"Government policies" → "5 Shocking Government Policies That Could Bankrupt You in ${region} - What They Don't Want You to Know"\n` +
    `"Budget analysis" → "I Analyzed ${region}'s Budget for 30 Days - The Hidden Truth Will Shock You"\n` +
    `"Economic impact" → "How This One Economic Change Could Destroy Your Savings in ${region} (Exposed)"\n\n` +
    `Return ONLY valid JSON in this exact shape (no markdown, no commentary):\n` +
    `{ "enhanced": string[] }\n\n` +
    `The enhanced array must have exactly ${suggestions.length} items. Each item must be a COMPLETELY TRANSFORMED and ENHANCED version of the original, not a minor modification.`;

  return withRetry(async () => {
    const res = await model.generateContent(prompt);
   
    const text = res.response.text();
    console.log('🤖 Raw Gemini response:', text.substring(0, 500) + '...');
    
    const parsed = extractJsonFromText(text);
    // console.log('📊 Parsed JSON:', parsed);
    
    if (parsed) {
      if (Array.isArray(parsed)) {
        // console.log('✅ Found direct array format');
        return { enhanced: parsed as string[] };
      }
      if (parsed && Array.isArray((parsed as any).enhanced)) {
        // console.log('✅ Found enhanced array in object');
        const enhanced = (parsed as any).enhanced as string[];
        
        // Validate that suggestions are actually enhanced, not just repeated
        const actuallyEnhanced = enhanced.filter((enh, idx) => {
          const original = suggestions[idx]?.toLowerCase() || '';
          const enhancedLower = enh.toLowerCase();
          // Consider it enhanced if it's significantly different (less than 70% similarity)
          const similarity = calculateSimilarity(original, enhancedLower);
          return similarity < 0.7;
        });
        
        if (actuallyEnhanced.length >= suggestions.length * 0.5) {
          // console.log('✅ Suggestions are genuinely enhanced');
          return { enhanced };
        } else {
          console.log('⚠️ Suggestions appear to be too similar to originals, using fallback');
        }
      }
    }
    
    // console.log('⚠️ Could not parse valid enhancement, using fallback');

    // Fallback - create meaningful enhanced versions
    return {
      enhanced: suggestions.map((suggestion, index) => {
        const patterns = [
          `The Shocking Truth About ${suggestion} in ${region} - What They Don't Want You to Know`,
          `5 Hidden Facts About ${suggestion} That Will Change Everything You Thought You Knew`,
          `Why Nobody Talks About ${suggestion} in ${region} - The Real Story Exposed`,
          `I Investigated ${suggestion} for 30 Days - What I Found Will Shock You`,
          `The Secret Behind ${suggestion} That ${region} Doesn't Want You to Discover`
        ];
        return patterns[index % patterns.length];
      })
    };
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnhanceTopicSuggestionsResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { suggestions, topic, region } = req.body as EnhanceTopicSuggestionsRequest;

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(400).json({ error: 'Suggestions array is required and must not be empty' });
    }

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // console.log('🎯 Enhancing topic suggestions:', { topic, suggestionsCount: suggestions.length });
    // console.log('📋 Original suggestions:', suggestions);

    const result = await enhanceTopicSuggestionsWithGemini({ suggestions, topic, region });
    
    // console.log('✨ Enhanced suggestions:', result.enhanced);

    return res.status(200).json({
      enhancedSuggestions: result.enhanced,
      originalSuggestions: suggestions
    });

  } catch (error) {
    console.error('Error in enhance-topic-suggestions API:', error);
    return res.status(500).json({ error: 'Failed to enhance topic suggestions' });
  }
}