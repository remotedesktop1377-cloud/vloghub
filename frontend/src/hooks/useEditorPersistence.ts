import { useEffect, useCallback, useRef, useState } from 'react';
import { EditorProject } from '@/types/videoEditor';
import { SecureStorageHelpers } from '@/utils/helperFunctions';
import { editorService } from '@/services/editorService';
import { toast } from 'react-toastify';

interface UseEditorPersistenceOptions {
  project: EditorProject;
  jobId?: string;
  userId?: string;
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number; // in milliseconds
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

const DEFAULT_AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY_PREFIX = 'editor_project_';

export function useEditorPersistence({
  project,
  jobId,
  userId,
  autoSaveEnabled = true,
  autoSaveInterval = DEFAULT_AUTO_SAVE_INTERVAL,
  onSaveSuccess,
  onSaveError,
}: UseEditorPersistenceOptions) {
  const lastSavedRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate storage key
  const getStorageKey = useCallback(() => {
    if (jobId) {
      return `${STORAGE_KEY_PREFIX}${jobId}`;
    }
    return `${STORAGE_KEY_PREFIX}draft`;
  }, [jobId]);

  // Save to localStorage
  const saveToLocalStorage = useCallback((proj: EditorProject) => {
    try {
      const storageKey = getStorageKey();
      const projectData = {
        project: proj,
        savedAt: new Date().toISOString(),
        jobId,
        userId,
      };
      SecureStorageHelpers.setEditorDraft(storageKey, projectData);
      lastSavedRef.current = JSON.stringify(proj);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }, [getStorageKey, jobId, userId]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): EditorProject | null => {
    try {
      const storageKey = getStorageKey();
      const saved = SecureStorageHelpers.getEditorDraft(storageKey);
      if (saved && saved.project) {
        return saved.project as EditorProject;
      }
      return null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, [getStorageKey]);

  // Save to Supabase
  const saveToSupabase = useCallback(async (proj: EditorProject): Promise<boolean> => {
    if (!jobId || !userId) {
      console.warn('Cannot save to Supabase: missing jobId or userId');
      return false;
    }

    if (isSaving) {
      console.log('Save already in progress, skipping...');
      return false;
    }

    setIsSaving(true);

    try {
      const result = await editorService.saveEditorProject({
        project: proj,
        jobId,
        userId,
      });

      if (result.success) {
        lastSavedRef.current = JSON.stringify(proj);
        onSaveSuccess?.();
        return true;
      } else {
        const error = new Error(result.error || 'Failed to save to Supabase');
        onSaveError?.(error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      onSaveError?.(error as Error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [jobId, userId, onSaveSuccess, onSaveError, isSaving]);

  // Combined save function (localStorage + Supabase)
  const save = useCallback(async (proj: EditorProject, showToast = true): Promise<boolean> => {
    // Always save to localStorage first (fast)
    const localStorageSuccess = saveToLocalStorage(proj);

    if (!localStorageSuccess && showToast) {
      toast.warning('Failed to save draft locally');
    }

    // Save to Supabase if we have the required info
    if (jobId && userId) {
      try {
        const supabaseSuccess = await saveToSupabase(proj);
        if (supabaseSuccess && showToast) {
          toast.success('Project saved successfully');
        } else if (!supabaseSuccess && showToast) {
          toast.warning('Saved locally, but failed to sync to cloud');
        }
        return supabaseSuccess || localStorageSuccess;
      } catch (error) {
        if (showToast) {
          toast.warning('Saved locally, but failed to sync to cloud');
        }
        return localStorageSuccess;
      }
    }

    if (localStorageSuccess && showToast) {
      toast.success('Draft saved locally');
    }

    return localStorageSuccess;
  }, [saveToLocalStorage, saveToSupabase, jobId, userId]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback((proj: EditorProject) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const projectString = JSON.stringify(proj);
      // Only save if project has changed
      if (projectString !== lastSavedRef.current) {
        save(proj, false); // Don't show toast for auto-save
      }
    }, 2000); // 2 second debounce
  }, [save]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up auto-save interval
    autoSaveTimerRef.current = setInterval(() => {
      const projectString = JSON.stringify(project);
      if (projectString !== lastSavedRef.current) {
        debouncedAutoSave(project);
      }
    }, autoSaveInterval);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [project, autoSaveEnabled, autoSaveInterval, debouncedAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    save,
    saveToLocalStorage,
    saveToSupabase,
    loadFromLocalStorage,
    isSaving,
  };
}

