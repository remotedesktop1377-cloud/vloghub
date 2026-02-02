import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enhancedTitle } = body;

    if (!enhancedTitle || typeof enhancedTitle !== 'string' || enhancedTitle.trim().length === 0) {
      return NextResponse.json(
        { error: 'enhancedTitle parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const encodedPrompt = encodeURIComponent(enhancedTitle.trim());
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    const params = new URLSearchParams({
      model: 'flux',
      width: '1920',
      height: '1080',
      nologo: 'true',
    });

    const fullUrl = `${pollinationsUrl}?${params.toString()}`;

    // console.log('=== Thumbnail Generation API Call ===');
    // console.log('Enhanced Title:', enhancedTitle);
    // console.log('Pollinations URL:', fullUrl);
    console.log('====================================');

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error(`Pollinations API returned status ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${imageBase64}`;

    console.log('=== Thumbnail Generation Success ===');
    console.log('Image generated successfully');
    console.log('Image size:', imageBuffer.byteLength, 'bytes');
    console.log('====================================');

    return NextResponse.json({
      success: true,
      thumbnail: imageDataUrl,
      imageUrl: fullUrl,
    });

  } catch (error) {
    console.log('Error generating thumbnail:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate thumbnail',
        success: false
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with { enhancedTitle: string } in body.' },
    { status: 405 }
  );
}

