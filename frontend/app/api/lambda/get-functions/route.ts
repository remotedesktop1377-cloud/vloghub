import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      region = process.env.AWS_REGION,
      compatibleOnly = true,
    } = body;

    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials not configured. Please set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY environment variables.' },
        { status: 400 }
      );
    }

    // @ts-ignore - @remotion/lambda is externalized, types not available at build time
    const { getFunctions } = await import('@remotion/lambda/client');
    const functions = await getFunctions({
      region,
      compatibleOnly,
    });

    return NextResponse.json(functions.map(func => ({
      functionName: func.functionName,
      version: func.version,
      region: process.env.AWS_REGION || process.env.AWS_REGION,
    })));
  } catch (error: any) {
    console.error('Error getting functions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get functions' },
      { status: 500 }
    );
  }
}
