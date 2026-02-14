import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      renderId,
      bucketName,
      functionName,
      region = process.env.AWS_REGION,
    } = body;

    if (!renderId || !bucketName || !functionName) {
      return NextResponse.json(
        { error: 'renderId, bucketName, and functionName are required' },
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
    const { getRenderProgress } = await import('@remotion/lambda/client');
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region,
    });

    return NextResponse.json({
      done: progress.done,
      outputFile: progress.outputFile,
      fatalErrorEncountered: progress.fatalErrorEncountered,
      errors: progress.errors,
      timeToFinish: progress.timeToFinish,
      overallProgress: progress.overallProgress,
    });
  } catch (error: any) {
    console.error('Error getting render progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get render progress' },
      { status: 500 }
    );
  }
}
