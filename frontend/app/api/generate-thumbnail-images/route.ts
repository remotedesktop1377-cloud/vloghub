import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/utils/geminiService';
import { GoogleGenAI } from '@google/genai';

// Initialize Google GenAI client for Imagen API
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Scene data structure for thumbnail generation
 */
interface SceneData {
  id: string;
  narration?: string;
  title?: string;
}

/**
 * Configuration constants
 */
const IMAGE_GENERATION_CONFIG = {
  MODEL: 'imagen-4.0-generate-001',
  IMAGE_SIZE: '1K' as const,
  ASPECT_RATIO: '16:9' as const,
  NUMBER_OF_IMAGES: 1,
} as const;

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
  SCENE_DELAY_MS: 5000, // Delay between multiple scene generations
} as const;

/**
 * Enhances a text prompt using Gemini AI for better image generation results.
 * Adds cinematic details, lighting, composition, and visual storytelling elements.
 * 
 * @param input - Original scene narration or title
 * @returns Enhanced prompt optimized for image generation
 * @throws Error if Gemini returns empty response
 */
async function enhancePrompt(input: string): Promise<string> {
  const model = getGeminiModel();

  const prompt = `
You are a professional prompt engineer for generative AI images.
Enhance the prompt for image generation.

Rules:
- Do NOT include names of real people, politicians, or celebrities
- Use generic physical and role-based descriptions instead
- Avoid sexual, violent, or controversial language
- Prefer illustration or cinematic style over photorealism

Enhance the user's idea with vivid artistic details, cinematic lighting,
composition, realism, textures, atmosphere, and visual storytelling.
Output ONLY the enhanced prompt.

Idea:
${input}
  `.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text()?.trim();

  if (!text) {
    throw new Error('Gemini returned empty enhanced prompt');
  }

  return text;
}

/**
 * Utility function to add delays for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if an error message indicates a retryable condition
 */
function isRetryableError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('quota') ||
    lowerMessage.includes('429') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('no generated images')
  );
}

/**
 * Checks if response indicates rate limiting
 */
function isRateLimitResponse(responseStr: string): boolean {
  const lowerStr = responseStr.toLowerCase();
  return (
    lowerStr.includes('rate limit') ||
    lowerStr.includes('quota') ||
    lowerStr.includes('429') ||
    lowerStr.includes('too many requests')
  );
}

/**
 * Checks if response indicates content moderation blocking
 */
function isContentModerationResponse(responseStr: string): boolean {
  const lowerStr = responseStr.toLowerCase();
  return (
    lowerStr.includes('safety') ||
    lowerStr.includes('moderation') ||
    lowerStr.includes('blocked') ||
    lowerStr.includes('violates') ||
    lowerStr.includes('policy') ||
    lowerStr.includes('content policy') ||
    lowerStr.includes('inappropriate') ||
    lowerStr.includes('prohibited') ||
    lowerStr.includes('restricted')
  );
}

/**
 * Generates an image using Google Imagen API with automatic retry logic.
 * Handles rate limiting, empty responses, and content moderation errors.
 * 
 * @param prompt - Enhanced prompt for image generation
 * @param retryCount - Current retry attempt (internal use)
 * @param maxRetries - Maximum number of retry attempts
 * @returns Object containing base64-encoded image as data URL
 * @throws Error if generation fails after all retries
 */
