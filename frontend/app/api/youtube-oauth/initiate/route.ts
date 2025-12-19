import { NextRequest, NextResponse } from 'next/server';
import { YOUTUBE_OAUTH_CONFIG } from '@/config/youtubeOAuthConfig';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!YOUTUBE_OAUTH_CONFIG.CLIENT_ID) {
      return NextResponse.json({ error: 'YouTube OAuth client ID not configured' }, { status: 500 });
    }

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    const scope = YOUTUBE_OAUTH_CONFIG.SCOPES.join(' ');
    
    const authUrl = new URL(YOUTUBE_OAUTH_CONFIG.AUTH_URL);
    authUrl.searchParams.set('client_id', YOUTUBE_OAUTH_CONFIG.CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', YOUTUBE_OAUTH_CONFIG.REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state 
    });
  } catch (error: any) {
    console.log('YouTube OAuth initiation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate YouTube OAuth' },
      { status: 500 }
    );
  }
}

