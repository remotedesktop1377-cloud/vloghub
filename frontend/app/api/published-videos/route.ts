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

    // Get published videos for this user
    const { data: publishedData, error: publishedError } = await supabaseAny
      .from(DB_TABLES.PUBLISHED_VIDEOS)
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

    // Map generated_videos.final_video_id -> google_drive_video_id so dashboard can match by Drive file id
    const finalIds = (publishedData || [])
      .map((pv: any) => pv.final_video_id)
      .filter((id: string | null) => !!id);

    let driveIdByFinalId: Record<string, string> = {};

    if (finalIds.length > 0) {
      const { data: generatedRows, error: generatedError } = await supabaseAny
        .from(DB_TABLES.GENERATED_VIDEOS)
        .select('id, google_drive_video_id')
        .in('id', finalIds);

      if (generatedError) {
        console.log('Error fetching generated_videos for published videos:', generatedError);
      } else if (Array.isArray(generatedRows)) {
        driveIdByFinalId = generatedRows.reduce((acc: Record<string, string>, row: any) => {
          if (row.id && row.google_drive_video_id) {
            acc[row.id] = row.google_drive_video_id;
          }
          return acc;
        }, {});
      }
    }

    const data = publishedData?.map((pv: any) => {
      const isDeleted = pv.status && pv.status.toLowerCase() === 'deleted';
      if (isDeleted) return null;

      const mappedDriveId =
        (pv.final_video_id && driveIdByFinalId[pv.final_video_id]) ||
        pv.google_drive_video_id ||
        pv.final_video_id;
      
      return {
        ...pv,
        google_drive_video_id: mappedDriveId,
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
