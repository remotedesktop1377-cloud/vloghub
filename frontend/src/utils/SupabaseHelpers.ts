// ============================================================================
// SUPABASE HELPER FUNCTIONS
// ============================================================================

/**
 * Database helper functions for Supabase integration
 */

import { getSupabase, getCurrentUser } from './supabase';
import { DB_TABLES } from '@/config/DbTables';
import { Database } from '../types/database';
import { toast, ToastOptions } from 'react-toastify';
import { User } from '@supabase/supabase-js';
import { ScriptData } from '@/types/scriptData';
import { SceneData } from '@/types/sceneData';
import { RENDER_STATUS, SCRIPT_STATUS } from '@/data/constants';
import { SecureStorageHelpers } from './helperFunctions';
// import removed: TrendingTopic no longer used in helper insert signature

export class SupabaseHelpers {
  static getClient() {
    return getSupabase();
  }

  /**
   * Save user profile to Supabase
   */

  static async saveUserProfile(profileData: User | null | undefined) {
    try {
      if (!profileData) {
        return { data: null, error: new Error('No user data provided') };
      }

      const pictureUrl = profileData.user_metadata?.picture
        || profileData.user_metadata?.avatar_url
        || profileData.user_metadata?.avatar
        || null;

      const fullName = profileData.user_metadata?.full_name
        || profileData.user_metadata?.name
        || null;

      const provider = profileData.app_metadata?.provider
        || (profileData.user_metadata?.provider ? profileData.user_metadata.provider : 'email')
        || null;

      const payload: any = {
        id: profileData.id,
        email: profileData.email || '',
        full_name: fullName,
        provider: provider,
        picture: pictureUrl,
        updated_at: new Date().toISOString(),
      };

      if (!payload.id) {
        return { data: null, error: new Error('User ID is required') };
      }

      const existingProfile = await SupabaseHelpers.getClient()
        .from(DB_TABLES.PROFILES)
        .select('id, created_at')
        .eq('id', payload.id)
        .single();

      if (existingProfile.data && !(existingProfile as any).error) {
        payload.created_at = (existingProfile as any).data.created_at;
      } else {
        payload.created_at = new Date().toISOString();
      }

      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.PROFILES)
        .upsert(payload as any, { onConflict: 'id' })
        .select()

      if (error) {
        console.log('ðŸŸ¢ Error saving profile:', error);
        toast.error('Failed to save user profile');
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Save social auth keys into profiles table (columns per platform)
   * Columns expected: tiktok_key, instagram_key, facebook_key, youtube_key
   */
  static async saveUserSocialAuthKeys(userId: string, keys: { tiktok?: string; instagram?: string; facebook?: string; youtube?: string }) {
    try {
      console.log('SupabaseHelpers: Keys to save:', keys);

      const updatePayload: any = {
        tiktok_key: keys.tiktok ?? '',
        instagram_key: keys.instagram ?? '',
        facebook_key: keys.facebook ?? '',
        youtube_key: keys.youtube ?? '',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await (SupabaseHelpers.getClient().from(DB_TABLES.PROFILES) as any)
        .update(updatePayload as any)
        .eq('id', userId);

      if (error) {
        console.log('SupabaseHelpers: Error saving social keys:', error);
        console.log('SupabaseHelpers: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        toast.error(`Failed to save social auth keys: ${error.message}`);
        return { data: null, error };
      }

      console.log('SupabaseHelpers: Social keys saved successfully:', data);
      toast.success('Social auth keys saved successfully');
      return { data, error: null };
    } catch (error) {
      console.log('SupabaseHelpers: Unexpected error saving social keys:', error);
      toast.error('An unexpected error occurred while saving social keys');
      return { data: null, error };
    }
  }

  /**
   * Fetch social auth keys from profiles table
   */
  static async getUserSocialAuthKeys(userId: string) {
    try {
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.PROFILES)
        .select('tiktok_key, instagram_key, facebook_key, youtube_key')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.log('Error fetching social keys:', error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Test if the logos bucket exists and is accessible
   */
  static async testLogosBucket(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing logos bucket access...');

      // Try to list files in the logos bucket
      const { data, error } = await SupabaseHelpers.getClient().storage
        .from('logos')
        .list('', { limit: 1 });

      if (error) {
        console.log('Bucket test error:', error);
        return { success: false, error: error.message };
      }

      console.log('Bucket test successful:', data);
      return { success: true };
    } catch (error) {
      console.log('Bucket test exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Upload logo to Supabase storage and update profile
   */
  static async uploadLogoToProfile(userId: string, file: File): Promise<{ success: boolean; url?: string; fileName?: string }> {
    try {
      console.log('SupabaseHelpers: Starting logo upload for user:', userId, 'File:', file.name);

      // First test if the bucket exists
      console.log('SupabaseHelpers: Testing bucket access...');
      const bucketTest = await SupabaseHelpers.testLogosBucket();
      if (!bucketTest.success) {
        console.log('SupabaseHelpers: Bucket test failed:', bucketTest.error);
        toast.error(`Storage bucket not accessible: ${bucketTest.error}`);
        return { success: false };
      }
      console.log('SupabaseHelpers: Bucket test passed');

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/logo-${Date.now()}.${fileExt}`;

      console.log('SupabaseHelpers: Uploading to bucket "logos" with filename:', fileName);

      // Add a timeout to the upload operation
      const uploadPromise = SupabaseHelpers.getClient().storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 25000); // 25 second timeout
      });

      const { data: uploadData, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as any;

      if (uploadError) {
        console.log('SupabaseHelpers: Upload error:', uploadError);
        console.log('SupabaseHelpers: Error details:', {
          message: uploadError.message
        });

        // Check if it's a bucket not found error
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
          toast.error('Logo storage not configured. Please contact support.');
          return { success: false };
        }

        toast.error(`Failed to upload logo: ${uploadError.message}`);
        return { success: false };
      }

      console.log('SupabaseHelpers: Upload successful, getting public URL...');

      // Get public URL
      const { data: urlData } = SupabaseHelpers.getClient().storage
        .from('logos')
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;
      console.log('SupabaseHelpers: Public URL generated:', logoUrl);

      // Update profile with logo URL
      console.log('SupabaseHelpers: Updating profile with logo URL...');
      const { error: updateError } = await (SupabaseHelpers.getClient().from(DB_TABLES.PROFILES) as any)
        .update({
          logo_url: logoUrl,
          logo_filename: file.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.log('SupabaseHelpers: Profile update error:', updateError);
        toast.error('Failed to save logo to profile');
        return { success: false };
      }

      console.log('SupabaseHelpers: Profile updated successfully');
      toast.success('Logo uploaded successfully');
      return {
        success: true,
        url: logoUrl,
        fileName: file.name
      };
    } catch (error) {
      console.log('SupabaseHelpers: Unexpected error uploading logo:', error);
      if (error instanceof Error && error.message === 'Upload timeout') {
        toast.error('Logo upload timed out. Please check your connection and try again.');
      } else {
        toast.error('An unexpected error occurred');
      }
      return { success: false };
    }
  }

  /**
   * Remove logo from profile and storage
   */
  static async removeLogoFromProfile(fileName: string, url: string, userId: string): Promise<{ success: boolean }> {
    try {

      // Remove from storage if exists
      if (url) {
        // Extract the file path from the URL or use the fileName
        const filePath = url.includes('/storage/v1/object/public/logos/')
          ? url.split('/storage/v1/object/public/logos/')[1]
          : `${userId}/logo-${fileName}`;

        const { error: deleteError } = await SupabaseHelpers.getClient().storage
          .from('logos')
          .remove([filePath]);

        if (deleteError) {
          console.log('Error deleting logo from storage:', deleteError);
          // Continue with profile update even if storage deletion fails
          // Don't show error to user if it's just a bucket not found issue
          if (!deleteError.message?.includes('Bucket not found')) {
            console.warn('Storage deletion failed, but continuing with profile update');
          }
        }
      }

      // Update profile to remove logo
      const { error: updateError } = await (SupabaseHelpers.getClient().from(DB_TABLES.PROFILES) as any)
        .update({
          logo_url: null,
          logo_filename: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.log('Error updating profile:', updateError);
        toast.error('Failed to remove logo from profile');
        return { success: false };
      }

      toast.success('Logo removed successfully');
      return { success: true };
    } catch (error) {
      console.log('Unexpected error removing logo:', error);
      toast.error('An unexpected error occurred');
      return { success: false };
    }
  }

  /**
   * Update selected background in profile
   */
  static async updateSelectedBackground(userId: string, background: any): Promise<{ success: boolean }> {
    try {
      const { error } = await (SupabaseHelpers.getClient().from(DB_TABLES.PROFILES) as any)
        .update({
          selected_background: background,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.log('Error updating background:', error);
        toast.error('Failed to save background selection');
        return { success: false };
      }

      toast.success('Background selected successfully');
      return { success: true };
    } catch (error) {
      console.log('Unexpected error updating background:', error);
      toast.error('An unexpected error occurred');
      return { success: false };
    }
  }

  /**
   * Get user profile with logo and background
   */
  static async getUserProfileWithAssets(userId: string) {
    try {
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.PROFILES)
        .select('*, logo_url, logo_filename, selected_background')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Error fetching profile with assets:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Save YouTube video metadata
   */
  static async saveYouTubeVideo(videoData: Database['public']['Tables']['youtube_videos']['Insert']) {
    try {
      const { data, error } = await SupabaseHelpers.getClient().from(DB_TABLES.YOUTUBE_VIDEOS)
        .insert(videoData as any)
        .select();

      if (error) {
        console.log('Error saving video:', error);
        toast.error('Failed to save video metadata');
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Save video clip/segment
   */
  static async saveVideoClip(clipData: Database['public']['Tables']['video_clips']['Insert']) {
    try {
      const { data, error } = await SupabaseHelpers.getClient().from(DB_TABLES.VIDEO_CLIPS)
        .insert(clipData as any)
        .select();

      if (error) {
        console.log('Error saving clip:', error);
        toast.error('Failed to save video clip');
        return { data: null, error };
      }

      toast.success('Video clip saved successfully');
      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Get user's video clips
   */
  static async getUserVideoClips(userId: string, limit: number = 50) {
    try {
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.VIDEO_CLIPS)
        .select(`
            *,
            youtube_videos (
              title,
              thumbnail_url,
              channel_title
            )
          `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Error fetching clips:', error);
        toast.error('Failed to fetch video clips');
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Save search history
   */
  static async saveSearchHistory(searchData: Database['public']['Tables']['search_history']['Insert']) {
    try {
      const { data, error } = await SupabaseHelpers.getClient().from(DB_TABLES.SEARCH_HISTORY)
        .insert(searchData as any);

      if (error) {
        console.log('Error saving search history:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user's search history
   */
  static async getSearchHistory(userId: string, limit: number = 20) {
    try {
      if (!userId) {
        // No user â†’ nothing to fetch, avoid noisy errors
        return { data: [], error: null } as any;
      }
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.SEARCH_HISTORY)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Treat missing table/row-level policy or "no rows" as empty list to avoid console noise
      if (error) {
        // Common PostgREST codes to tolerate: 42P01 (table missing), PGRST116 (no rows when using single)
        const code = (error as any)?.code || (error as any)?.details;
        if (code === '42P01' || code === 'PGRST116') {
          return { data: [], error: null } as any;
        }
        // Fallback: return empty and surface as info rather than error
        return { data: [], error: null } as any;
      }

      return { data, error: null } as any;
    } catch (error) {
      // Swallow unexpected errors to prevent UI interruption; caller treats empty as none
      return { data: [], error: null } as any;
    }
  }

  /**
   * Save trending topics
   */
  static async saveTrendingTopic(
    topic: string,
    hypothesis: string,
    region: string,
    duration: string,
    language: string,
    narration_type: string,
    created_at: string,
  ) {

    try {
      const payload: any = {
        topic: topic,
        hypothesis: hypothesis,
        region: region,
        duration: duration,
        language: language,
        narration_type: narration_type,
        created_at: created_at,
      };
      // console.log('ðŸŸ¢ Trending topics payload:', JSON.stringify(payload, null, 2));
      // Insert per RLS policy (insert allowed for authenticated users)
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.TRENDING_TOPICS)
        .insert(payload as any)
        .select()

      if (error) {
        console.log('Error saving trending topics:', error);
        toast.error('Failed to save trending topics');
        return { data: null, error };
      }

      toast.success('Trending topics saved successfully');
      // console.log('ðŸŸ¢ Trending topics saved successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Save approved script
   */
  static async saveApprovedScript(
    scriptDataPayload: ScriptData
  ) {

    try {
      const { user_id, ...rest } = scriptDataPayload as any;
      const payload: ScriptData = {
        ...rest,
        created_at: scriptDataPayload.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // console.log('ðŸŸ¢ Approved Script Payload (normalized):', JSON.stringify(payload, null, 2));
      // Insert (not upsert) to comply with insert-only RLS policy
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.SCRIPTS_APPROVED)
        .insert(payload as any)

      if (error) {
        console.log('Error saving Approved Script:', error);
        toast.error('Failed to save Approved Script');
        return { data: null, error };
      }

      toast.success('Approved Script saved successfully');
      // console.log('ðŸŸ¢ Approved Script saved successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  static async saveProjectAndScenes(scriptData: ScriptData, scriptProductionJSON: any): Promise<{ success: boolean; error?: any; projectId?: string }> {
    try {
      if (!scriptData.projectId) {
        const projectResult = await SupabaseHelpers.saveProjectRecord(scriptProductionJSON);
        if (!projectResult.success || !projectResult.projectId) {
          return { success: false, error: projectResult.error };
        }
        scriptData.projectId = projectResult.projectId;
      }

      const scenesResult = await SupabaseHelpers.saveProjectScenes(scriptData.projectId, scriptProductionJSON);
      if (!scenesResult.success) {
        return { success: false, error: scenesResult.error };
      }

      return { success: true, error: null, projectId: scriptData.projectId };
    } catch (error) {
      console.log('Unexpected error in saveProjectAndScenes:', error);
      return { success: false, error };
    }
  }

  static async saveProjectRecord(scriptProductionJSON: any): Promise<{ success: boolean; projectId?: string; error?: any }> {
    try {
      let userId = scriptProductionJSON.project.userId;

      if (!userId || userId === '' || userId === null || userId === undefined) {
        const userEmail = scriptProductionJSON.project.userEmail;

        if (!userEmail) {
          return {
            success: false,
            error: new Error('User ID or email is required. Please ensure you are logged in and try again.')
          };
        }

        const supabase = getSupabase();
        const profileResult: any = await supabase
          .from(DB_TABLES.PROFILES)
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (profileResult.error || !profileResult.data) {
          console.log('Error fetching profile by email:', profileResult.error);
          return {
            success: false,
            error: profileResult.error || new Error('User profile not found. Please sign in again.')
          };
        }

        userId = profileResult.data.id;
      }

      if (!userId) {
        return {
          success: false,
          error: new Error('User ID is missing. Please sign in again.')
        };
      }

      // Check if project already exists by job_id
      const existingProjectResult: any = await (SupabaseHelpers.getClient()
        .from(DB_TABLES.PROJECTS) as any)
        .select('id')
        .eq('job_id', scriptProductionJSON.project.jobId)
        .maybeSingle();

      const existingProject = existingProjectResult?.data;

      const payload: any = {
        user_id: userId,
        job_id: scriptProductionJSON.project.jobId,
        title: scriptProductionJSON.project.title,
        topic: scriptProductionJSON.project.topic,
        description: scriptProductionJSON.project.description,
        language: scriptProductionJSON.project.language,
        subtitle_language: scriptProductionJSON.project.subtitle_language,
        narration_type: scriptProductionJSON.project.narration_type,
        narrator_chroma_key_link: scriptProductionJSON.project.narrator_chroma_key_link,
        video_thumbnail_url: scriptProductionJSON.project.videoThumbnailUrl || '',
        project_settings: scriptProductionJSON.project.projectSettings || null,
        raw_project_json: JSON.stringify(scriptProductionJSON),
        status: 'rendering',
        updated_at: new Date().toISOString(),
      };

      let projectRow: any = null;
      let upsertError: any = null;

      if (existingProject && existingProject.id) {
        // Update existing project
        const updateResult: any = await (SupabaseHelpers.getClient()
          .from(DB_TABLES.PROJECTS) as any)
          .update(payload)
          .eq('id', existingProject.id)
          .select('id')
          .single();
        projectRow = updateResult.data;
        upsertError = updateResult.error;
      } else {
        // Insert new project
        const insertResult: any = await (SupabaseHelpers.getClient()
          .from(DB_TABLES.PROJECTS) as any)
          .insert(payload)
          .select('id')
          .single();
        projectRow = insertResult.data;
        upsertError = insertResult.error;
      }

      if (upsertError || !projectRow) {
        console.log('Error saving project to Supabase:', upsertError);
        return { success: false, error: upsertError };
      }

      const projectId = (projectRow as any).id as string;
      return { success: true, projectId };
    } catch (error) {
      console.log('Unexpected error in saveProjectRecord:', error);
      return { success: false, error };
    }
  }

  static async saveProjectScenes(projectId: string, scriptProductionJSON: any): Promise<{ success: boolean; error?: any }> {
    try {
      await SupabaseHelpers.getClient()
        .from(DB_TABLES.PROJECT_SCENES)
        .delete()
        .eq('project_id', projectId);

      const sceneRows = scriptProductionJSON.script.map((scene: any, idx: number) => ({
        project_id: projectId,
        scene_index: idx,
        narration: scene.narration,
        duration_seconds: scene.durationInSeconds,
        start_time: scene.startTime,
        end_time: scene.endTime,
        assets: scene.assets || {},
        scene_settings: scene.sceneSettings || {},
        gamma_preview_image: scene.gammaPreviewImage || null,
        preview_clip: scene.previewClip || null,
        highlighted_keywords: scene.highlightedKeywords || [],
        keywords_selected: Array.isArray(scene.keywordsSelected) ? scene.keywordsSelected : [],
      }));

      // console.log('sceneRows: ', sceneRows.length);

      if (sceneRows.length > 0) {
        const { error: insertScenesError } = await SupabaseHelpers.getClient()
          .from(DB_TABLES.PROJECT_SCENES)
          .insert(sceneRows as any);

        if (insertScenesError) {
          console.log('Error saving project scenes:', insertScenesError);
          return { success: false, error: insertScenesError };
        }
      }

      return { success: true };
    } catch (error) {
      console.log('Unexpected error in saveProjectScenes:', error);
      return { success: false, error };
    }
  }

  static async saveFinalVideoRecord(args: {
    jobId: string;
    googleDriveVideoId?: string | null;
    googleDriveVideoName?: string | null;
    googleDriveVideoUrl?: string | null;
    googleDriveThumbnailUrl?: string | null;
  }): Promise<{ success: boolean; error?: any }> {
    try {
      if (!args.jobId) {
        console.error('saveFinalVideoRecord: Missing jobId');
        return { success: false, error: 'Missing jobId' };
      }

      console.log('saveFinalVideoRecord: Looking for project with jobId:', args.jobId);

      const { data: project, error: projError } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.PROJECTS)
        .select('id')
        .eq('job_id', args.jobId)
        .maybeSingle();

      if (projError) {
        console.error('saveFinalVideoRecord: Error finding project:', projError);
        return { success: false, error: projError };
      }

      const projectAny = project as any;
      if (!projectAny || !projectAny.id) {
        console.error('saveFinalVideoRecord: Project not found for jobId:', args.jobId);
        return { success: false, error: `Project not found for jobId: ${args.jobId}` };
      }

      const projectId = projectAny.id;
      console.log('saveFinalVideoRecord: Found project with id:', projectId);

      const upsertPayload: any = {
        project_id: projectId,
        google_drive_video_id: args.googleDriveVideoId || '',
        google_drive_video_name: args.googleDriveVideoName || null,
        google_drive_video_url: args.googleDriveVideoUrl || null,
        google_drive_thumbnail_url: args.googleDriveThumbnailUrl || null,
        render_status: RENDER_STATUS.SUCCESS,
        updated_at: new Date().toISOString(),
      };

      console.log('saveFinalVideoRecord: Upsert payload:', upsertPayload);

      const supabaseAny: any = SupabaseHelpers.getClient();
      const { data: existingVideo, error: checkError } = await supabaseAny
        .from(DB_TABLES.GENERATED_VIDEOS)
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('saveFinalVideoRecord: Error checking existing video:', checkError);
        toast.error(`Failed to check video record: ${checkError.message || 'Unknown error'}`);
        return { success: false, error: checkError };
      }

      let finalData: any;
      let saveError: any;

      const existingVideoAny = existingVideo as any;
      if (existingVideoAny && existingVideoAny.id) {
        console.log('saveFinalVideoRecord: Updating existing video record:', existingVideoAny.id);
        const { data: updatedData, error: updateError } = await supabaseAny
          .from(DB_TABLES.GENERATED_VIDEOS)
          .update(upsertPayload)
          .eq('id', existingVideoAny.id)
          .select('id')
          .single();

        finalData = updatedData;
        saveError = updateError;
      } else {
        console.log('saveFinalVideoRecord: Inserting new video record');
        const { data: insertedData, error: insertError } = await supabaseAny
          .from(DB_TABLES.GENERATED_VIDEOS)
          .insert(upsertPayload)
          .select('id')
          .single();

        finalData = insertedData;
        saveError = insertError;
      }

      console.log('saveFinalVideoRecord: Save result:', { finalData, saveError });

      if (saveError) {
        console.error('saveFinalVideoRecord: Error saving final video record:', saveError);
        toast.error(`Failed to save video record: ${saveError.message || 'Unknown error'}`);
        return { success: false, error: saveError };
      }

      if (!finalData || !finalData.id) {
        console.error('saveFinalVideoRecord: Save succeeded but no data returned');
        toast.error('Failed to save video record: No data returned');
        return { success: false, error: 'No data returned from save operation' };
      }

      console.log('saveFinalVideoRecord: Successfully saved video record with id:', finalData.id);

      const { error: updateError } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.PROJECTS)
        .update({ status: RENDER_STATUS.RENDERED, updated_at: new Date().toISOString() } as unknown as never)
        .eq('id', projectId);

      if (updateError) {
        console.warn('saveFinalVideoRecord: Error updating project status:', updateError);
      } else {
        console.log('saveFinalVideoRecord: Successfully updated project status');
      }

      toast.success('Video record saved successfully');
      return { success: true };
    } catch (error) {
      console.error('saveFinalVideoRecord: Unexpected error:', error);
      toast.error(`Unexpected error saving video record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error };
    }
  }

  /**
   * Get trending topics
   */
  static async getTrendingTopics(filters: {
    category?: string;
    location?: string;
    date_range?: string;
    limit?: number;
  } = {}) {
    try {
      let query = SupabaseHelpers.getClient()
        .from(DB_TABLES.TRENDING_TOPICS)
        .select('*');

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      if (filters.date_range) {
        query = query.eq('date_range', filters.date_range);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50);

      if (error) {
        console.log('Error fetching trending topics:', error);
        toast.error('Failed to fetch trending topics');
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Search video clips by keywords
   */
  static async searchVideoClips(searchQuery: string, userId?: string, limit: number = 20) {
    try {
      const supabase = SupabaseHelpers.getClient();
      let query = supabase
        .from(DB_TABLES.VIDEO_CLIPS)
        .select(`
            *,
            youtube_videos (
              title,
              thumbnail_url,
              channel_title
            )
          `)
        .or(`title.ilike.%${searchQuery}%,transcript.ilike.%${searchQuery}%,keywords.cs.{${searchQuery}}`);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Error searching clips:', error);
        toast.error('Failed to search video clips');
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Delete video clip
   */
  static async deleteVideoClip(clipId: string, userId: string) {
    try {
      const { error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.VIDEO_CLIPS)
        .delete()
        .eq('id', clipId)
        .eq('user_id', userId); // Ensure user can only delete their own clips

      if (error) {
        console.log('Error deleting clip:', error);
        toast.error('Failed to delete video clip');
        return { error };
      }

      toast.success('Video clip deleted successfully');
      return { error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  }

  /**
   * Update video clip
   */
  static async updateVideoClip(
    clipId: string,
    userId: string,
    updates: Database['public']['Tables']['video_clips']['Update']
  ) {
    try {
      const { data, error } = await (SupabaseHelpers.getClient().from(DB_TABLES.VIDEO_CLIPS) as any)
        .update(updates as any)
        .eq('id', clipId)
        .eq('user_id', userId) // Ensure user can only update their own clips
        .select();

      if (error) {
        console.log('Error updating clip:', error);
        toast.error('Failed to update video clip');
        return { data: null, error };
      }

      toast.success('Video clip updated successfully');
      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error };
    }
  }

  /**
   * Save transcription job to track ongoing operations
   */
  static async saveTranscriptionJob(jobData: {
    user_id: string;
    job_id: string;
    job_name: string;
    drive_url: string;
    file_name: string;
    script_language: string;
  }): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.TRANSCRIPTION_JOBS)
        .insert({
          user_id: jobData.user_id,
          job_id: jobData.job_id,
          job_name: jobData.job_name,
          drive_url: jobData.drive_url,
          file_name: jobData.file_name,
          script_language: jobData.script_language,
          status: 'processing'
        } as any)
        .select();

      if (error) {
        console.log('Error saving transcription job:', error);
        return { data: null, error };
      }

      console.log('Transcription job saved:', data);
      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update transcription job status
   */
  static async updateTranscriptionJob(
    jobId: string,
    userId: string,
    updates: {
      status?: string;
      stage?: string;
      progress?: number;
      message?: string;
      error?: string;
      transcription_data?: any;
    }
  ): Promise<{ data: any; error: any }> {
    try {
      // Remove 'as any' from .update(). Cast to Record<string, unknown>, which is generally acceptable for update.
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.TRANSCRIPTION_JOBS)
        .update(updates as never)
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.log('Error updating transcription job:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get transcription job by job_id
   */
  static async getTranscriptionJob(jobId: string, userId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.TRANSCRIPTION_JOBS)
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Error fetching transcription job:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all failed transcription jobs for user (for retry)
   */
  static async getFailedTranscriptionJobs(userId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await SupabaseHelpers.getClient()
        .from(DB_TABLES.TRANSCRIPTION_JOBS)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching failed jobs:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.log('Unexpected error:', error);
      return { data: null, error };
    }
  }
}
