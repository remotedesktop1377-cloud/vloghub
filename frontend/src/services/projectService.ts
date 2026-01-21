import { getSupabase } from '@/utils/supabase';
import { DB_TABLES } from '@/config/DbTables';

export interface ProjectData {
  title: string | null;
  video_thumbnail_url: string | null;
}

export const ProjectService = {
  async getProjectByJobId(jobId: string, userId?: string): Promise<ProjectData | null> {
    try {
      const supabase = getSupabase();
      const supabaseAny: any = supabase;

      let query = supabaseAny
        .from(DB_TABLES.PROJECTS)
        .select('title, video_thumbnail_url')
        .eq('job_id', jobId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.log('Error fetching project:', error);
        return null;
      }

      return {
        title: data?.title || null,
        video_thumbnail_url: data?.video_thumbnail_url || null,
      };
    } catch (error) {
      console.log('Unexpected error fetching project:', error);
      return null;
    }
  },
};

