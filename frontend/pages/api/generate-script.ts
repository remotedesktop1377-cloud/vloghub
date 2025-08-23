import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '../../src/config/aiConfig';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: AI_CONFIG.GEMINI.MODEL,
  generationConfig: { temperature: AI_CONFIG.GEMINI.TEMPERATURE }
});

interface GenerateScriptRequest {
  topic: string;
  hypothesis: string;
  details: string;
  region?: string;
  duration?: string;
  language?: string;
  selectedTopicSuggestions?: string[];
  selectedHypothesisSuggestions?: string[];
}

interface GenerateScriptResponse {
  script: string;
  title: string;
  hook: string;
  mainContent: string;
  conclusion: string;
  callToAction: string;
  estimatedWords: number;
  emotionalTone: string;
  pacing: string;
}

async function generateScriptWithGemini({
  topic,
  hypothesis,
  details,
  region = AI_CONFIG.CONTENT.DEFAULT_REGION,
  duration = '1',
  language = 'english',
  selectedTopicSuggestions = [],
  selectedHypothesisSuggestions = []
}: GenerateScriptRequest) {

  const selectedTopicsText = selectedTopicSuggestions.length > 0
    ? `\n\nSelected Topic Suggestions:\n${selectedTopicSuggestions.map(s => `- ${s}`).join('\n')}`
    : '';

  const selectedHypothesesText = selectedHypothesisSuggestions.length > 0
    ? `\n\nSelected Hypothesis Suggestions:\n${selectedHypothesisSuggestions.map(h => `- ${h}`).join('\n')}`
    : '';

  const languageInstructions = language === 'english'
    ? 'Write the script in fluent, natural English.'
    : `Write the entire script in ${language.charAt(0).toUpperCase() + language.slice(1)}. Make sure all content, including instructions, narration, and call-to-actions are written naturally in ${language}. Use native expressions and cultural references appropriate for ${language}-speaking audiences.`;

  const prompt = `You are a professional YouTube content scriptwriter specializing in viral, engaging content.

Create a compelling video script based on the following information:

**Main Topic:** ${topic}
**Region Focus:** ${region}
**Video Duration:** ${duration} minute(s)
**Language:** ${language.charAt(0).toUpperCase() + language.slice(1)}
**Topic Details:** ${details}
**Hypothesis/Angle:** ${hypothesis}${selectedTopicsText}${selectedHypothesesText}

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

    return {
      script: fullScript,
      title: parsedData.title || 'Untitled Script',
      hook: parsedData.hook || '',
      mainContent: parsedData.mainContent || '',
      conclusion: parsedData.conclusion || '',
      callToAction: parsedData.callToAction || '',
      estimatedWords: parsedData.estimatedWords || 0,
      emotionalTone: parsedData.emotionalTone || 'Engaging',
      pacing: parsedData.pacing || 'Dynamic'
    };

  } catch (error) {
    console.error('Error generating script:', error);
    throw new Error('Failed to generate script');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateScriptResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      topic,
      hypothesis,
      details,
      region,
      duration,
      language,
      selectedTopicSuggestions,
      selectedHypothesisSuggestions
    } = req.body as GenerateScriptRequest;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (selectedTopicSuggestions?.length === 0) {
      return res.status(400).json({ error: 'Topic selection is required' });
    }

    if (selectedHypothesisSuggestions?.length === 0) {
      return res.status(400).json({ error: 'Hypothesis selection is required' });
    }

    // console.log('🎬 Generating script for:', { topic, hypothesis, region, duration, language });

    const result = await generateScriptWithGemini({
      topic,
      hypothesis,
      details,
      region,
      duration,
      language,
      selectedTopicSuggestions,
      selectedHypothesisSuggestions
    });

    console.log('✅ Script generated successfully, length:', result);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in generate-script API:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate script'
    });
  }
}
