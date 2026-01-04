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

    // Get YouTube video IDs and check which are deleted
    const youtubeVideoIds = publishedData?.map((pv: any) => pv.youtube_video_id) || [];
    if (youtubeVideoIds.length === 0) {
      return NextResponse.json({
        videos: [],
      });
    }

    const { data: youtubeVideos, error: youtubeError } = await supabaseAny
      .from('youtube_videos')
      .select('video_id, deleted')
      .eq('user_id', userUuid)
      .in('video_id', youtubeVideoIds);

    if (youtubeError) {
      console.log('Error fetching YouTube videos:', youtubeError);
      return NextResponse.json(
        { error: 'Failed to fetch YouTube videos' },
        { status: 500 }
      );
    }

    // Create a map of deleted YouTube videos
    const deletedVideoIds = new Set(
      youtubeVideos?.filter((yv: any) => yv.deleted).map((yv: any) => yv.video_id) || []
    );

    // Filter out published videos that are deleted
    const data = publishedData?.filter((pv: any) => !deletedVideoIds.has(pv.youtube_video_id)) || [];

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
