import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, page = 1 } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // Mirror envato images auth style: expect ENVATO_API_KEY in env
    const token = process.env.ENVATO_API_KEY;
    if (!token) {
      return NextResponse.json({ error: 'ENVATO_API_KEY missing' }, { status: 500 });
    }

    // Use Videohive marketplace for clips per Envato API requirements
    const url = `https://api.envato.com/v1/discovery/search/search/item?site=videohive.net&term=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store'
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'Envato clips search failed', details: text }, { status: 500 });
    }
    const data = await resp.json();
    // Normalize videohive result structure
    const matches = Array.isArray(data.matches) ? data.matches : [];
    const clips = matches.map((m: any) => {
      const previews = m.previews || {};
      const videoPreview = previews.landscape_preview_video?.url || previews.icon_with_audio_preview?.url;
      const thumb = previews.icon_with_audio_preview?.icon_url || m.thumbnail_url || m.url;
      return {
        id: m.id,
        url: videoPreview || m.url,
        thumbnail: thumb,
        title: m.description || m.title || 'Clip',
        context: m.author_username || '',
        width: 0,
        height: 0,
        size: '',
        mime: 'video/mp4'
      };
    });

    return NextResponse.json({ success: true, clips });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


