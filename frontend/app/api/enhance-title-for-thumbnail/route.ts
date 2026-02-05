import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/utils/geminiService';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

interface SceneData {
  id: string;
  narration?: string;
  title?: string;
}

/* =========================================================
   HELPER: TEXT ENHANCEMENT (GEMINI)
========================================================= */
async function enhancePrompt(input: string): Promise<string> {
  const model = getGeminiModel();

  const prompt = `
You are a professional prompt engineer for generative AI images.
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

/* =========================================================
   HELPER: DELAY UTILITY
========================================================= */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* =========================================================
   HELPER: IMAGE GENERATION (IMAGEN) WITH RETRY LOGIC
========================================================= */
async function generateImage(prompt: string, retryCount: number = 0, maxRetries: number = 3): Promise<{ dataUrl: string }> {
  const baseDelayMs = 2000; // Start with 2 second delay (increased for rate limiting)
  const retryDelay = baseDelayMs * Math.pow(2, retryCount); // Exponential backoff

  // Log the prompt being used (truncated for privacy)
  console.log(`Generating image with prompt (attempt ${retryCount + 1}):`, {
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
  });

  try {
    const response = await genAI.models.generateImages({
      model: 'imagen-4.0-generate-001', // Using Imagen 4
      prompt,
      config: {
        numberOfImages: 1,
        imageSize: '1K',        // Supported for Imagen 4
        aspectRatio: '16:9',
      },
    });

    // Check for SDK response errors or warnings
    const sdkResponse = (response as any)?.sdkHttpResponse;
    const httpStatus = sdkResponse?.statusCode;
    const responseHeaders = sdkResponse?.headers || {};
    
    // Log full response structure for debugging (especially when empty)
    const responseLog = {
      hasResponse: !!response,
      hasGeneratedImages: !!response?.generatedImages,
      generatedImagesLength: response?.generatedImages?.length ?? 0,
      generatedImagesType: typeof response?.generatedImages,
      firstImageExists: !!response?.generatedImages?.[0],
      firstImageHasImage: !!response?.generatedImages?.[0]?.image,
      responseKeys: response ? Object.keys(response) : [],
      httpStatus: httpStatus,
      // Check for any error-related headers
      contentType: responseHeaders['content-type'],
      // Log full response structure when empty (for debugging)
      fullResponse: response?.generatedImages?.length === 0 
        ? JSON.stringify(response, null, 2).substring(0, 2000) 
        : undefined,
    };
    console.log('Imagen API Response:', responseLog);

    // Check HTTP status code for errors
    if (httpStatus && httpStatus >= 400) {
      const errorMsg = `Imagen API returned HTTP ${httpStatus}`;
      console.error(errorMsg, { responseHeaders, fullResponse: JSON.stringify(response, null, 2).substring(0, 2000) });
      
      // Retry on 429 (rate limit) or 5xx (server errors)
      if ((httpStatus === 429 || httpStatus >= 500) && retryCount < maxRetries) {
        console.log(`Retrying due to HTTP ${httpStatus} (attempt ${retryCount + 1}/${maxRetries}) after ${retryDelay}ms delay...`);
        await delay(retryDelay);
        return generateImage(prompt, retryCount + 1, maxRetries);
      }
      
      throw new Error(errorMsg);
    }

    // Validate response structure
    if (!response) {
      console.error('Imagen API returned null/undefined response');
      throw new Error('Imagen API returned no response');
    }

    if (!response.generatedImages) {
      console.error('Imagen API response missing generatedImages property', {
        responseStructure: JSON.stringify(response, null, 2).substring(0, 1000),
      });
      throw new Error('Imagen API response missing generatedImages array');
    }

    if (!Array.isArray(response.generatedImages)) {
      console.error('Imagen API generatedImages is not an array', {
        type: typeof response.generatedImages,
        value: response.generatedImages,
      });
      throw new Error('Imagen API generatedImages is not an array');
    }

    // Handle empty generatedImages array with retry logic
    if (response.generatedImages.length === 0) {
      console.error('Imagen API returned empty generatedImages array', {
        retryCount,
        maxRetries,
        httpStatus,
        promptPreview: prompt.substring(0, 200),
        fullResponse: JSON.stringify(response, null, 2).substring(0, 2000),
      });

      // Check if we should retry (with longer delays for empty responses)
      if (retryCount < maxRetries) {
        const delayForEmpty = retryDelay * 2; // Double the delay for empty responses
        console.log(`Retrying image generation (attempt ${retryCount + 1}/${maxRetries}) after ${delayForEmpty}ms delay...`);
        await delay(delayForEmpty);
        return generateImage(prompt, retryCount + 1, maxRetries);
      }

      // Check for rate limiting indicators in response
      const responseStr = JSON.stringify(response).toLowerCase();
      const isRateLimit = responseStr.includes('rate limit') || 
                         responseStr.includes('quota') || 
                         responseStr.includes('429') ||
                         responseStr.includes('too many requests');
      
      if (isRateLimit) {
        throw new Error('Imagen API rate limit exceeded. Please wait a moment and try again.');
      }

      // Check for content moderation indicators
      const isContentModeration = responseStr.includes('safety') || 
                                  responseStr.includes('moderation') ||
                                  responseStr.includes('blocked') ||
                                  responseStr.includes('violates');
      
      if (isContentModeration) {
        throw new Error('Imagen API blocked the image generation due to content moderation. Please try a different prompt.');
      }

      throw new Error('Imagen API returned no generated images. This may be due to rate limiting, content moderation, or API quota limits. Please try again in a few moments.');
    }

    const generatedImage = response.generatedImages[0];
    if (!generatedImage) {
      console.error('Imagen API first generated image is null/undefined');
      throw new Error('Imagen API first generated image is missing');
    }

    if (!generatedImage.image) {
      console.error('Imagen API generated image missing image property', {
        generatedImageKeys: Object.keys(generatedImage),
        generatedImageStructure: JSON.stringify(generatedImage, null, 2).substring(0, 500),
      });
      throw new Error('Imagen returned no image data');
    }

    // imageBytes is already a base64 string according to the API
    const imageBytes = generatedImage.image.imageBytes;
    if (!imageBytes) {
      console.error('Imagen API image missing imageBytes', {
        imageKeys: Object.keys(generatedImage.image),
        imageStructure: JSON.stringify(generatedImage.image, null, 2).substring(0, 500),
      });
      throw new Error('Imagen returned image without imageBytes');
    }

    // The imageBytes is already base64 encoded, so we can use it directly
    const mimeType = generatedImage.image.mimeType || 'image/png';

    return {
      dataUrl: `data:${mimeType};base64,${imageBytes}`,
    };
  } catch (error) {
    // Check if it's a retryable error (rate limit, network issues, etc.)
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const isRetryable = errorMessage.includes('rate limit') || 
                       errorMessage.includes('quota') || 
                       errorMessage.includes('429') ||
                       errorMessage.includes('network') ||
                       errorMessage.includes('timeout') ||
                       errorMessage.includes('no generated images');

    // Retry if it's a retryable error and we haven't exceeded max retries
    if (isRetryable && retryCount < maxRetries) {
      console.log(`Retrying image generation due to retryable error (attempt ${retryCount + 1}/${maxRetries}) after ${retryDelay}ms delay...`, error);
      await delay(retryDelay);
      return generateImage(prompt, retryCount + 1, maxRetries);
    }

    // Re-throw if it's already our custom error
    if (error instanceof Error && error.message.includes('Imagen')) {
      throw error;
    }
    // Wrap unexpected errors with context
    console.error('Unexpected error in generateImage:', error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/* =========================================================
   POST HANDLER
========================================================= */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scene, scenes } = body;

    /* =====================================================
       CASE 1: SINGLE SCENE → PROMPT + IMAGE
    ===================================================== */
    if (scene && typeof scene === 'object' && scene.id) {
      try {
        const sceneData = scene as SceneData;
        const sceneText = (sceneData.narration || sceneData.title || '').trim();
        
        if (!sceneText) {
          return NextResponse.json(
            { error: 'Scene narration or title is required' },
            { status: 400 }
          );
        }

        // Step 1: Enhance prompt
        const enhancedPrompt = await enhancePrompt(sceneText);
        console.log('Enhanced prompt for scene:', {
          sceneId: sceneData.id,
          originalTextLength: sceneText.length,
          enhancedPromptLength: enhancedPrompt.length,
          enhancedPromptPreview: enhancedPrompt.substring(0, 300),
        });

        // Step 2: Generate image
        const imageResult = await generateImage(enhancedPrompt);

        return NextResponse.json({
          success: true,
          sceneId: sceneData.id,
          originalText: sceneText,
          enhancedPrompt,
          image: imageResult.dataUrl,
        });
      } catch (err) {
        console.error('Error processing single scene:', err);
        return NextResponse.json(
          {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to process scene',
          },
          { status: 500 }
        );
      }
    }

    /* =====================================================
       CASE 2: SCENES ARRAY → PROMPT + IMAGE FOR EACH
    ===================================================== */
    if (Array.isArray(scenes) && scenes.length > 0) {
      // Process scenes sequentially with delays to avoid rate limiting
      const results = [];
      for (let i = 0; i < scenes.length; i++) {
        const sceneItem = scenes[i];
        try {
          // Add delay between requests (except for the first one)
          // Increased delay to avoid rate limiting - API might have per-minute limits
          if (i > 0) {
            const delayMs = 5000; // 5 second delay between scene image generations (increased from 2s)
            console.log(`Adding ${delayMs}ms delay before generating image for scene ${i + 1}...`);
            await delay(delayMs);
          }

          const sceneText = (sceneItem.narration || sceneItem.title || '').trim();
          if (!sceneText) {
            throw new Error('Scene narration or title is required');
          }

          // Step 1: Enhance prompt
          const enhancedPrompt = await enhancePrompt(sceneText);
          console.log(`Enhanced prompt for scene ${i + 1}:`, {
            sceneId: sceneItem.id,
            originalTextLength: sceneText.length,
            enhancedPromptLength: enhancedPrompt.length,
            enhancedPromptPreview: enhancedPrompt.substring(0, 300),
          });

          // Step 2: Generate image
          const imageResult = await generateImage(enhancedPrompt);

          results.push({
            sceneId: sceneItem.id,
            success: true,
            originalText: sceneText,
            enhancedPrompt,
            image: imageResult.dataUrl,
          });
        } catch (err) {
          results.push({
            sceneId: sceneItem.id,
            success: false,
            error: err instanceof Error ? err.message : 'Scene failed',
          });
        }
      }

      return NextResponse.json({
        success: true,
        scenes: results,
      });
    }

    /* =====================================================
       INVALID INPUT
    ===================================================== */
    return NextResponse.json(
      { error: 'Provide either { scene: SceneData } or { scenes: SceneData[] }' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET HANDLER
========================================================= */
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST request' },
    { status: 405 }
  );
}
