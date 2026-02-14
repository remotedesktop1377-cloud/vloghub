import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serveUrl,
      compositionId,
      inputProps = {},
      codec = 'h264',
      imageFormat = 'jpeg',
      maxRetries = 1,
      framesPerLambda = 20,
      privacy = 'public',
      region = process.env.AWS_REGION,
      functionName,
    } = body;

    if (!serveUrl || !compositionId) {
      return NextResponse.json(
        { error: 'serveUrl and compositionId are required' },
        { status: 400 }
      );
    }

    if (!functionName) {
      return NextResponse.json(
        { error: 'functionName is required' },
        { status: 400 }
      );
    }

    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials not configured. Please set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY environment variables.' },
        { status: 400 }
      );
    }

    // @ts-ignore - @remotion/lambda is externalized, types not available at build time
    const { renderMediaOnLambda } = await import('@remotion/lambda/client');
    const result = await renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition: compositionId,
      inputProps,
      codec,
      imageFormat,
      maxRetries,
      framesPerLambda,
      privacy,
    });

    return NextResponse.json({
      renderId: result.renderId,
      bucketName: result.bucketName,
    });
  } catch (error: any) {
    console.error('Error rendering video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to render video' },
      { status: 500 }
    );
  }
}
