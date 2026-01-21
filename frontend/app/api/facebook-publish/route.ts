import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase';
import { DB_TABLES } from '@/config/DbTables';
import { FACEBOOK_OAUTH_CONFIG } from '@/config/facebookOAuthConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoName, videoUrl, jobId, userId, thumbnailLink } = body;

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

    let finalVideoId: string | null = null;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(videoId)) {
      finalVideoId = videoId;
    } else {
      const { data: finalVideo, error: finalVideoError } = await supabaseAny
        .from(DB_TABLES.GENERATED_VIDEOS)
        .select('id')
        .eq('google_drive_video_id', videoId)
        .maybeSingle();
      
      if (finalVideo && !finalVideoError) {
        finalVideoId = finalVideo.id;
      } else {
        let projectId: string | null = null;
        
        if (jobId) {
          const { data: project, error: projectError } = await supabaseAny
            .from(DB_TABLES.PROJECTS)
            .select('id')
            .eq('job_id', jobId)
            .maybeSingle();
          
          if (project && !projectError) {
            projectId = project.id;
          }
        }
        
        const finalVideoPayload: any = {
          google_drive_video_id: videoId,
          google_drive_video_name: videoName || null,
          google_drive_video_url: videoUrl || null,
          render_status: 'success',
          updated_at: new Date().toISOString(),
        };
        
        if (projectId) {
          finalVideoPayload.project_id = projectId;
        }
        
        const { data: newFinalVideo, error: createError } = await supabaseAny
          .from(DB_TABLES.GENERATED_VIDEOS)
          .insert(finalVideoPayload)
          .select('id')
          .single();
        
        if (newFinalVideo && !createError) {
          finalVideoId = newFinalVideo.id;
        } else {
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

    const { data: existingPublished, error: checkError } = await supabaseAny
      .from(DB_TABLES.PUBLISHED_VIDEOS)
      .select('external_video_id, external_url, title, published_at')
      .eq('user_id', userId)
      .eq('final_video_id', finalVideoId)
      .eq('platform', 'facebook')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('Error checking published videos:', checkError);
    }

    if (existingPublished) {
      return NextResponse.json(
        {
          error: 'This video has already been published to Facebook',
          alreadyPublished: true,
          facebookPostId: existingPublished.external_video_id,
          facebookUrl: existingPublished.external_url,
          facebookTitle: existingPublished.title,
          publishedAt: existingPublished.published_at,
        },
        { status: 400 }
      );
    }

    const { data: socialAccountData, error: socialAccountError } = await supabase
      .from(DB_TABLES.SOCIAL_ACCOUNTS)
      .select('platform, channel_id, connected, oauth_tokens')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .eq('connected', true)
      .single();

    if (socialAccountError || !socialAccountData) {
      return NextResponse.json(
        { error: 'Facebook account not connected. Please connect your Facebook account first.' },
        { status: 400 }
      );
    }

    const socialAccount = socialAccountData as any;
    if (!socialAccount?.oauth_tokens) {
      return NextResponse.json(
        { error: 'Facebook OAuth tokens not found. Please reconnect your Facebook account.' },
        { status: 400 }
      );
    }

    const tokens = socialAccount.oauth_tokens;
    const selectedPageId = tokens.selected_page_id || tokens.page_info?.pageId || socialAccount.channel_id;
    
    const pagesList = tokens.pages_list || [];
    const selectedPage = pagesList.find((page: any) => page.pageId === selectedPageId) || tokens.page_info;

    if (!selectedPage) {
      return NextResponse.json(
        { error: 'Selected Facebook page not found. Please reconnect your Facebook account.' },
        { status: 400 }
      );
    }

    const accessToken = selectedPage.accessToken || tokens.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Facebook access token not found. Please reconnect your Facebook account.' },
        { status: 400 }
      );
    }

    const pageId = selectedPage.pageId || selectedPageId;

    if (!pageId) {
      return NextResponse.json(
        { error: 'Facebook page ID not found. Please reconnect your Facebook account.' },
        { status: 400 }
      );
    }

    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download video from Google Drive' },
        { status: 500 }
      );
    }

    const videoArrayBuffer = await videoResponse.arrayBuffer();
    const videoBlob = new Blob([videoArrayBuffer], { type: 'video/mp4' });

    const formData = new FormData();
    formData.append('source', videoBlob, `${videoName || jobId || 'video'}.mp4`);
    formData.append('description', videoName || `Published from VlogHub - Job ID: ${jobId}`);

    const uploadResponse = await fetch(
      `${FACEBOOK_OAUTH_CONFIG.GRAPH_API_BASE}/${pageId}/videos?access_token=${accessToken}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.log('Facebook upload error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to upload video to Facebook' },
        { status: uploadResponse.status }
      );
    }

    const uploadData = await uploadResponse.json();
    const facebookPostId = uploadData.id;
    const facebookPostUrl = `https://www.facebook.com/${pageId}/videos/${facebookPostId}`;
    const facebookTitle = videoName || `Video from ${jobId}`;
    const publishedAt = new Date().toISOString();

    const publishedVideoData: any = {
      user_id: userId,
      final_video_id: finalVideoId,
      platform: 'facebook',
      external_video_id: facebookPostId,
      external_url: facebookPostUrl,
      title: facebookTitle,
      thumbnail_url: thumbnailLink || null,
      status: 'published',
      published_at: publishedAt,
      updated_at: publishedAt,
    };

    const { data: savedPublishedVideo, error: savePublishedError } = await supabaseAny
      .from(DB_TABLES.PUBLISHED_VIDEOS)
      .insert(publishedVideoData)
      .select()
      .single();

    if (savePublishedError || !savedPublishedVideo) {
      console.log('Error saving published video to database:', savePublishedError);
      return NextResponse.json(
        { error: 'Video uploaded to Facebook but failed to save published video record. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      videoId: facebookPostId,
      videoUrl: facebookPostUrl,
      message: 'Video published successfully to Facebook',
      publishedVideo: savedPublishedVideo,
    });
  } catch (error: any) {
    console.log('Facebook publish error:', error);
    // return NextResponse.json(
    //   { error: error?.message || 'Internal server error' },
    //   { status: 500 }
    // );
  }
}

