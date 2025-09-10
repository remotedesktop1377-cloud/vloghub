import { NextRequest } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

function getJWT() {
  const credentialsPath = path.join(process.cwd(), 'src', 'config', 'gen-lang-client-0211941879-57f306607431.json');
  const raw = fs.readFileSync(credentialsPath, 'utf8');
  const credentials = JSON.parse(raw);
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  try {
    const jwt = getJWT();
    const token = await jwt.getAccessToken();
    if (!token || !token.token) {
      return new Response(JSON.stringify({ error: 'Failed to obtain access token' }), { status: 500 });
    }

    // Stream media from Drive
    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`;
    const upstream = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token.token}` },
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'Upstream error', status: upstream.status, details: txt }), { status: 502 });
    }

    // Pass through key headers for media playback
    const headers = new Headers();
    const ct = upstream.headers.get('content-type');
    const cl = upstream.headers.get('content-length');
    const ar = upstream.headers.get('accept-ranges');
    if (ct) headers.set('content-type', ct);
    if (cl) headers.set('content-length', cl);
    if (ar) headers.set('accept-ranges', ar);
    headers.set('cache-control', 'private, max-age=60');

    return new Response(upstream.body as any, { status: 200, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Proxy failed' }), { status: 500 });
  }
}


