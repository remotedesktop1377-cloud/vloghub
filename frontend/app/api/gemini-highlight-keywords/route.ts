import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: 0.2 }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapters } = body as { chapters: Array<{ id: string; narration: string }> };

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: 'chapters array required' }, { status: 400 });
    }

    const prompt = `You are an assistant that extracts concise highlight keywords from narration paragraphs.
For each paragraph, identify 5-12 short, specific keywords or short phrases that are most useful for visuals search (people, places, objects, events, actions, nouns). Avoid generic words. No hashtags. Keep phrases under 4 words.

Return ONLY valid JSON in this exact format:
{
  "results": [
    { "id": "scene-1", "highlightedKeywords": ["keyword1", "keyword2", "keyword3"] }
  ]
}

Paragraphs:
${chapters.map((c, i) => `ID: ${c.id}\n${c.narration}`).join('\n\n')}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const results = Array.isArray(parsed?.results) ? parsed.results : [];

    const normalized = results.map((r: any) => ({
      id: String(r?.id ?? ''),
      highlightedKeywords: Array.isArray(r?.highlightedKeywords)
        ? r.highlightedKeywords.map((k: any) => String(k).trim()).filter(Boolean)
        : []
    }));

    return NextResponse.json({ results: normalized });
  } catch (error: any) {
    const message = error?.message || 'Failed to extract highlighted keywords';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