async function generateImage(
  prompt: string,
  retryCount: number = 0,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<{ dataUrl: string }> {
  const retryDelay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, retryCount);

  try {
    const response = await genAI.models.generateImages({
      model: IMAGE_GENERATION_CONFIG.MODEL,
      prompt,
      config: {
        numberOfImages: IMAGE_GENERATION_CONFIG.NUMBER_OF_IMAGES,
        imageSize: IMAGE_GENERATION_CONFIG.IMAGE_SIZE,
        aspectRatio: IMAGE_GENERATION_CONFIG.ASPECT_RATIO,
      },
    });

    // Check HTTP status for errors
    const sdkResponse = (response as any)?.sdkHttpResponse;
    const httpStatus = sdkResponse?.statusCode;

    if (httpStatus && httpStatus >= 400) {
      // Check for content moderation (400 Bad Request often indicates policy violation)
      if (httpStatus === 400) {
        const responseStr = JSON.stringify(response).toLowerCase();
        if (isContentModerationResponse(responseStr)) {
          console.log('[Image Generation] Content moderation detected in HTTP 400 response');
          throw new Error('Imagen API blocked the image generation due to content moderation. Please try a different prompt.');
        }
      }
      
      // Retry on rate limit (429) or server errors (5xx)
      if ((httpStatus === 429 || httpStatus >= 500) && retryCount < maxRetries) {
        console.log(`[Image Generation] Retrying due to HTTP ${httpStatus} (attempt ${retryCount + 1}/${maxRetries})`);
        await delay(retryDelay);
        return generateImage(prompt, retryCount + 1, maxRetries);
      }
      throw new Error(`Imagen API returned HTTP ${httpStatus}`);
    }

    // Validate response structure
    if (!response?.generatedImages || !Array.isArray(response.generatedImages)) {
      throw new Error('Imagen API returned invalid response structure');
    }

    // Handle empty response array
    if (response.generatedImages.length === 0) {
      // Log full response for debugging
      console.log('[Image Generation] Empty response received, full response:', JSON.stringify(response, null, 2));
      
      // Check for specific error types in response FIRST (don't retry these)
      const responseStr = JSON.stringify(response).toLowerCase();
      
      if (isContentModerationResponse(responseStr)) {
        console.log('[Image Generation] Content moderation detected in empty response');
        throw new Error('Imagen API blocked the image generation due to content moderation. Please try a different prompt.');
      }
      
      if (isRateLimitResponse(responseStr)) {
        console.log('[Image Generation] Rate limit detected in empty response');
        throw new Error('Imagen API rate limit exceeded. Please wait a moment and try again.');
      }
      
      // Only retry if it's not a content moderation or rate limit issue
      if (retryCount < maxRetries) {
        const delayForEmpty = retryDelay * 2; // Longer delay for empty responses
        console.log(`[Image Generation] Empty response, retrying (attempt ${retryCount + 1}/${maxRetries})`);
        await delay(delayForEmpty);
        return generateImage(prompt, retryCount + 1, maxRetries);
      }

      throw new Error('Imagen API returned no generated images. This may be due to rate limiting, content moderation, or API quota limits.');
    }

    // Extract image data
    const generatedImage = response.generatedImages[0];
    if (!generatedImage?.image?.imageBytes) {
      throw new Error('Imagen API returned image without imageBytes');
    }

    const imageBytes = generatedImage.image.imageBytes;
    const mimeType = generatedImage.image.mimeType || 'image/png';

    return {
      dataUrl: `data:${mimeType};base64,${imageBytes}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    const errorStr = JSON.stringify(error).toLowerCase();
    
    // Check for content moderation FIRST (don't retry these)
    if (isContentModerationResponse(errorMessage) || isContentModerationResponse(errorStr)) {
      console.log('[Image Generation] Content moderation detected in error:', errorMessage);
      throw new Error('Imagen API blocked the image generation due to content moderation. Please try a different prompt.');
    }
    
    // Retry on retryable errors
    if (isRetryableError(errorMessage) && retryCount < maxRetries) {
      console.log(`[Image Generation] Retrying due to retryable error (attempt ${retryCount + 1}/${maxRetries}):`, errorMessage);
      await delay(retryDelay);
      return generateImage(prompt, retryCount + 1, maxRetries);
    }

    // Re-throw custom errors as-is
    if (error instanceof Error && error.message.includes('Imagen')) {
      throw error;
    }

    // Wrap unexpected errors
    console.error('[Image Generation] Unexpected error:', error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes a single scene: enhances the prompt and generates an image
 */
async function processSingleScene(scene: SceneData) {
  const sceneText = (scene.narration || scene.title || '').trim();
  
  if (!sceneText) {
    throw new Error('Scene narration or title is required');
  }

  // Step 1: Enhance prompt using Gemini
  const enhancedPrompt = await enhancePrompt(sceneText);
  console.log(`[Scene ${scene.id}] Enhanced prompt:`, enhancedPrompt);

  // Step 2: Generate image using Imagen
  const imageResult = await generateImage(enhancedPrompt);

  return {
    sceneId: scene.id,
    success: true,
    originalText: sceneText,
    enhancedPrompt,
    image: imageResult.dataUrl,
  };
}

/**
 * Processes multiple scenes sequentially with delays to avoid rate limiting
 */
async function processMultipleScenes(scenes: SceneData[]) {
  const results = [];

  for (let i = 0; i < scenes.length; i++) {
    const sceneItem = scenes[i];
    
    try {
      // Add delay between requests (except for the first one)
      if (i > 0) {
        await delay(RETRY_CONFIG.SCENE_DELAY_MS);
      }

      const result = await processSingleScene(sceneItem);
      results.push(result);
    } catch (err) {
      results.push({
        sceneId: sceneItem.id,
        success: false,
        error: err instanceof Error ? err.message : 'Scene processing failed',
      });
    }
  }

  return results;
}

/**
 * POST handler for thumbnail generation API
 * 
 * Supports two request formats:
 * 1. Single scene: { scene: { id, narration?, title? } }
 * 2. Multiple scenes: { scenes: [{ id, narration?, title? }, ...] }
 * 
 * @returns JSON response with generated image(s) and enhanced prompt(s)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scene, scenes } = body;

    // Case 1: Single scene processing
    if (scene && typeof scene === 'object' && scene.id) {
      try {
        const result = await processSingleScene(scene as SceneData);
        return NextResponse.json(result);
      } catch (err) {
        console.error('[API] Error processing single scene:', err);
        return NextResponse.json(
          {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to process scene',
          },
          { status: 500 }
        );
      }
    }

    // Case 2: Multiple scenes processing
    if (Array.isArray(scenes) && scenes.length > 0) {
      const results = await processMultipleScenes(scenes);
      return NextResponse.json({
        success: true,
        scenes: results,
      });
    }

    // Invalid input
    return NextResponse.json(
      { error: 'Provide either { scene: SceneData } or { scenes: SceneData[] }' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Request processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns method not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST request' },
    { status: 405 }
  );
}
