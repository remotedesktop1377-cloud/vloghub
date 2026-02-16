import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { region = process.env.AWS_REGION || 'us-east-1' } = body;

        if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
            return NextResponse.json(
                { error: 'AWS credentials not configured. Please set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY environment variables.' },
                { status: 400 }
            );
        }

        // @ts-ignore - @remotion/lambda is externalized, types not available at build time
        const { getQuotas } = await import('@remotion/lambda');
        const quotas = await getQuotas({
            region,
        });

        return NextResponse.json({
            concurrencyLimit: quotas.concurrencyLimit,
            region: quotas.region,
        });
    } catch (error: any) {
        console.error('Error getting quotas:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get quotas' },
            { status: 500 }
        );
    }
}
