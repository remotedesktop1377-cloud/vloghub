import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, page = 1 } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const token = process.env.ENVATO_API_KEY;
    if (!token) {
      return NextResponse.json({ error: 'ENVATO_API_KEY missing' }, { status: 500 });
    }

    const url = `https://api.envato.com/v1/discovery/search/search/item?site=videohive.net&term=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'Envato clips search failed', details: text }, { status: 500 });
    }

    const data = await resp.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];
    let clips = matches.map((m: any) => {
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

    const hasPlayable = clips.some((c: { url?: string }) => typeof c.url === 'string' && (c.url as string).includes('watermarked_preview'));
    if ((!clips.length || !hasPlayable)) {
      try {
        const elementsUrl = `https://elements.envato.com/data-api/page/items-neue-page?path=%2Fstock-video%2F${encodeURIComponent(String(query).replace(/\s+/g, '-'))}&languageCode=en`;
        const elResp = await fetch(elementsUrl, { cache: 'no-store' });
        if (elResp.ok) {
          const elData = await elResp.json();
          const items = elData?.data?.data?.items || [];
          const fallbackClips = items
            .map((it: any) => {
              const vid = it?.video?.standard || it?.video?.preview || '';
              const thumb = it?.fallbackSrc || (typeof it?.imageSrcSet === 'string' ? it.imageSrcSet.split(' ')[0] : '') || it?.blurredBackgroundSrc || '';
              return {
                id: it?.id || it?.itemUuid || it?.itemUrl || Math.random().toString(36).slice(2),
                url: vid,
                thumbnail: thumb,
                title: it?.title || 'Clip',
                context: it?.author || '',
                width: 0,
                height: 0,
                size: '',
                mime: 'video/mp4'
              };
            })
            .filter((c: { url?: string }) => typeof c.url === 'string' && (c.url as string).includes('watermarked_preview'));
          if (fallbackClips.length) clips = fallbackClips;
        }
      } catch {}
    }

    return NextResponse.json({ success: true, clips });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
