import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing url query param' }, { status: 400 });
        }

        let parsed: URL;
        try {
            parsed = new URL(targetUrl);
        } catch {
            return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
        }

        const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        if (!isHttp) {
            return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
        }

        const upstream = await fetch(parsed.toString(), {
            cache: 'no-store',
            redirect: 'follow',
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Upstream fetch failed with ${upstream.status}` },
                { status: upstream.status }
            );
        }

        const buffer = await upstream.arrayBuffer();
        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch media' },
            { status: 500 }
        );
    }
}

