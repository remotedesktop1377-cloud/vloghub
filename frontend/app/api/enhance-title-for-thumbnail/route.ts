import { NextRequest, NextResponse } from 'next/server';

interface SceneInput {
  id: string;
  narration?: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, scenes } = body;

    // Handle single title (existing behavior)
    if (title && typeof title === 'string' && title.trim().length > 0) {
      const promptInstruction = `You are a professional prompt engineer for generative AI images. Given a user's base idea, elaborate and enhance the prompt by preserving the original subject and context, adding vivid artistic details, improving clarity, storytelling, and immersion, including realistic textures, dynamic lighting, depth, and color harmony, specifying atmosphere and composition style, and ensuring final output is suitable for 8K ultra-high-resolution rendering. Output only the enhanced prompt as plain text.\n\nIdea:\n${title.trim()}`;

      const encodedPrompt = encodeURIComponent(promptInstruction);
      const pollinationsUrl = `https://text.pollinations.ai/${encodedPrompt}`;

      const response = await fetch(pollinationsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error(`Pollinations API returned status ${response.status}`);
      }

      const enhancedText = await response.text();

      if (!enhancedText || enhancedText.trim().length === 0) {
        throw new Error('Empty response from Pollinations API');
      }

      return NextResponse.json({
        success: true,
        originalTitle: title.trim(),
        enhancedText: enhancedText.trim(),
      });
    }

    // Handle scenes array (new behavior)
    if (scenes && Array.isArray(scenes) && scenes.length > 0) {
      const sceneResults = await Promise.all(
        scenes.map(async (scene: SceneInput) => {
          try {
            // Use narration or title, fallback to empty string
            const sceneText = (scene.narration || scene.title || '').trim();
            
            if (!sceneText || sceneText.length === 0) {
              return {
                sceneId: scene.id,
                success: false,
                error: 'Scene narration or title is required',
              };
            }

            // Step 1: Enhance the prompt
            const promptInstruction = `You are a professional prompt engineer for generative AI images. Given a user's base idea, elaborate and enhance the prompt by preserving the original subject and context, adding vivid artistic details, improving clarity, storytelling, and immersion, including realistic textures, dynamic lighting, depth, and color harmony, specifying atmosphere and composition style, and ensuring final output is suitable for 8K ultra-high-resolution rendering. Output only the enhanced prompt as plain text.\n\nIdea:\n${sceneText}`;

            const encodedPrompt = encodeURIComponent(promptInstruction);
            const textUrl = `https://text.pollinations.ai/${encodedPrompt}`;

            const textResponse = await fetch(textUrl, {
              method: 'GET',
              headers: {
                'Accept': 'text/plain',
              },
            });

            if (!textResponse.ok) {
              throw new Error(`Pollinations text API returned status ${textResponse.status}`);
            }

            const enhancedText = await textResponse.text();

            if (!enhancedText || enhancedText.trim().length === 0) {
              throw new Error('Empty response from Pollinations text API');
            }

            // Step 2: Generate image from enhanced prompt
            const imageEncodedPrompt = encodeURIComponent(enhancedText.trim());
            const imageUrl = `https://image.pollinations.ai/prompt/${imageEncodedPrompt}`;

            const params = new URLSearchParams({
              model: 'flux',
              width: '1920',
              height: '1080',
              nologo: 'true',
            });

            const fullImageUrl = `${imageUrl}?${params.toString()}`;

            const imageResponse = await fetch(fullImageUrl, {
              method: 'GET',
              headers: {
                'Accept': 'image/*',
              },
            });

            if (!imageResponse.ok) {
              throw new Error(`Pollinations image API returned status ${imageResponse.status}`);
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const imageDataUrl = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${imageBase64}`;

            return {
              sceneId: scene.id,
              success: true,
              originalText: sceneText,
              enhancedText: enhancedText.trim(),
              imageUrl: fullImageUrl,
              thumbnail: imageDataUrl,
            };
          } catch (error) {
            return {
              sceneId: scene.id,
              success: false,
              error: error instanceof Error ? error.message : 'Failed to process scene',
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        scenes: sceneResults,
      });
    }

    // No valid input
    return NextResponse.json(
      { error: 'Either title (string) or scenes (array) parameter is required' },
      { status: 400 }
    );

  } catch (error) {
    console.log('Error processing request:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with { title: string } or { scenes: SceneInput[] } in body.' },
    { status: 405 }
  );
}

