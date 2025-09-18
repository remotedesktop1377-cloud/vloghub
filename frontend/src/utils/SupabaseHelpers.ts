// ============================================================================
// SUPABASE HELPER FUNCTIONS
// ============================================================================

/**
 * Database helper functions for Supabase integration
 */

import { supabase, getCurrentUser } from './supabase';
import { Database } from '../types/database';
import { toast, ToastOptions } from 'react-toastify';

export class SupabaseHelpers {

    /**
     * Save user profile to Supabase
     */
    static async saveUserProfile(profileData: {
      id: string;
      email: string;
      full_name?: string;
      avatar_url?: string;
    }) {
      try {
        const payload: any = {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name ?? null,
          avatar_url: profileData.avatar_url ?? null,
        };

        // Use upsert to avoid duplicate key errors and to insert-or-update by id
        const { data, error } = await (supabase.from('profiles') as any)
          .upsert(payload as any, { onConflict: 'id' })
          .select();
  
        if (error) {
          console.error('Error saving profile:', error);
          toast.error('Failed to save user profile');
          return { data: null, error };
        }
  
        toast.success('Profile saved successfully');
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
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
        const updatePayload: any = {
          tiktok_key: keys.tiktok ?? '',
          instagram_key: keys.instagram ?? '',
          facebook_key: keys.facebook ?? '',
          youtube_key: keys.youtube ?? ''
        };
  
        const { data, error } = await (supabase.from('profiles') as any)
          .update(updatePayload as any)
          .eq('id', userId)
          .select('id, tiktok_key, instagram_key, facebook_key, youtube_key')
          .single();
  
        if (error) {
          console.error('Error saving social keys:', error);
          toast.error('Failed to save social auth keys');
          return { data: null, error };
        }
  
        toast.success('Social auth keys saved to profile');
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  
    /**
     * Fetch social auth keys from profiles table
     */
    static async getUserSocialAuthKeys(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('tiktok_key, instagram_key, facebook_key, youtube_key')
          .eq('id', userId)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching social keys:', error);
          return { data: null, error };
        }
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        return { data: null, error };
      }
    }
  
    /**
     * Get user profile from Supabase
     */
    static async getUserProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
  
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error fetching profile:', error);
          toast.error('Failed to fetch user profile');
          return { data: null, error };
        }
  
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  
    /**
     * Save YouTube video metadata
     */
    static async saveYouTubeVideo(videoData: Database['public']['Tables']['youtube_videos']['Insert']) {
      try {
        const { data, error } = await (supabase.from('youtube_videos') as any)
          .insert(videoData as any)
          .select();
  
        if (error) {
          console.error('Error saving video:', error);
          toast.error('Failed to save video metadata');
          return { data: null, error };
        }
  
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  
    /**
     * Save video clip/segment
     */
    static async saveVideoClip(clipData: Database['public']['Tables']['video_clips']['Insert']) {
      try {
        const { data, error } = await (supabase.from('video_clips') as any)
          .insert(clipData as any)
          .select();
  
        if (error) {
          console.error('Error saving clip:', error);
          toast.error('Failed to save video clip');
          return { data: null, error };
        }
  
        toast.success('Video clip saved successfully');
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  
    /**
     * Get user's video clips
     */
    static async getUserVideoClips(userId: string, limit: number = 50) {
      try {
        const { data, error } = await supabase
          .from('video_clips')
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
          console.error('Error fetching clips:', error);
          toast.error('Failed to fetch video clips');
          return { data: null, error };
        }
  
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  
    /**
     * Save search history
     */
    static async saveSearchHistory(searchData: Database['public']['Tables']['search_history']['Insert']) {
      try {
        const { data, error } = await (supabase.from('search_history') as any)
          .insert(searchData as any);
  
        if (error) {
          console.error('Error saving search history:', error);
          return { data: null, error };
        }
  
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        return { data: null, error };
      }
    }
  
    /**
     * Get user's search history
     */
    static async getSearchHistory(userId: string, limit: number = 20) {
      try {
        if (!userId) {
          // No user → nothing to fetch, avoid noisy errors
          return { data: [], error: null } as any;
        }
        const { data, error } = await supabase
          .from('search_history')
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
    static async saveTrendingTopics(topicsData: Database['public']['Tables']['trending_topics']['Insert'][]) {
      try {
        const { data, error } = await (supabase.from('trending_topics') as any)
          .insert(topicsData as any)
          .select();
  
        if (error) {
          console.error('Error saving trending topics:', error);
          toast.error('Failed to save trending topics');
          return { data: null, error };
        }
  
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
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
        let query = supabase
          .from('trending_topics')
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
          .order('search_volume', { ascending: false })
          .limit(filters.limit || 50);
  
        if (error) {
          console.error('Error fetching trending topics:', error);
          toast.error('Failed to fetch trending topics');
          return { data: null, error };
        }
  
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  
    /**
     * Search video clips by keywords
     */
    static async searchVideoClips(searchQuery: string, userId?: string, limit: number = 20) {
      try {
        let query = supabase
          .from('video_clips')
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
          console.error('Error searching clips:', error);
          toast.error('Failed to search video clips');
          return { data: null, error };
        }
  
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  
    /**
     * Delete video clip
     */
    static async deleteVideoClip(clipId: string, userId: string) {
      try {
        const { error } = await supabase
          .from('video_clips')
          .delete()
          .eq('id', clipId)
          .eq('user_id', userId); // Ensure user can only delete their own clips
  
        if (error) {
          console.error('Error deleting clip:', error);
          toast.error('Failed to delete video clip');
          return { error };
        }
  
        toast.success('Video clip deleted successfully');
        return { error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
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
        const { data, error } = await (supabase.from('video_clips') as any)
          .update(updates as any)
          .eq('id', clipId)
          .eq('user_id', userId) // Ensure user can only update their own clips
          .select();
  
        if (error) {
          console.error('Error updating clip:', error);
          toast.error('Failed to update video clip');
          return { data: null, error };
        }
  
        toast.success('Video clip updated successfully');
        return { data, error: null };
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
        return { data: null, error };
      }
    }
  }