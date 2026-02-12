import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_FPS = 30;

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
    const maxScenes = 12;
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

const deriveCompositionId = (topic: string) => {
    const cleaned = (topic || 'GeneratedVideo')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    return cleaned || 'GeneratedVideoComposition';
};

const inferResolution = (aspectRatio: string) => {
    if (aspectRatio === '9:16') return { resolution: '1080x1920', width: 1080, height: 1920 };
    if (aspectRatio === '1:1') return { resolution: '1080x1080', width: 1080, height: 1080 };
    return { resolution: '1920x1080', width: 1920, height: 1080 };
};

const buildScenePrompt = (
    transcriptionText: string,
    desiredSceneCount: number,
    language: string,
    visualTheme: string,
    aspectRatio: string
) => {
    return `
  You are a professional video scene planner.

  Break this ${language} transcription into ${desiredSceneCount} scenes using semantic boundaries.

  Return JSON ONLY in this exact format:

  {
    "scenes": [
      {
        "id": "scene-1",
        "narration": "Exact narration text for this scene",
        "emotionalTone": "dramatic | neutral | urgent | informative",
        "overlayStyleSuggestion": "kinetic_text | headline_bold | lower_third",
        "highlightedKeywordOverlays": [
          {
            "word": "keyword",
            "overlayType": "kinetic_text | lower_third | headline_bold",
            "animation": "fade_in | slide_up | scale_pop | none"
          }
        ],
        "backgroundPrompt": "cinematic background prompt for image generation",
        "cameraMotion": "slow_zoom | pan_left | parallax | static",
        "transitionSuggestion": "cut | crossfade | cinematic_wipe",
        "audioLayers": {
          "backgroundMusic": "dramatic_news_bed.mp3",
          "sfx": ["soft_whoosh.mp3"]
        }
      }
    ]
  }

  Rules:
  - Preserve original language: ${language}
  - Each scene must have 30–200 words
  - Keep style aligned to theme: ${visualTheme}
  - Optimize for aspect ratio: ${aspectRatio}
  - Include meaningful keywords for overlays
  - Generate strong cinematic background prompts
  - Do not include markdown or explanation
  - Output strictly valid JSON

  Transcription:
  ${transcriptionText}
  `.trim();
};

const normalizeOverlayKeywords = (input: any) => {
    if (!Array.isArray(input)) return [];
    return input
        .map((item: any) => ({
            word: String(item?.word || '').trim(),
            overlayType: String(item?.overlayType || 'kinetic_text').trim(),
            animation: String(item?.animation || 'fade_in').trim()
        }))
        .filter((item: any) => item.word.length > 0);
};

const extractKeywordStrings = (scene: any) => {
    if (Array.isArray(scene?.highlightedKeywords)) {
        return scene.highlightedKeywords
            .map((item: any) => String(item || '').trim())
            .filter((item: string) => item.length > 0);
    }
    const overlays = normalizeOverlayKeywords(scene?.highlightedKeywordOverlays);
    return overlays.map((item: any) => item.word);
};

const requestSemanticScenes = async (
    transcriptionText: string,
    desiredSceneCount: number,
    language: string,
    visualTheme: string,
    aspectRatio: string
) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: AI_CONFIG.GEMINI.MODEL_PRO,
        generationConfig: { temperature: 0.6 }
    });
    const prompt = buildScenePrompt(transcriptionText, desiredSceneCount, language, visualTheme, aspectRatio);
    const result = await model.generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text());
    const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : Array.isArray(parsed) ? parsed : [];
    return scenes
        .map((scene: any, index: number) => {
            const highlightedKeywordOverlays = normalizeOverlayKeywords(scene?.highlightedKeywordOverlays);
            const highlightedKeywords = extractKeywordStrings(scene);
            return {
                id: String(scene?.id || `scene-${index + 1}`),
                narration: String(scene?.narration || '').trim(),
                emotionalTone: String(scene?.emotionalTone || 'neutral').trim(),
                overlayStyleSuggestion: String(scene?.overlayStyleSuggestion || 'kinetic_text').trim(),
                highlightedKeywords,
                highlightedKeywordOverlays,
                backgroundPrompt: String(scene?.backgroundPrompt || '').trim(),
                cameraMotion: String(scene?.cameraMotion || 'static').trim(),
                transitionSuggestion: String(scene?.transitionSuggestion || 'cut').trim(),
                audioLayers: {
                    backgroundMusic: String(scene?.audioLayers?.backgroundMusic || 'dramatic_news_bed.mp3').trim(),
                    sfx: Array.isArray(scene?.audioLayers?.sfx)
                        ? scene.audioLayers.sfx.map((item: any) => String(item).trim()).filter(Boolean)
                        : ['soft_whoosh.mp3']
                }
            };
        })
        .filter((scene: any) => scene.narration.length > 0);
};

