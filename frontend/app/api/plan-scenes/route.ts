import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const formatTimeRange = (startTime: number, endTime: number) => {
    const formatPoint = (point: number) => {
        const safe = Math.max(0, point);
        const mins = Math.floor(safe / 60);
        const secs = Math.round(safe - mins * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return `${formatPoint(startTime)} - ${formatPoint(endTime)}`;
};

const determineSceneCount = (totalDuration: number, totalWords: number) => {
    const minScenes = 2;
    const maxScenes = 8;
    const minWordsPerScene = 30;
    if (totalDuration <= 0) return minScenes;
    const durationBased = Math.max(
        minScenes,
        Math.min(maxScenes, Math.round(totalDuration / 15) || minScenes)
    );
    const maxFromWords = Math.max(
        minScenes,
        Math.min(maxScenes, Math.max(1, Math.floor(totalWords / minWordsPerScene)))
    );
    return Math.max(minScenes, Math.min(durationBased, maxFromWords));
};

const sentenceTokenize = (text: string) => {
    const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    if (sentences.length > 0) return sentences;
    return text.trim() ? [text.trim()] : [];
};

const fallbackSceneTexts = (transcription: string, desiredSceneCount: number) => {
    const minWordsPerScene = 30;
    const maxWordsPerScene = 200;
    const maxScenes = 8;
    const sentences = sentenceTokenize(transcription);
    if (sentences.length === 0) return [];

    const scenes: string[] = [];
    let currentBlock: string[] = [];
    let currentWordCount = 0;

    for (const sentence of sentences) {
        const sentenceWordCount = sentence.split(/\s+/).filter(Boolean).length;
        if (currentWordCount + sentenceWordCount > maxWordsPerScene && currentBlock.length > 0) {
            scenes.push(currentBlock.join(' ').trim());
            currentBlock = [];
            currentWordCount = 0;
        }
        currentBlock.push(sentence);
        currentWordCount += sentenceWordCount;
        if (currentWordCount >= minWordsPerScene && scenes.length + 1 < desiredSceneCount) {
            scenes.push(currentBlock.join(' ').trim());
            currentBlock = [];
            currentWordCount = 0;
        }
    }

    if (currentBlock.length > 0) {
        scenes.push(currentBlock.join(' ').trim());
    }

    while (scenes.length < desiredSceneCount) {
        let longestIndex = -1;
        let longestWords = 0;
        scenes.forEach((scene, idx) => {
            const count = scene.split(/\s+/).filter(Boolean).length;
            if (count > longestWords) {
                longestWords = count;
                longestIndex = idx;
            }
        });
        if (longestIndex === -1) break;
        const longestScene = scenes.splice(longestIndex, 1)[0];
        const words = longestScene.split(/\s+/).filter(Boolean);
        const midpoint = Math.floor(words.length / 2);
        const firstHalf = words.slice(0, midpoint).join(' ').trim();
        const secondHalf = words.slice(midpoint).join(' ').trim();
        if (!firstHalf || !secondHalf) {
            scenes.splice(longestIndex, 0, longestScene);
            break;
        }
        scenes.splice(longestIndex, 0, firstHalf, secondHalf);
    }

    return scenes.slice(0, maxScenes);
};

const ensureSceneWordCount = (sceneTexts: string[]) => {
    const minWordsPerScene = 30;
    const filtered: string[] = [];
    for (const scene of sceneTexts) {
        const words = scene.split(/\s+/).filter(Boolean);
        if (words.length === 0) continue;
        if (words.length < minWordsPerScene) {
            if (filtered.length > 0) {
                filtered[filtered.length - 1] = `${filtered[filtered.length - 1].trim()} ${scene.trim()}`.trim();
            } else {
                filtered.push(scene.trim());
            }
        } else {
            filtered.push(scene.trim());
        }
    }
    return filtered.length > 0 ? filtered : sceneTexts;
};

const calculateSceneTimings = (sceneTexts: string[], totalDuration: number) => {
    if (sceneTexts.length === 0) return [];
    const totalWords = sceneTexts.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) || sceneTexts.length;
    const safeDuration = totalDuration > 0 ? totalDuration : sceneTexts.length * 10;
    const wordsPerSecond = safeDuration > 0 && totalWords > 0 ? totalWords / safeDuration : 2.5;
    let currentTime = 0;
    return sceneTexts.map((sceneText, index) => {
        const wordsInScene = sceneText.split(/\s+/).filter(Boolean).length || 1;
        const proportionalDuration = Math.max(0.5, wordsInScene / wordsPerSecond);
        let endTime = currentTime + proportionalDuration;
        if (index === sceneTexts.length - 1 || endTime > safeDuration) {
            endTime = safeDuration;
        }
        if (currentTime > safeDuration) {
            currentTime = safeDuration;
            endTime = safeDuration;
        }
        const durationInSeconds = Math.max(0, endTime - currentTime);
        const startRounded = Math.round(currentTime * 100) / 100;
        const endRounded = Math.round(endTime * 100) / 100;
        const durationRounded = Math.round(durationInSeconds * 100) / 100;
        const item = {
            id: `scene-${index + 1}`,
            narration: sceneText.trim(),
            duration: formatTimeRange(currentTime, endTime),
            words: sceneText.split(/\s+/).filter(Boolean).length,
            startTime: startRounded,
            endTime: endRounded,
            durationInSeconds: durationRounded,
        };
        currentTime = endTime;
        return item;
    });
};

const buildScenePrompt = (transcriptionText: string, desiredSceneCount: number, language: string) => {
    return `
You are an expert video editing assistant that segments narration into coherent scenes.

Return JSON ONLY in the following format:
{
  "scenes": [
    {
      "title": "Scene title (optional)",
      "summary": "Brief summary (1 sentence)",
      "narration": "Exact narration text for this scene"
    }
  ]
}

Requirements:
- Target ${desiredSceneCount} scenes (minimum 2, maximum 8) unless text is extremely short.
- Each scene must contain 30-200 words.
- Preserve the original language (${language}) and logical flow.
- Break at natural topic transitions and avoid duplication.
- Use the provided script context to keep narration relevant.

<transcription>
${transcriptionText}
</transcription>
`.trim();
};

const parseJsonResponse = (raw: string) => {
    let text = raw.trim();
    if (text.includes('```json')) {
        text = text.split('```json', 1)[1];
        text = text.split('```', 1)[0];
    } else if (text.includes('```')) {
        text = text.split('```', 1)[1];
        text = text.split('```', 1)[0];
    }
    try {
        return JSON.parse(text);
    } catch {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        if (start !== -1 && end !== -1) {
            return JSON.parse(text.slice(start, end));
        }
        throw new Error('Invalid JSON response from Gemini');
    }
};

const requestSemanticScenes = async (transcriptionText: string, desiredSceneCount: number, language: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: AI_CONFIG.GEMINI.MODEL_FLASH,
        generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
    });
    const prompt = buildScenePrompt(transcriptionText, desiredSceneCount, language);
    const result = await model.generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text());
    const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : Array.isArray(parsed) ? parsed : [];
    return scenes
        .map((scene: any) => ({
            narration: scene?.narration || scene?.text || scene?.content || '',
            summary: scene?.summary || ''
        }))
        .filter((scene: any) => typeof scene.narration === 'string' && scene.narration.trim().length > 0);
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const transcription = String(body?.transcription || '').trim();
        const requestedDurationSeconds = Number(body?.videoDurationSeconds || 0);
        const language = String(body?.language || 'ur').trim() || 'ur';

        if (!transcription) {
            return NextResponse.json({ error: 'transcription is required' }, { status: 400 });
        }

        const totalWords = transcription.split(/\s+/).filter(Boolean).length;
        const estimatedDurationSeconds = totalWords > 0 ? totalWords / 2.5 : 0;
        const videoDurationSeconds = requestedDurationSeconds > 0 ? requestedDurationSeconds : estimatedDurationSeconds;
        const desiredSceneCount = determineSceneCount(videoDurationSeconds, totalWords);

        let sceneCandidates: Array<{ narration: string; summary: string }> = [];
        try {
            sceneCandidates = await requestSemanticScenes(transcription, desiredSceneCount, language);
        } catch {
            sceneCandidates = [];
        }

        let sceneTexts = sceneCandidates.map(scene => scene.narration.trim()).filter(Boolean);
        if (sceneTexts.length === 0 || sceneTexts.length < desiredSceneCount) {
            sceneTexts = fallbackSceneTexts(transcription, desiredSceneCount);
        } else {
            sceneTexts = ensureSceneWordCount(sceneTexts);
        }

        const scenePayload = calculateSceneTimings(sceneTexts, videoDurationSeconds);
        const scenes = scenePayload.map((scene, index) => ({
            ...scene,
            summary: sceneCandidates[index]?.summary || '',
        }));

        return NextResponse.json({ scenes });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Scene planning failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
