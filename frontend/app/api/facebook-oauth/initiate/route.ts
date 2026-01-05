import { NextRequest, NextResponse } from 'next/server';
import { FACEBOOK_OAUTH_CONFIG } from '@/config/facebookOAuthConfig';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!FACEBOOK_OAUTH_CONFIG.APP_ID) {
      return NextResponse.json({ error: 'Facebook OAuth app ID not configured' }, { status: 500 });
    }

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    const scope = FACEBOOK_OAUTH_CONFIG.SCOPES.join(',');
    
    const requestUrl = new URL(request.url);
    const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || `${requestUrl.origin}/api/facebook-oauth/callback`;
    
    const authUrl = new URL(FACEBOOK_OAUTH_CONFIG.AUTH_URL);
    authUrl.searchParams.set('client_id', FACEBOOK_OAUTH_CONFIG.APP_ID);
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

