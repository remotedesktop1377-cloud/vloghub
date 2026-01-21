import { NextRequest, NextResponse } from 'next/server';
import { YOUTUBE_OAUTH_CONFIG } from '@/config/youtubeOAuthConfig';
import { getSupabase } from '@/utils/supabase';
import { DB_TABLES } from '@/config/DbTables';
import { ROUTES_KEYS } from '@/data/constants';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`${ROUTES_KEYS.DASHBOARD}?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`${ROUTES_KEYS.DASHBOARD}?error=missing_code_or_state`, request.url)
      );
    }

    let decodedState;
    try {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      return NextResponse.redirect(
        new URL(`${ROUTES_KEYS.DASHBOARD}?error=invalid_state`, request.url)
      );
    }

    const userId = decodedState.userId;
    if (!userId) {
      return NextResponse.redirect(
        new URL(`${ROUTES_KEYS.DASHBOARD}?error=missing_user_id`, request.url)
      );
    }

    const requestUrl = new URL(request.url);
    const redirectUri = `${requestUrl.origin}${API_ENDPOINTS.YOUTUBE_OAUTH_CALLBACK}`;
    const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('YouTube OAuth: Missing CLIENT_ID or CLIENT_SECRET');
      return NextResponse.redirect(
        new URL(`${ROUTES_KEYS.DASHBOARD}?error=oauth_config_missing`, request.url)
      );
    }

    const tokenResponse = await fetch(YOUTUBE_OAUTH_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    // console.log('YouTube OAuth response: ', tokenResponse);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.log('Token exchange error:', errorData);
      return NextResponse.redirect(
        new URL(`${ROUTES_KEYS.DASHBOARD}?error=${encodeURIComponent(errorData.error || 'token_exchange_failed')}`, request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let channelInfo = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
    //   console.log('YouTube OAuth user info: ', userInfo);

      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        // console.log('YouTube OAuth channel data: ', channelData);
        if (channelData.items && channelData.items.length > 0) {
          channelInfo = {
            channelId: channelData.items[0].id,
            title: channelData.items[0].snippet?.title,
            description: channelData.items[0].snippet?.description,
            thumbnail: channelData.items[0].snippet?.thumbnails?.default?.url,
            subscriberCount: channelData.items[0].statistics?.subscriberCount,
            videoCount: channelData.items[0].statistics?.videoCount,
          };
        }
      }
    }

    const supabase: any = getSupabase();
    
    const profileUuid = userId;
    
    const profileCheck: any = await supabase
      .from(DB_TABLES.PROFILES)
      .select('id')
      .eq('id', profileUuid)
      .maybeSingle();
    
    if (!profileCheck?.data || profileCheck?.error) {
      console.log('Error: Profile not found for UUID:', profileUuid);
      return NextResponse.redirect(
        new URL(`${ROUTES_KEYS.DASHBOARD}?error=user_profile_not_found`, request.url)
      );
    }
    
    const tokenData = {
      access_token,
      refresh_token,
      expires_at: expires_in ? Date.now() + expires_in * 1000 : null,
      channel_info: channelInfo,
      connected_at: new Date().toISOString(),
    };

    if (channelInfo?.channelId) {
      const socialAccountData = {
        user_id: profileUuid,
        platform: 'youtube',
        channel_id: channelInfo.channelId,
        channel_name: channelInfo.title || null,
        oauth_tokens: tokenData,
        connected: true,
        updated_at: new Date().toISOString(),
      };

      const { error: socialAccountError } = await supabase
        .from(DB_TABLES.SOCIAL_ACCOUNTS)
        .upsert(socialAccountData, {
          onConflict: 'user_id,platform',
        })
        .select();

      if (socialAccountError) {
        console.log('Error saving social account:', socialAccountError);
        console.log('Social account data:', socialAccountData);
        return NextResponse.redirect(
          new URL(`${ROUTES_KEYS.DASHBOARD}?error=social_account_save_failed`, request.url)
        );
      }
    } else {
      console.warn('No channel info available, skipping social_accounts insert');
    }

    return NextResponse.redirect(
      new URL(`${ROUTES_KEYS.DASHBOARD}?success=youtube_connected`, request.url)
    );
  } catch (error: any) {
    console.log('YouTube OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`${ROUTES_KEYS.DASHBOARD}?error=${encodeURIComponent(error?.message || 'oauth_callback_failed')}`, request.url)
    );
  }
}

