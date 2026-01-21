import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase';
import { DB_TABLES } from '@/config/DbTables';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const userId = searchParams.get('userId');

    if (!videoId || !userId) {
      return NextResponse.json(
        { error: 'Video ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: socialAccountData, error: socialAccountError } = await supabase
      .from(DB_TABLES.SOCIAL_ACCOUNTS)
      .select('platform, channel_id, connected, oauth_tokens')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .eq('connected', true)
      .single() as { data: { platform: string; channel_id: string | null; connected: boolean; oauth_tokens: any } | null; error: any };

    if (socialAccountError || !socialAccountData) {
      return NextResponse.json(
        { error: 'YouTube account not connected. Please connect your YouTube account first.' },
        { status: 400 }
      );
    }

    if (!socialAccountData.oauth_tokens) {
      return NextResponse.json(
        { error: 'YouTube OAuth tokens not found. Please reconnect your YouTube account.' },
        { status: 400 }
      );
    }

    const tokens = socialAccountData.oauth_tokens as any;
    let accessToken = tokens.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'YouTube access token not found. Please reconnect your YouTube account.' },
        { status: 400 }
      );
    }

    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      if (!tokens.refresh_token) {
        return NextResponse.json(
          { error: 'YouTube access token expired. Please reconnect your YouTube account.' },
          { status: 400 }
        );
      }

      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '',
            client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
            refresh_token: tokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.access_token;
          const newExpiresAt = refreshData.expires_in ? Date.now() + refreshData.expires_in * 1000 : null;

          const updatedTokens = {
            ...tokens,
            access_token: newAccessToken,
            expires_at: newExpiresAt,
          };

          const supabaseAny = supabase as any;
          await supabaseAny
            .from(DB_TABLES.SOCIAL_ACCOUNTS)
            .update({
              oauth_tokens: updatedTokens,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('platform', 'youtube');

          accessToken = newAccessToken;
        }
      } catch (refreshError) {
        console.log('Error refreshing token:', refreshError);
        return NextResponse.json(
          { error: 'Failed to refresh YouTube access token. Please reconnect your YouTube account.' },
          { status: 400 }
        );
      }
    }

    const deleteResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      console.log('YouTube delete error:', errorData);
      
      if (deleteResponse.status === 403) {
        return NextResponse.json(
          { error: 'Permission denied. Please reconnect your YouTube account with delete permissions.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to delete video from YouTube' },
        { status: deleteResponse.status }
      );
    }

    // Mark video as deleted in youtube_videos table (soft delete)
    const supabaseAny: any = supabase;
    const { error: updateVideoError } = await supabaseAny
      .from(DB_TABLES.YOUTUBE_VIDEOS)
      .update({
        deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (updateVideoError) {
      console.log('Error updating youtube_videos table:', updateVideoError);
    }

    // Remove entry from published_videos table (hard delete)
    const { error: deletePublishedError } = await supabase
      .from(DB_TABLES.PUBLISHED_VIDEOS)
      .delete()
      .eq('user_id', userId)
      .eq('external_video_id', videoId)
      .eq('platform', 'youtube');

    if (deletePublishedError) {
      console.log('Error deleting from published_videos table:', deletePublishedError);
    }

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully from YouTube',
    });
  } catch (error: any) {
    console.log('YouTube delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

