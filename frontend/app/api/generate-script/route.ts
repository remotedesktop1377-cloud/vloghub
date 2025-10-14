import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, hypothesis, details, region, duration, language, narration_type } = body;

    // Validate required fields
    if (!topic || !region || !duration || !language) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const languageInstructions = `Write the entire script in fluent, natural ${language}. Make sure all content, including instructions, narration, and call-to-actions are written naturally in ${language}. Use native expressions and cultural references appropriate for ${language}-speaking audiences.`;

    const prompt = `You are a professional YouTube content scriptwriter specializing in viral, engaging content.

Create a compelling video script based on the following information:

**Main Topic:** ${topic}
**Region Focus:** ${region}
**Video Duration:** ${duration} minute(s)
**Language:** ${language}
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
- Use localized labels in ${language}: Host and Guest lines must begin with these labels followed by a colon
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
        const loc = getInterviewLocalization(language);
        const alreadyQA = fullScript.split('\n').some(l => {
          const t = l.trim();
          return t.startsWith(`${loc.interviewerLabel}:`) || t.startsWith(`${loc.guestLabel}:`) || t.startsWith('Interviewer:') || t.startsWith('Guest:');
        });
        if (!alreadyQA) {
          fullScript = generateInterviewQAFromScript(fullScript, language);
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
        pacing: parsedData.pacing || 'Dynamic'
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

