import { NextRequest, NextResponse } from 'next/server';
import { FACEBOOK_OAUTH_CONFIG } from '@/config/facebookOAuthConfig';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) {
      console.error('Facebook OAuth: NEXT_PUBLIC_FACEBOOK_APP_ID is not set');
      return NextResponse.json({ error: 'Facebook OAuth app ID not configured' }, { status: 500 });
    }

    const requestUrl = new URL(request.url);
    const redirectUri = `${requestUrl.origin}${API_ENDPOINTS.FACEBOOK_OAUTH_CALLBACK}`;
    
    if (!redirectUri) {
      console.error('Facebook OAuth: Redirect URI could not be determined');
      return NextResponse.json({ error: 'Failed to determine redirect URI' }, { status: 500 });
    }

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    const scope = FACEBOOK_OAUTH_CONFIG.SCOPES.join(',');
    
    const authUrl = new URL(FACEBOOK_OAUTH_CONFIG.AUTH_URL);
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state 
    });
  } catch (error: any) {
    console.log('Facebook OAuth initiation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate Facebook OAuth' },
      { status: 500 }
    );
  }
}

