import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, Content-Type',
};

const ALLOWED_HOSTS = [
  '.amazonaws.com',
  '.s3.',
  'drive.google.com',
  'drive.usercontent.google.com',
  'lh3.googleusercontent.com',
  'googleapis.com',
  'docs.google.com',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.some(host => parsed.hostname.endsWith(host) || parsed.hostname.includes(host));
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || '';
  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), { status: 400, headers: corsHeaders });
  }

  if (!isAllowedUrl(url)) {
    return new Response(JSON.stringify({ error: 'URL not allowed' }), { status: 403, headers: corsHeaders });
  }

  try {
    const upstreamHeaders: Record<string, string> = {};
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    const upstream = await fetch(url, { headers: upstreamHeaders, redirect: 'follow' });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(JSON.stringify({ error: 'Upstream error', status: upstream.status }), { status: 502, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    const ct = upstream.headers.get('content-type');
    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    if (ct) headers.set('content-type', ct);
    if (cl) headers.set('content-length', cl);
    headers.set('accept-ranges', 'bytes');
    if (cr) headers.set('content-range', cr);
    headers.set('cache-control', 'public, max-age=3600');

    return new Response(upstream.body as any, { status: upstream.status, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Proxy failed' }), { status: 500, headers: corsHeaders });
  }
}
