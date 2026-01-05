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

    // First, find or get final_video_id from final_videos table
    // final_video_id is UUID type and should reference final_videos.id
    let finalVideoId: string | null = null;
    
    // Check if videoId is already a UUID (in case it's already a final_videos.id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(videoId)) {
      // If videoId is a UUID, assume it's already a final_videos.id
      finalVideoId = videoId;
    } else {
      // If videoId is a Google Drive file ID, try to find the final_videos record
      const { data: finalVideo, error: finalVideoError } = await supabaseAny
        .from('final_videos')
        .select('id')
        .eq('google_drive_video_id', videoId)
        .maybeSingle();
      
      if (finalVideo && !finalVideoError) {
        finalVideoId = finalVideo.id;
      } else {
        // If no final_videos record exists, try to create one
        let projectId: string | null = null;
        
        // Try to find project by jobId if available
        if (jobId) {
          const { data: project, error: projectError } = await supabaseAny
            .from('projects')
            .select('id')
            .eq('job_id', jobId)
            .maybeSingle();
          
          if (project && !projectError) {
            projectId = project.id;
          }
        }
        
        // Create a final_videos record (with or without project_id)
        const finalVideoPayload: any = {
          google_drive_video_id: videoId,
          google_drive_video_name: videoName || null,
          google_drive_video_url: videoUrl || null,
          render_status: 'success',
          updated_at: new Date().toISOString(),
        };
        
        // Only include project_id if we found one
        if (projectId) {
          finalVideoPayload.project_id = projectId;
        }
        
        const { data: newFinalVideo, error: createError } = await supabaseAny
          .from('final_videos')
          .insert(finalVideoPayload)
          .select('id')
          .single();
        
        if (newFinalVideo && !createError) {
          finalVideoId = newFinalVideo.id;
          console.log('Created new final_videos record:', finalVideoId);
        } else {
          console.log('Error creating final_videos record:', createError);
          console.log('Payload used:', finalVideoPayload);
          
          // If creation failed, return a more helpful error
          return NextResponse.json(
            { 
              error: 'Could not create final video record in database. Please try again or contact support.',
              details: createError?.message || 'Unknown error'
            },
            { status: 500 }
          );
        }
      }
    }

    // Check if video is already published using the final_video_id UUID
    const { data: existingPublished, error: checkError } = await supabaseAny
      .from('published_videos')
      .select('external_video_id, external_url, title, published_at')
      .eq('user_id', userId)
      .eq('final_video_id', finalVideoId)
      .eq('platform', 'youtube')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('Error checking published videos:', checkError);
    }

    if (existingPublished) {
      return NextResponse.json(
        {
          error: 'This video has already been published to YouTube',
          alreadyPublished: true,
          youtubeVideoId: existingPublished.external_video_id,
          youtubeUrl: existingPublished.external_url,
          youtubeTitle: existingPublished.title,
          publishedAt: existingPublished.published_at,
        },
        { status: 400 }
      );
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
        console.log('Error refreshing token:', refreshError);
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
      console.log('YouTube upload error:', errorData);
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
    const publishedAt = new Date().toISOString();

    // finalVideoId is already determined above, so we can use it directly

    // Save to published_videos table (links Google Drive video to YouTube video)
    // This is the critical step - ensure it happens after successful YouTube upload
    // final_video_id is required, so we must have it at this point
    const publishedVideoData: any = {
      user_id: userId,
      final_video_id: finalVideoId,
      platform: 'youtube',
      external_video_id: youtubeVideoId,
      external_url: youtubeVideoUrl,
      title: youtubeTitle,
      thumbnail_url: thumbnailUrl,
      status: 'published',
      published_at: publishedAt,
      updated_at: publishedAt,
    };

    const { data: savedPublishedVideo, error: savePublishedError } = await supabaseAny
      .from('published_videos')
      .upsert(publishedVideoData, {
        onConflict: 'user_id,final_video_id,platform',
      })
      .select()
      .single();

    if (savePublishedError) {
      console.log('Error saving published video to database:', savePublishedError);
      console.log('Published video data:', publishedVideoData);
      return NextResponse.json(
        { error: 'Video uploaded to YouTube but failed to save published video record. Please contact support.' },
        { status: 500 }
      );
    }

    if (!savedPublishedVideo) {
      console.log('Warning: Published video upsert returned no data');
      return NextResponse.json(
        { error: 'Video uploaded to YouTube but failed to retrieve saved published video record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      videoId: youtubeVideoId,
      videoUrl: youtubeVideoUrl,
      message: 'Video published successfully to YouTube',
      publishedVideo: savedPublishedVideo,
    });
  } catch (error: any) {
    console.log('YouTube publish error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

