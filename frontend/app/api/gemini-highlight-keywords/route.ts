import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/utils/geminiService';
import { SceneData } from '@/types/sceneData';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenesData } = body as { scenesData: SceneData[] };
    if (!Array.isArray(scenesData) || scenesData.length === 0) {
      return NextResponse.json({ error: 'scenesData array required' }, { status: 400 });
    }

    const prompt = `You are an assistant that extracts EXACT words and phrases from narration paragraphs.
IMPORTANT: Only extract words and phrases that appear EXACTLY in the original text. Do not paraphrase, interpret, or create new phrases.

For each paragraph, identify 5-12 exact words or short phrases (1-4 words) that are most useful for visual search. These must be:
- Exact words or phrases from the original text
- Nouns, adjectives, verbs, or short descriptive phrases
- Useful for finding relevant images/videos
- Avoid generic words like "the", "and", "is", "are"

Return ONLY valid JSON in this exact format:
{
  "results": [
    { "id": "scene-1", "highlightedKeywords": ["exact word", "exact phrase"] }
  ]
}

Paragraphs:
${scenesData.map((c: SceneData, i: number) => `ID: ${c.id}\n${c.narration}`).join('\n\n')}`;

    const result = await getGeminiModel().generateContent(prompt);
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

    const normalized = results.map((r: any) => {
      const sceneDataId = String(r?.id ?? '');
      const sceneData = scenesData.find((c: SceneData) => c.id === sceneDataId);
      const narrationText = sceneData?.narration?.toLowerCase() || '';
      
      const validKeywords = Array.isArray(r?.highlightedKeywords)
        ? r.highlightedKeywords
            .map((k: any) => String(k).trim())
            .filter(Boolean)
            .filter((keyword: string) => {
              // Check if the keyword exists exactly in the narration text
              const keywordLower = keyword.toLowerCase();
              return narrationText.includes(keywordLower);
            })
        : [];
      
      return {
        id: sceneDataId,
        highlightedKeywords: validKeywords
      };
    });

    return NextResponse.json({ results: normalized });
  } catch (error: any) {
    const message = error?.message || 'Failed to extract highlighted keywords';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


