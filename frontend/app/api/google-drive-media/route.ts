import { NextRequest } from 'next/server';
import { getJWTClient } from '@/services/googleDriveServer';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders });
  }

  try {
    const jwt = getJWTClient('https://www.googleapis.com/auth/drive');
    const token = await jwt.getAccessToken();
    if (!token || !token.token) {
      return new Response(JSON.stringify({ error: 'Failed to obtain access token' }), { status: 500, headers: corsHeaders });
    }

    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`;

    const upstreamHeaders: Record<string, string> = {
      Authorization: `Bearer ${token.token}`,
    };

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    const upstream = await fetch(mediaUrl, { headers: upstreamHeaders });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'Upstream error', status: upstream.status, details: txt }), { status: 502, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    const ct = upstream.headers.get('content-type');
    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    if (ct) headers.set('content-type', ct);
    if (cl) headers.set('content-length', cl);
    headers.set('accept-ranges', 'bytes');
    if (cr) headers.set('content-range', cr);
    headers.set('cache-control', 'private, max-age=60');

    return new Response(upstream.body as any, { status: upstream.status, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Proxy failed' }), { status: 500, headers: corsHeaders });
  }
}


