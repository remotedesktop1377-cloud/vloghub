// Database types for your Supabase schema
// This file will be generated/updated based on your actual database schema

export interface Database {
  public: {
    Tables: {
      // User profiles table
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // YouTube videos table
      youtube_videos: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          duration: number | null;
          published_at: string | null;
          channel_title: string | null;
          view_count: number | null;
          like_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          published_at?: string | null;
          channel_title?: string | null;
          view_count?: number | null;
          like_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          published_at?: string | null;
          channel_title?: string | null;
          view_count?: number | null;
          like_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Video clips/segments table
      video_clips: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          title: string;
          start_time: number;
          end_time: number;
          transcript: string | null;
          keywords: string[] | null;
          sentiment_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          user_id: string;
          title: string;
          start_time: number;
          end_time: number;
          transcript?: string | null;
          keywords?: string[] | null;
          sentiment_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          user_id?: string;
          title?: string;
          start_time?: number;
          end_time?: number;
          transcript?: string | null;
          keywords?: string[] | null;
          sentiment_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Search history table
      search_history: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          filters: Record<string, any> | null;
          results_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          filters?: Record<string, any> | null;
          results_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          filters?: Record<string, any> | null;
          results_count?: number | null;
          created_at?: string;
        };
      };

      // Trending topics table
      trending_topics: {
        Row: {
          id: string;
          topic: string;
          category: string;
          location: string | null;
          search_volume: number | null;
          date_range: string;
          related_keywords: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          category: string;
          location?: string | null;
          search_volume?: number | null;
          date_range: string;
          related_keywords?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic?: string;
          category?: string;
          location?: string | null;
          search_volume?: number | null;
          date_range?: string;
          related_keywords?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
