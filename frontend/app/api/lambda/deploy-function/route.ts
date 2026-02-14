import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      region = process.env.AWS_REGION,
      timeoutInSeconds = 120,
      memorySizeInMb = 2048,
      createCloudWatchLogGroup = true,
    } = body;

    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials not configured. Please set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY environment variables.' },
        { status: 400 }
      );
    }

    // @ts-ignore - @remotion/lambda is externalized, types not available at build time
    const { deployFunction } = await import('@remotion/lambda');
    const result = await deployFunction({
      region,
      timeoutInSeconds,
      memorySizeInMb,
      createCloudWatchLogGroup,
    });

    return NextResponse.json({ functionName: result.functionName });
  } catch (error: any) {
    console.error('Error deploying Lambda function:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deploy Lambda function' },
      { status: 500 }
    );
  }
}
