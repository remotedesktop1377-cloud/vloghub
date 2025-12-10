import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoName, videoUrl, jobId, userId } = body;

    if (!videoId || !videoUrl) {
      return NextResponse.json(
        { error: 'Video ID and URL are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const supabaseAny: any = supabase;

    // Check if video is already published and not deleted
    const { data: existingPublished, error: checkError } = await supabaseAny
      .from('published_videos')
      .select('youtube_video_id, youtube_url, youtube_title, published_at')
      .eq('user_id', userId)
      .eq('google_drive_video_id', videoId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking published videos:', checkError);
    }

    if (existingPublished) {
      // Check if the YouTube video is deleted
      const { data: youtubeVideo, error: youtubeVideoError } = await supabaseAny
        .from('youtube_videos')
        .select('deleted')
        .eq('user_id', userId)
        .eq('video_id', existingPublished.youtube_video_id)
        .single();

      // If video exists and is not deleted, prevent republishing
      if (youtubeVideo && !youtubeVideo.deleted) {
        return NextResponse.json(
          {
            error: 'This video has already been published to YouTube',
            alreadyPublished: true,
            youtubeVideoId: existingPublished.youtube_video_id,
            youtubeUrl: existingPublished.youtube_url,
            youtubeTitle: existingPublished.youtube_title,
            publishedAt: existingPublished.published_at,
          },
          { status: 400 }
        );
      }
      // If video is deleted, allow republishing - we'll update the existing record
    }

    const { data: socialAccountData, error: socialAccountError } = await supabase
      .from('social_accounts')
      .select('platform, channel_id, connected, oauth_tokens')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .eq('connected', true)
      .single();

    if (socialAccountError || !socialAccountData) {
      return NextResponse.json(
        { error: 'YouTube account not connected. Please connect your YouTube account first.' },
        { status: 400 }
      );
    }

    const socialAccount = socialAccountData as any;
    if (!socialAccount?.oauth_tokens) {
      return NextResponse.json(
        { error: 'YouTube OAuth tokens not found. Please reconnect your YouTube account.' },
        { status: 400 }
      );
    }

    const tokens = socialAccount.oauth_tokens;
    const accessToken = tokens.access_token;

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

          await supabaseAny
            .from('social_accounts')
            .update({
              oauth_tokens: updatedTokens,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('platform', 'youtube');

          tokens.access_token = newAccessToken;
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return NextResponse.json(
          { error: 'Failed to refresh YouTube access token. Please reconnect your YouTube account.' },
          { status: 400 }
        );
      }
    }

    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download video from Google Drive' },
        { status: 500 }
      );
    }

    const videoArrayBuffer = await videoResponse.arrayBuffer();
    const videoBuffer = Buffer.from(videoArrayBuffer);

    const metadata = {
      snippet: {
        title: videoName || `Video from ${jobId}`,
        description: `Published from VlogHub - Job ID: ${jobId}`,
        tags: ['VlogHub', 'AI Generated'],
        categoryId: '22',
      },
      status: {
        privacyStatus: 'public',
      },
    };

    const boundary = `----WebKitFormBoundary${Date.now()}`;
    const metadataPart = `--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const videoPart = `--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${videoName || jobId || 'video'}.mp4"\r\nContent-Type: video/mp4\r\n\r\n`;
    const endBoundary = `\r\n--${boundary}--\r\n`;

    const multipartBody = Buffer.concat([
      Buffer.from(metadataPart, 'utf8'),
      Buffer.from(videoPart, 'utf8'),
      videoBuffer,
      Buffer.from(endBoundary, 'utf8'),
    ]);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': multipartBody.length.toString(),
        },
        body: multipartBody,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('YouTube upload error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to upload video to YouTube' },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    const youtubeVideoId = uploadData.id;
    const youtubeVideoUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
    const youtubeTitle = uploadData.snippet?.title || videoName || `Video from ${jobId}`;
    const thumbnailUrl = uploadData.snippet?.thumbnails?.default?.url || null;

    // Save to youtube_videos table (mark as not deleted if republishing)
    const { error: saveVideoError } = await supabaseAny
      .from('youtube_videos')
      .upsert({
        user_id: userId,
        video_id: youtubeVideoId,
        title: youtubeTitle,
        description: `Published from VlogHub - Job ID: ${jobId}`,
        thumbnail_url: thumbnailUrl,
        published_at: new Date().toISOString(),
        channel_title: (socialAccountData as any).channel_name || null,
        deleted: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,video_id',
      });

    if (saveVideoError) {
      console.error('Error saving YouTube video to database:', saveVideoError);
    }

    // Save to published_videos table (links Google Drive video to YouTube video)
    // If republishing after delete, update existing record; otherwise create new
    const { error: savePublishedError } = await supabaseAny
      .from('published_videos')
      .upsert({
        user_id: userId,
        google_drive_video_id: videoId,
        youtube_video_id: youtubeVideoId,
        job_id: jobId || null,
        video_name: videoName || null,
        youtube_title: youtubeTitle,
        youtube_url: youtubeVideoUrl,
        thumbnail_url: thumbnailUrl,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,google_drive_video_id',
      });

    if (savePublishedError) {
      console.error('Error saving published video to database:', savePublishedError);
    }

    return NextResponse.json({
      success: true,
      videoId: youtubeVideoId,
      videoUrl: youtubeVideoUrl,
      message: 'Video published successfully to YouTube',
    });
  } catch (error: any) {
    console.error('YouTube publish error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

