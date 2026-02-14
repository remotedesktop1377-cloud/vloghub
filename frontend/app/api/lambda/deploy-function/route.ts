import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      region = process.env.AWS_REGION || process.env.REMOTION_AWS_REGION || 'ap-southeast-1',
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

    if (!region) {
      return NextResponse.json(
        { error: 'Region is required. Please provide region in request body or set AWS_REGION environment variable.' },
        { status: 400 }
      );
    }

    let deployFunction;
    try {
      // @ts-ignore - @remotion/lambda is externalized, types not available at build time
      const remotionLambda = await import('@remotion/lambda');
      deployFunction = remotionLambda.deployFunction;
    } catch (importError: any) {
      console.error('Failed to import @remotion/lambda:', importError);
      return NextResponse.json(
        { 
          error: 'Failed to load Remotion Lambda module. This may be a build configuration issue.',
          details: importError.message,
          stack: process.env.NODE_ENV === 'development' ? importError.stack : undefined
        },
        { status: 500 }
      );
    }

    if (!deployFunction) {
      return NextResponse.json(
        { error: 'deployFunction is not exported from @remotion/lambda' },
        { status: 500 }
      );
    }

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
      { 
        error: error.message || 'Failed to deploy Lambda function',
        details: error.stack || error.toString(),
        type: error.constructor?.name
      },
      { status: 500 }
    );
  }
}
