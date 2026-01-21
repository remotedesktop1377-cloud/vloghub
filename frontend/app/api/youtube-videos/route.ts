import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase';
import { DB_TABLES } from '@/config/DbTables';
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
        .from(DB_TABLES.PROFILES)
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

    const { data, error } = await supabaseAny
      .from(DB_TABLES.YOUTUBE_VIDEOS)
      .select('*')
      .eq('user_id', userUuid)
      .order('published_at', { ascending: false });

    if (error) {
      console.log('Error fetching YouTube videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch YouTube videos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      videos: data || [],
    });
  } catch (error: any) {
    console.log('YouTube videos fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

