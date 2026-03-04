import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL_VERSION = 'arielreplicate/robust_video_matting:2d2de06a76a837a4ba92b6164bf8bfd3ddb524a1fb64b0d8ae055af17fa22503';

const extractExtension = (contentType: string, fallback = 'mp4') => {
    if (contentType.includes('webm')) return 'webm';
    if (contentType.includes('quicktime')) return 'mov';
    if (contentType.includes('mp4')) return 'mp4';
    return fallback;
};

const resolveOutputUrl = (output: any): string | null => {
    const candidate = Array.isArray(output) ? output[0] : output;
    if (!candidate) return null;
    if (typeof candidate === 'string') return candidate;
    if (typeof candidate?.url === 'function') {
        try {
            return candidate.url();
        } catch {
            return null;
        }
    }
    if (typeof candidate?.href === 'string') return candidate.href;
    return null;
};

export async function POST(request: NextRequest) {
    try {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'REPLICATE_API_TOKEN is not configured' }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'file is required' }, { status: 400 });
        }

        const outputType = String(formData.get('outputType') || 'green-screen').trim() || 'green-screen';
        const jobId = String(formData.get('jobId') || '').trim();

        const replicate = new Replicate({ auth: token });
        const output = await replicate.run(MODEL_VERSION, {
            input: {
                input_video: file,
                output_type: outputType,
            }
        });

        const outputUrl = resolveOutputUrl(output);
        if (!outputUrl) {
            return NextResponse.json({ error: 'Replicate did not return an output URL' }, { status: 502 });
        }

        const response = await fetch(outputUrl);
        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch processed video: HTTP ${response.status}` }, { status: 502 });
        }

        const contentType = response.headers.get('content-type') || 'video/mp4';
        const extension = extractExtension(contentType);
        const outputName = `bg_removed_${jobId || Date.now()}.${extension}`;
        const buffer = Buffer.from(await response.arrayBuffer());

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${outputName}"`,
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove video background';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
