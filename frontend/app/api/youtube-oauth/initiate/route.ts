import { NextRequest, NextResponse } from 'next/server';
import { YOUTUBE_OAUTH_CONFIG } from '@/config/youtubeOAuthConfig';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
    if (!clientId) {
      console.error('YouTube OAuth: NEXT_PUBLIC_YOUTUBE_CLIENT_ID is not set');
      return NextResponse.json({ error: 'YouTube OAuth client ID not configured' }, { status: 500 });
    }

    const requestUrl = new URL(request.url);
    const redirectUri = `${requestUrl.origin}${API_ENDPOINTS.YOUTUBE_OAUTH_CALLBACK}`;
    
    if (!redirectUri) {
      console.error('YouTube OAuth: Redirect URI could not be determined');
      return NextResponse.json({ error: 'Failed to determine redirect URI' }, { status: 500 });
    }

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    const scope = YOUTUBE_OAUTH_CONFIG.SCOPES.join(' ');
    
    const authUrl = new URL(YOUTUBE_OAUTH_CONFIG.AUTH_URL);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
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
    console.error('YouTube OAuth initiation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate YouTube OAuth' },
      { status: 500 }
    );
  }
}