const calculateSceneTimings = (sceneItems: Array<any>, totalDuration: number, fps: number) => {
    if (sceneItems.length === 0) return [];
    const totalWords = sceneItems.reduce((sum, scene) => {
        return sum + (scene?.narration || '').split(/\s+/).filter(Boolean).length;
    }, 0) || sceneItems.length;
    const safeDuration = totalDuration > 0 ? totalDuration : sceneItems.length * 10;
    const wordsPerSecond = safeDuration > 0 && totalWords > 0 ? totalWords / safeDuration : 2.5;
    let currentTime = 0;
    return sceneItems.map((scene, index) => {
        const wordsInScene = (scene?.narration || '').split(/\s+/).filter(Boolean).length || 1;
        const proportionalDuration = Math.max(0.5, wordsInScene / wordsPerSecond);
        let endTime = currentTime + proportionalDuration;
        if (index === sceneItems.length - 1 || endTime > safeDuration) {
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
        const startFrame = Math.max(0, Math.floor(startRounded * fps));
        const endFrame = Math.max(startFrame, Math.floor(endRounded * fps));
        const durationInFrames = Math.max(1, endFrame - startFrame);
        const transitionDurationFrames = Math.min(15, Math.max(6, Math.round(fps / 2)));
        const backgroundPrompt = scene?.backgroundPrompt || `cinematic documentary visual based on: ${scene?.narration || ''}`;
        const overlayStyleSuggestion = scene?.overlayStyleSuggestion || 'kinetic_text';
        const highlightedKeywordOverlays = Array.isArray(scene?.highlightedKeywordOverlays) ? scene.highlightedKeywordOverlays : [];
        const highlightedKeywords = Array.isArray(scene?.highlightedKeywords) ? scene.highlightedKeywords : [];
        const emotionalTone = scene?.emotionalTone || 'neutral';
        const cameraMotion = scene?.cameraMotion || 'static';
        return {
            id: scene?.id || `scene-${index + 1}`,
            narration: scene?.narration || '',
            duration: formatTimeRange(startRounded, endRounded),
            words: wordsInScene,
            startTime: startRounded,
            endTime: endRounded,
            durationInSeconds: durationRounded,
            startFrame,
            endFrame,
            durationInFrames,
            emotionalTone,
            overlayStyleSuggestion,
            highlightedKeywords,
            highlightedKeywordOverlays,
            backgroundPrompt,
            cameraMotion,
            transitionSuggestion: scene?.transitionSuggestion || 'crossfade',
            aiAssets: {
                backgroundType: 'ai_image',
                cameraMotion,
                parallax: cameraMotion === 'parallax',
                generatedBackgroundUrl:''
            },
            overlays: {
                lowerThird: null,
                subtitleStyle: {
                    position: 'bottom-center',
                    fontSize: 48,
                    color: '#FFFFFF'
                }
            },
            audioLayers: scene?.audioLayers || {
                backgroundMusic: 'dramatic_news_bed.mp3',
                sfx: ['soft_whoosh.mp3']
            },
            transition: {
                type: scene?.transitionSuggestion || 'crossfade',
                durationFrames: transitionDurationFrames
            }
        };
    });
};

const buildProjectDefaults = (input: {
    transcription: string;
    videoDurationSeconds: number;
    fps: number;
    aspectRatio: string;
    visualTheme: string;
    topic: string;
    language: string;
}) => {
    const resolution = inferResolution(input.aspectRatio);
    const totalFrames = Math.max(1, Math.floor(input.videoDurationSeconds * input.fps));
    return {
        compositionId: deriveCompositionId(input.topic),
        duration: input.videoDurationSeconds,
        fps: input.fps,
        totalFrames,
        resolution: resolution.resolution,
        aspectRatio: input.aspectRatio,
        visualStyle: {
            theme: input.visualTheme,
            colorGrade: 'high contrast warm',
            fontFamily: input.language.toLowerCase() === 'urdu' ? 'Noto Nastaliq Urdu' : 'Inter',
            motionStyle: 'slow zoom + parallax'
        },
        voiceConfig: {
            provider: 'gemini-tts',
            voice: input.language.toLowerCase() === 'urdu' ? 'ur-PK-Male-01' : 'en-US-Neural2-D',
            speed: 1,
            pitch: 0
        },
        chromaKeyConfig: {
            enabled: true,
            color: '#00FF00',
            similarity: 0.35,
            smoothness: 0.1,
            spill: 0.2
        },
        llmScenePlanning: {
            provider: 'gemini-pro',
            temperature: 0.6,
            sceneSegmentationStrategy: 'semantic + keyword emphasis'
        },
        layout: {
            safeZones: {
                top: 80,
                bottom: 80,
                left: 100,
                right: 100
            },
            titleArea: {
                x: 120,
                y: 120,
                width: Math.max(600, resolution.width - 240),
                height: 260
            },
            logoPosition: {
                x: 1600,
                y: 0,
                width: 200,
                height: 200
            }
        },
        narration_type: 'narration',
        transcription: input.transcription
    };
};

const buildFallbackCandidates = (transcription: string, desiredSceneCount: number) => {
    const sceneTexts = ensureSceneWordCount(fallbackSceneTexts(transcription, desiredSceneCount));
    return sceneTexts.map((text, index) => ({
        id: `scene-${index + 1}`,
        narration: text,
        emotionalTone: 'neutral',
        overlayStyleSuggestion: 'kinetic_text',
        highlightedKeywords: [],
        highlightedKeywordOverlays: [],
        backgroundPrompt: `cinematic documentary visual based on: ${text}`,
        cameraMotion: 'slow_zoom',
        transitionSuggestion: 'crossfade',
        audioLayers: {
            backgroundMusic: 'dramatic_news_bed.mp3',
            sfx: ['soft_whoosh.mp3']
        }
    }));
};

const parseJsonResponse = (raw: string) => {
    let text = raw.trim();
    if (text.includes('```json')) {
        text = text.split('```json')[1] || text;
        text = text.split('```')[0] || text;
    } else if (text.includes('```')) {
        text = text.split('```')[1] || text;
        text = text.split('```')[0] || text;
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const transcription = String(body?.transcription || '').trim();
        const requestedDurationSeconds = Number(body?.videoDurationSeconds || 0);
        const fps = Number(body?.fps || DEFAULT_FPS) > 0 ? Number(body?.fps || DEFAULT_FPS) : DEFAULT_FPS;
        const aspectRatio = String(body?.aspectRatio || '16:9').trim() || '16:9';
        const visualTheme = String(body?.visualTheme || 'cinematic geopolitical documentary').trim();
        const language = String(body?.language || 'urdu').trim() || 'urdu';
        const topic = String(body?.topic || transcription.slice(0, 80) || 'Generated Video').trim();

        if (!transcription) {
            return NextResponse.json({ error: 'transcription is required' }, { status: 400 });
        }

        const totalWords = transcription.split(/\s+/).filter(Boolean).length;
        const estimatedDurationSeconds = totalWords > 0 ? totalWords / 2.5 : 0;
        const videoDurationSeconds = requestedDurationSeconds > 0 ? requestedDurationSeconds : estimatedDurationSeconds;
        const desiredSceneCount = determineSceneCount(videoDurationSeconds, totalWords);

        let sceneCandidates: Array<any> = [];
        try {
            sceneCandidates = await requestSemanticScenes(transcription, desiredSceneCount, language, visualTheme, aspectRatio);
        } catch {
            sceneCandidates = [];
        }

        if (!Array.isArray(sceneCandidates) || sceneCandidates.length === 0) {
            sceneCandidates = buildFallbackCandidates(transcription, desiredSceneCount);
        } else {
            const enriched = sceneCandidates.map((scene: any, index: number) => {
                return {
                    id: scene.id || `scene-${index + 1}`,
                    narration: scene.narration,
                    emotionalTone: scene.emotionalTone || 'neutral',
                    overlayStyleSuggestion: scene.overlayStyleSuggestion || 'kinetic_text',
                    highlightedKeywords: Array.isArray(scene.highlightedKeywords) ? scene.highlightedKeywords : [],
                    highlightedKeywordOverlays: Array.isArray(scene.highlightedKeywordOverlays) ? scene.highlightedKeywordOverlays : [],
                    backgroundPrompt: scene.backgroundPrompt || `cinematic documentary visual based on: ${scene.narration}`,
                    cameraMotion: scene.cameraMotion || 'static',
                    transitionSuggestion: scene.transitionSuggestion || 'crossfade',
                    audioLayers: scene.audioLayers || {
                        backgroundMusic: 'dramatic_news_bed.mp3',
                        sfx: ['soft_whoosh.mp3']
                    }
                };
            });
            sceneCandidates = enriched;
        }

        const scenes = calculateSceneTimings(sceneCandidates, videoDurationSeconds, fps);
        const projectDefaults = buildProjectDefaults({
            transcription,
            videoDurationSeconds,
            fps,
            aspectRatio,
            visualTheme,
            topic,
            language
        });

        return NextResponse.json({ projectDefaults, scenes });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Scene planning failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
