import { NextRequest, NextResponse } from 'next/server';
import { FACEBOOK_OAUTH_CONFIG } from '@/config/facebookOAuthConfig';
import { getSupabase } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent(errorReason || error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_code_or_state', request.url)
      );
    }

    let decodedState;
    try {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_state', request.url)
      );
    }

    const userId = decodedState.userId;
    if (!userId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_user_id', request.url)
      );
    }

    const requestUrl = new URL(request.url);
    const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || `${requestUrl.origin}/api/facebook-oauth/callback`;
    
    const tokenUrl = new URL(FACEBOOK_OAUTH_CONFIG.TOKEN_URL);
    tokenUrl.searchParams.set('client_id', FACEBOOK_OAUTH_CONFIG.APP_ID);
    tokenUrl.searchParams.set('client_secret', FACEBOOK_OAUTH_CONFIG.APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenFetchResponse = await fetch(tokenUrl.toString(), {
      method: 'GET',
    });

    if (!tokenFetchResponse.ok) {
      const errorData = await tokenFetchResponse.json().catch(() => ({}));
      console.log('Token exchange error:', errorData);
      return NextResponse.redirect(
        new URL(`/social-media?error=${encodeURIComponent(errorData.error?.message || 'token_exchange_failed')}`, request.url)
      );
    }

    const tokens = await tokenFetchResponse.json();
    const { access_token } = tokens;

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/social-media?error=no_access_token', request.url)
      );
    }

    const userInfoResponse = await fetch(
      `${FACEBOOK_OAUTH_CONFIG.GRAPH_API_BASE}/me?fields=id,name,picture&access_token=${access_token}`
    );

    let userInfo = null;
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
    }

    const pagesResponse = await fetch(
      `${FACEBOOK_OAUTH_CONFIG.GRAPH_API_BASE}/me/accounts?fields=id,name,access_token&access_token=${access_token}`
    );

    let pagesList = [];
    let selectedPageInfo = null;
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      if (pagesData.data && pagesData.data.length > 0) {
        pagesList = pagesData.data.map((page: any) => ({
          pageId: page.id,
          pageName: page.name,
          accessToken: page.access_token,
        }));
        selectedPageInfo = pagesList[0];
      }
    }

    const supabase: any = getSupabase();
    
    const profileUuid = userId;
    
    const profileCheck: any = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileUuid)
      .maybeSingle();
    
    if (!profileCheck?.data || profileCheck?.error) {
      console.log('Error: Profile not found for UUID:', profileUuid);
      return NextResponse.redirect(
        new URL('/dashboard?error=user_profile_not_found', request.url)
      );
    }
    
    const tokenData = {
      access_token: selectedPageInfo?.accessToken || access_token,
      user_access_token: access_token,
      expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
      user_info: userInfo,
      pages_list: pagesList,
      selected_page_id: selectedPageInfo?.pageId || null,
      page_info: selectedPageInfo,
      connected_at: new Date().toISOString(),
    };

    if (selectedPageInfo?.pageId) {
      const socialAccountData = {
        user_id: profileUuid,
        platform: 'facebook',
        channel_id: selectedPageInfo.pageId,
        channel_name: selectedPageInfo.pageName || userInfo?.name || null,
        oauth_tokens: tokenData,
        connected: true,
        updated_at: new Date().toISOString(),
      };

      const { error: socialAccountError } = await supabase
        .from('social_accounts')
        .upsert(socialAccountData, {
          onConflict: 'user_id,platform',
        })
        .select();

      if (socialAccountError) {
        console.log('Error saving social account:', socialAccountError);
        console.log('Social account data:', socialAccountData);
        return NextResponse.redirect(
          new URL('/dashboard?error=social_account_save_failed', request.url)
        );
      }
    } else {
      console.warn('No page info available, skipping social_accounts insert');
    }

    return NextResponse.redirect(
      new URL('/dashboard?success=facebook_connected', request.url)
    );
  } catch (error: any) {
    console.log('Facebook OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(error?.message || 'oauth_callback_failed')}`, request.url)
    );
  }
}

