import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const supabaseAny: any = supabase;

    // Get published videos and filter out those with deleted YouTube videos
    const { data: publishedData, error: publishedError } = await supabaseAny
      .from('published_videos')
      .select('*')
      .eq('user_id', userId)
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
      .eq('user_id', userId)
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
