import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL_PRO,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  urdu: 'Urdu',
  'urdu (pakistan)': 'Urdu',
  'urdu pakistan': 'Urdu',
  'urdu (romanized)': 'Urdu',
  hindi: 'Hindi',
  'hindi (india)': 'Hindi',
  english: 'English',
  'english (uk)': 'English',
  'english (us)': 'English',
  arabic: 'Arabic',
  'arabic (ksa)': 'Arabic',
  punjabi: 'Punjabi',
  'punjabi (india)': 'Punjabi',
  bengali: 'Bengali'
};

const RTL_LANGS = new Set(['urdu', 'arabic', 'persian', 'pashto', 'sindhi', 'balochi', 'hebrew']);
const URDU_SPECIFIC_REGEX = /[\u0679\u0686\u0688\u0691\u06BA\u06BE\u06C1\u06D2\u06AF\u06B1\u06CC]/;
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF]/;
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const GURMUKHI_REGEX = /[\u0A00-\u0A7F]/;
const BENGALI_REGEX = /[\u0980-\u09FF]/;

const normalizeLanguageName = (lang?: string | null): string => {
  if (!lang) return '';
  const trimmed = lang.trim();
  if (!trimmed) return '';
  const alias = LANGUAGE_ALIAS_MAP[trimmed.toLowerCase()];
  if (alias) return alias;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const detectSpeakerLanguage = (samples: Array<string | null | undefined>) => {
  const joined = samples
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ');

  if (!joined) {
    return { language: null as string | null, confidence: 0, reason: 'No speaker-provided text to analyze' };
  }

  if (URDU_SPECIFIC_REGEX.test(joined)) {
    return { language: 'Urdu', confidence: 0.98, reason: 'Urdu-specific Perso-Arabic letters detected' };
  }

  if (ARABIC_SCRIPT_REGEX.test(joined)) {
    return { language: 'Arabic', confidence: 0.9, reason: 'Arabic script detected' };
  }

  if (DEVANAGARI_REGEX.test(joined)) {
    return { language: 'Hindi', confidence: 0.95, reason: 'Devanagari script detected' };
  }

  if (GURMUKHI_REGEX.test(joined)) {
    return { language: 'Punjabi', confidence: 0.9, reason: 'Gurmukhi script detected' };
  }

  if (BENGALI_REGEX.test(joined)) {
    return { language: 'Bengali', confidence: 0.85, reason: 'Bengali script detected' };
  }

  return { language: null as string | null, confidence: 0, reason: 'No distinctive script identified' };
};

const buildLanguageInstructions = (language: string, conflictNote?: string) => {
  const isRTL = RTL_LANGS.has(language.toLowerCase());
  const scriptRequirement = isRTL
    ? `Use the native ${language} Perso-Arabic script (no transliteration) with authentic vocabulary.`
    : `Use natural ${language} wording, phrasing, and cultural references.`;
  return `Write the entire script in fluent, natural ${language}. ${scriptRequirement} ${
    conflictNote ? conflictNote : ''
  }`.trim();
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, hypothesis, details, region, duration, language: requestedLanguage, narration_type } = body;

    // Validate required fields
    if (!topic || !region || !duration || !requestedLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedRequestedLanguage = normalizeLanguageName(requestedLanguage);
    const detectedLanguage = detectSpeakerLanguage([topic, hypothesis, details]);
    const useDetectedLanguage = Boolean(detectedLanguage.language && detectedLanguage.confidence >= 0.5);
    const finalLanguage = useDetectedLanguage
      ? detectedLanguage.language!
      : (normalizedRequestedLanguage || 'English');
    const languageSource = useDetectedLanguage ? 'detected' : 'requested';
    const languageConflictNote =
      useDetectedLanguage && normalizedRequestedLanguage && normalizedRequestedLanguage.toLowerCase() !== finalLanguage.toLowerCase()
        ? `Detected speaker language (${finalLanguage}) overrides requested language (${normalizedRequestedLanguage}).`
        : '';
    const languageInstructions = buildLanguageInstructions(finalLanguage, languageConflictNote);

    const prompt = `You are a professional YouTube content scriptwriter specializing in viral, engaging content.

Create a compelling video script based on the following information:

**Main Topic:** ${topic}
**Region Focus:** ${region}
**Video Duration:** ${duration} minute(s)
**Language:** ${finalLanguage} (${languageSource === 'detected' ? `detected automatically - ${detectedLanguage.reason}` : 'user selected preference'})
**Topic Details:** ${details}
**Hypothesis/Angle:** ${hypothesis}

**SCRIPT REQUIREMENTS:**
1. **Hook (First 15 seconds):** Start with a powerful, attention-grabbing opening that makes viewers want to continue watching
2. **Clear Structure:** Organize content logically with smooth transitions
3. **Engaging Tone:** Write in a conversational, enthusiastic style that maintains viewer interest
4. **Call-to-Actions:** Include natural prompts for likes, comments, and subscriptions
5. **Regional Relevance:** Incorporate ${region}-specific context and examples where appropriate
6. **Duration Appropriate:** Ensure content fits the ${duration}-minute format
7. **Language:** ${languageInstructions}

**STYLE:** ${narration_type === 'interview' ? 'Interview (Q/A between host and guest)' : 'Narration (single narrator)'}

For Interview style, write the main_content as alternating question/answer lines with localized labels and natural questions:
- Use localized labels in ${finalLanguage}: Host and Guest lines must begin with these labels followed by a colon
- Keep each line short and punchy; make questions derived from the upcoming answer
- Ensure each question and each answer is on its own line, separated by blank lines between logical blocks

For Narration style, write normal paragraphs.

**OUTPUT FORMAT:**
Return ONLY valid JSON in this exact structure (no markdown, no commentary). For Interview style, the main_content must already be in Q/A lines as described:

{
  "title": "Compelling video title",
  "hook": "First 15 seconds hook text",
  "main_content": "Main script content with clear paragraph breaks",
  "conclusion": "Strong conclusion text",
  "call_to_action": "Call to action for likes, comments, subscribe",
  "estimated_words": 155,
}

**IMPORTANT:** 
- Return ONLY the JSON object, no additional text
- Ensure the JSON is valid and complete
- The main_content should be the full script text
- estimated_words should be the actual word count of the script`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const rawText = response.text();

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('Generated script is empty');
      }

      // Extract JSON from the response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response format from Gemini API');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsedData.main_content || !parsedData.title) {
        throw new Error('Generated script missing required fields');
      }

      // Combine all content into the main script
      let fullScript = `${parsedData.hook || ''}\n\n${parsedData.main_content || ''}\n\n${parsedData.conclusion || ''}\n\n${parsedData.call_to_action || ''}`.trim();

      // If interview style requested, ensure interview Q/A formatting with language localization
      if ((narration_type || '').toLowerCase() === 'interview') {
        const getInterviewLocalization = (lang: string) => {
          const l = (lang || '').toLowerCase();
          if (l.includes('urdu') || l.includes('balochi') || l.includes('punjabi')) {
            return { interviewerLabel: 'میزبان', guestLabel: 'مہمان', qPrefix: ' کیا آپ ', qSuffix: ' پر مزید روشنی ڈالیں گے؟' } as const;
          }
          if (l.includes('arabic')) {
            return { interviewerLabel: 'المحاور', guestLabel: 'الضيف', qPrefix: ' هل يمكنك التوسع في ', qSuffix: '؟' } as const;
          }
          return { interviewerLabel: 'Interviewer', guestLabel: 'Guest', qPrefix: ' Could you elaborate on ', qSuffix: '?' } as const;
        };

        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const generateInterviewQAFromScript = (script: string, lang: string) => {
          const loc = getInterviewLocalization(lang);
          const paragraphs = (script || '')
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
          const labelPattern = new RegExp(`^\\s*(?:${escapeRegExp(loc.interviewerLabel)}|${escapeRegExp(loc.guestLabel)}|Interviewer|Guest)\\s*:\\s*`, 'i');
          const toQuestion = (text: string) => {
            const cleaned = text.replace(labelPattern, '').trim();
            const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] || cleaned;
            const words = firstSentence.split(/\s+/).slice(0, 12).join(' ');
            const topic = words.replace(/[\.:;]+$/, '');
            return `${loc.interviewerLabel}:${loc.qPrefix}${topic}${loc.qSuffix}`;
          };
          const lines: string[] = [];
          for (const p of paragraphs) {
            const cleanedP = p.replace(labelPattern, '').trim();
            lines.push(toQuestion(cleanedP));
            lines.push(`${loc.guestLabel}: ${cleanedP}`);
            lines.push('');
          }
          return lines.join('\n').trim();
        };

        // If the model already returned Q/A with localized labels, don't re-wrap
        const loc = getInterviewLocalization(finalLanguage);
        const alreadyQA = fullScript.split('\n').some(l => {
          const t = l.trim();
          return t.startsWith(`${loc.interviewerLabel}:`) || t.startsWith(`${loc.guestLabel}:`) || t.startsWith('Interviewer:') || t.startsWith('Guest:');
        });
        if (!alreadyQA) {
          fullScript = generateInterviewQAFromScript(fullScript, finalLanguage);
        }
      }

      return NextResponse.json({
        script: fullScript,
        title: parsedData.title || 'Untitled Script',
        hook: parsedData.hook || '',
        main_content: parsedData.main_content || '',
        conclusion: parsedData.conclusion || '',
        call_to_action: parsedData.call_to_action || '',
        estimated_words: parsedData.estimated_words || 0,
        emotionalTone: parsedData.emotionalTone || 'Engaging',
        pacing: parsedData.pacing || 'Dynamic',
        language_used: finalLanguage,
        language_source: languageSource,
        language_detection: {
          requested: normalizedRequestedLanguage || null,
          detected: detectedLanguage.language,
          confidence: detectedLanguage.confidence,
          reason: detectedLanguage.reason,
          applied: finalLanguage
        }
      });

    } catch (error) {
      console.error('Error generating script:', error);
      return NextResponse.json(
        {
          status: 400,
          error: 'Failed to generate script'
        }
      );
    }

  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      {
        status: 500,
        error: 'Failed to generate script'
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

