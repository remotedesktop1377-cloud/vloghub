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

    const { data, error } = await supabase
      .from('youtube_videos')
      .select('*')
      .eq('user_id', userId)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching YouTube videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch YouTube videos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      videos: data || [],
    });
  } catch (error: any) {
    console.error('YouTube videos fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

