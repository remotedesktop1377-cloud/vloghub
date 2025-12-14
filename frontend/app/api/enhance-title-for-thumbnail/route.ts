import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

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

  } catch (error) {
    console.error('Error refining title:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to refine title',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with { title: string } in body.' },
    { status: 405 }
  );
}

