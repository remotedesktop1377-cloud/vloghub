import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entryPoint,
      siteName,
      region = process.env.AWS_REGION || process.env.REMOTION_AWS_REGION || 'ap-southeast-1',
    } = body;

    if (!entryPoint) {
      return NextResponse.json(
        { error: 'entryPoint is required' },
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
    const { deploySite, getOrCreateBucket } = await import('@remotion/lambda');
    const { bucketName } = await getOrCreateBucket({
      region,
    });

    const resolvedEntryPoint = path.resolve(process.cwd(), entryPoint);
    
    console.log('Deploying site with entry point:', resolvedEntryPoint);
    console.log('Current working directory:', process.cwd());

    const result = await deploySite({
      bucketName,
      entryPoint: resolvedEntryPoint,
      region,
      siteName,
    });

    return NextResponse.json({
      serveUrl: result.serveUrl,
      bucketName: bucketName,
    });
  } catch (error: any) {
    console.error('Error deploying site:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deploy site' },
      { status: 500 }
    );
  }
}
