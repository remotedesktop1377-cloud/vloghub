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
    const { topic, hypothesis, details, region, duration, language } = body;

    // Validate required fields
    if (!topic || !hypothesis || !region || !duration || !language) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const languageInstructions = `Write the entire script in in fluent, natural ${language}. Make sure all content, including instructions, narration, and call-to-actions are written naturally in ${language}. Use native expressions and cultural references appropriate for ${language}-speaking audiences.`;

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

**OUTPUT FORMAT:**
Return ONLY valid JSON in this exact structure (no markdown, no commentary):

{
  "title": "Compelling video title",
  "hook": "First 15 seconds hook text",
  "mainContent": "Main script content with clear paragraph breaks",
  "conclusion": "Strong conclusion text",
  "callToAction": "Call to action for likes, comments, subscribe",
  "estimatedWords": 155,
  "emotionalTone": "Enthusiastic, engaging, conversational",
  "pacing": "Dynamic, varied, maintains interest"
}

**IMPORTANT:** 
- Return ONLY the JSON object, no additional text
- Ensure the JSON is valid and complete
- The mainContent should be the full script text
- estimatedWords should be the actual word count of the script
- emotionalTone and pacing should describe the overall style`;


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
      if (!parsedData.mainContent || !parsedData.title) {
        throw new Error('Generated script missing required fields');
      }

      // Combine all content into the main script
      const fullScript = `${parsedData.hook || ''}\n\n${parsedData.mainContent || ''}\n\n${parsedData.conclusion || ''}\n\n${parsedData.callToAction || ''}`.trim();

      return NextResponse.json({
        script: fullScript,
        title: parsedData.title || 'Untitled Script',
        hook: parsedData.hook || '',
        mainContent: parsedData.mainContent || '',
        conclusion: parsedData.conclusion || '',
        callToAction: parsedData.callToAction || '',
        estimatedWords: parsedData.estimatedWords || 0,
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

