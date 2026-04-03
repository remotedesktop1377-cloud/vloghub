import { NextRequest } from 'next/server';
import { getJWTClient } from '@/services/googleDriveServer';

export const runtime = 'nodejs';

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = corsHeaders(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: cors });
  }

  try {
    const jwt = getJWTClient('https://www.googleapis.com/auth/drive');
    const token = await jwt.getAccessToken();
    if (!token || !token.token) {
      return new Response(JSON.stringify({ error: 'Failed to obtain access token' }), { status: 500, headers: cors });
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
      return new Response(JSON.stringify({ error: 'Upstream error', status: upstream.status, details: txt }), { status: 502, headers: cors });
    }

    const headers = new Headers(cors);
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
    return new Response(JSON.stringify({ error: e?.message || 'Proxy failed' }), { status: 500, headers: cors });
  }
}


