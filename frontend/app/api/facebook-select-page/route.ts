import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase';
import { FACEBOOK_OAUTH_CONFIG } from '@/config/facebookOAuthConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pageId } = body;

    if (!userId || !pageId) {
      return NextResponse.json(
        { error: 'User ID and Page ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const supabaseAny: any = supabase;

    const { data: socialAccountData, error: socialAccountError } = await supabaseAny
      .from('social_accounts')
      .select('oauth_tokens')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .eq('connected', true)
      .single();

    if (socialAccountError || !socialAccountData) {
      return NextResponse.json(
        { error: 'Facebook account not connected' },
        { status: 400 }
      );
    }

    const tokens = (socialAccountData as any).oauth_tokens;
    const pagesList = tokens.pages_list || [];

    const selectedPage = pagesList.find((page: any) => page.pageId === pageId);

    if (!selectedPage) {
      return NextResponse.json(
        { error: 'Page not found in your connected pages' },
        { status: 400 }
      );
    }

    const updatedTokens = {
      ...tokens,
      selected_page_id: pageId,
      page_info: selectedPage,
      access_token: selectedPage.accessToken,
    };

    const { data: updatedAccount, error: updateError } = await supabaseAny
      .from('social_accounts')
      .update({
        oauth_tokens: updatedTokens,
        channel_id: pageId,
        channel_name: selectedPage.pageName,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .select()
      .single();

    if (updateError) {
      console.log('Error updating selected page:', updateError);
      return NextResponse.json(
        { error: 'Failed to update selected page' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      selectedPage: {
        pageId: selectedPage.pageId,
        pageName: selectedPage.pageName,
      },
    });
  } catch (error: any) {
    console.log('Facebook select page error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

