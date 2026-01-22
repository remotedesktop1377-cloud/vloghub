import { EditorProject } from '@/types/videoEditor';
import { getSupabase } from '@/utils/supabase';
import { SupabaseHelpers } from '@/utils/SupabaseHelpers';

interface SaveEditorProjectParams {
  project: EditorProject;
  jobId: string;
  userId: string;
}

interface SaveEditorProjectResult {
  success: boolean;
  error?: string;
  projectId?: string;
}

/**
 * Service for editor-related Supabase operations
 */
export const editorService = {
  /**
   * Save editor project to Supabase
   */
  async saveEditorProject({
    project,
    jobId,
    userId,
  }: SaveEditorProjectParams): Promise<SaveEditorProjectResult> {
    try {
      const supabase = getSupabase();

      // Check if project exists
      const { data: existingProject, error: fetchError } = await supabase
        .from('projects')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine
        console.error('Error fetching project:', fetchError);
        return { success: false, error: fetchError.message };
      }

      const projectId = existingProject?.id;

      // Save editor project data
      const editorData = {
        editor_project: project,
        updated_at: new Date().toISOString(),
      };

      if (projectId) {
        // Update existing project
        const { error: updateError } = await supabase
          .from('projects')
          .update(editorData)
          .eq('id', projectId);

        if (updateError) {
          console.error('Error updating editor project:', updateError);
          return { success: false, error: updateError.message };
        }

        return { success: true, projectId };
      } else {
        // Create new project record
        const { data: newProject, error: insertError } = await supabase
          .from('projects')
          .insert({
            job_id: jobId,
            user_id: userId,
            ...editorData,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error creating editor project:', insertError);
          return { success: false, error: insertError.message };
        }

        return { success: true, projectId: newProject.id };
      }
    } catch (error) {
      console.error('Unexpected error saving editor project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Load editor project from Supabase
   */
  async loadEditorProject(jobId: string): Promise<{
    success: boolean;
    project?: EditorProject;
    error?: string;
  }> {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('projects')
        .select('editor_project')
        .eq('job_id', jobId)
        .maybeSingle();

      if (error) {
        console.error('Error loading editor project:', error);
        return { success: false, error: error.message };
      }

      if (!data || !data.editor_project) {
        return { success: false, error: 'No editor project found' };
      }

      return {
        success: true,
        project: data.editor_project as EditorProject,
      };
    } catch (error) {
      console.error('Unexpected error loading editor project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete editor project draft
   */
  async deleteEditorProject(jobId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = getSupabase();

      const { error } = await supabase
        .from('projects')
        .update({ editor_project: null })
        .eq('job_id', jobId);

      if (error) {
        console.error('Error deleting editor project:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting editor project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

