import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // Get session to get user email
    const session = await getServerSession(authOptions as any) as any;
    const userEmail = session?.user?.email;

    if (!userEmail && !userIdParam) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const supabaseAny: any = supabase;

    // Get user UUID from profiles table using email
    let userUuid: string | null = null;
    if (userEmail) {
      const profileResult: any = await supabaseAny
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (profileResult?.data && !profileResult?.error) {
        userUuid = profileResult.data.id;
      }
    }

    // If we couldn't get UUID from email, try using userIdParam if it's a valid UUID
    // Otherwise, return error
    if (!userUuid) {
      // Check if userIdParam is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (userIdParam && uuidRegex.test(userIdParam)) {
        userUuid = userIdParam;
      } else {
        return NextResponse.json(
          { error: 'User profile not found. Please sign in again.' },
          { status: 404 }
        );
      }
    }

    // Get published videos and filter out those with deleted YouTube videos
    const { data: publishedData, error: publishedError } = await supabaseAny
      .from('published_videos')
      .select('*')
      .eq('user_id', userUuid)
      .order('published_at', { ascending: false });

    if (publishedError) {
      console.log('Error fetching published videos:', publishedError);
      return NextResponse.json(
        { error: 'Failed to fetch published videos' },
        { status: 500 }
      );
    }

    const youtubePublishedVideos = publishedData?.filter((pv: any) => pv.platform === 'youtube') || [];
    const youtubeVideoIds = youtubePublishedVideos.map((pv: any) => pv.external_video_id || pv.youtube_video_id).filter(Boolean);
    
    let deletedVideoIds = new Set();
    if (youtubeVideoIds.length > 0) {
      const { data: youtubeVideos, error: youtubeError } = await supabaseAny
        .from('youtube_videos')
        .select('video_id, deleted')
        .eq('user_id', userUuid)
        .in('video_id', youtubeVideoIds);

      if (youtubeError) {
        console.log('Error fetching YouTube videos:', youtubeError);
      } else {
        deletedVideoIds = new Set(
          youtubeVideos?.filter((yv: any) => yv.deleted).map((yv: any) => yv.video_id) || []
        );
      }
    }

    const data = publishedData?.map((pv: any) => {
      const isDeleted = pv.platform === 'youtube' && deletedVideoIds.has(pv.external_video_id || pv.youtube_video_id);
      if (isDeleted) return null;
      
      return {
        ...pv,
        google_drive_video_id: pv.google_drive_video_id || pv.final_video_id,
        youtube_video_id: pv.platform === 'youtube' ? (pv.external_video_id || pv.youtube_video_id) : undefined,
        facebook_video_id: pv.platform === 'facebook' ? (pv.external_video_id || pv.facebook_video_id) : undefined,
        youtube_title: pv.platform === 'youtube' ? (pv.title || pv.youtube_title) : undefined,
        facebook_title: pv.platform === 'facebook' ? (pv.title || pv.facebook_title) : undefined,
        youtube_url: pv.platform === 'youtube' ? (pv.external_url || pv.youtube_url) : undefined,
        facebook_url: pv.platform === 'facebook' ? (pv.external_url || pv.facebook_url) : undefined,
      };
    }).filter(Boolean) || [];

    return NextResponse.json({
      videos: data || [],
    });
  } catch (error: any) {
    console.log('Published videos fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
