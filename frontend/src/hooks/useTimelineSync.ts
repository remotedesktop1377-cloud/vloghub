import { useCallback, useEffect, useState } from 'react';
import { SceneData } from '@/types/sceneData';
import { EditorProject } from '@/types/videoEditor';
import { scenesDataToEditorProject, editorProjectToScenesData } from '@/utils/timelineConverter';

interface UseTimelineSyncProps {
  scenesData: SceneData[];
  narratorVideoUrl?: string;
  onScenesDataUpdate?: (scenesData: SceneData[]) => void;
}

export function useTimelineSync({
  scenesData,
  narratorVideoUrl,
  onScenesDataUpdate,
}: UseTimelineSyncProps) {
  const [editorProject, setEditorProject] = useState<EditorProject | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Convert SceneData to EditorProject
  const convertToTimeline = useCallback(() => {
    if (!scenesData || scenesData.length === 0) {
      setEditorProject({
        timeline: [],
        playheadTime: 0,
        aspectRatio: '16:9',
        totalDuration: 0,
      });
      return;
    }

    const project = scenesDataToEditorProject(scenesData, narratorVideoUrl);
    setEditorProject(project);
  }, [scenesData, narratorVideoUrl]);

  // Convert EditorProject back to SceneData
  const convertToScenesData = useCallback(
    (project: EditorProject): SceneData[] => {
      if (!scenesData || scenesData.length === 0) {
        return [];
      }
      return editorProjectToScenesData(project, scenesData);
    },
    [scenesData]
  );

  // Sync timeline changes back to SceneData
  const syncToScenesData = useCallback(
    (project: EditorProject) => {
      if (isSyncing) return; // Prevent infinite loops
      
      setIsSyncing(true);
      try {
        const updatedScenes = convertToScenesData(project);
        if (onScenesDataUpdate) {
          onScenesDataUpdate(updatedScenes);
        }
      } catch (error) {
        console.error('Error syncing timeline to SceneData:', error);
      } finally {
        setIsSyncing(false);
      }
    },
    [convertToScenesData, onScenesDataUpdate, isSyncing]
  );

  // Initialize timeline from SceneData
  useEffect(() => {
    convertToTimeline();
  }, [convertToTimeline]);

  return {
    editorProject,
    setEditorProject,
    syncToScenesData,
    convertToTimeline,
    convertToScenesData,
    isSyncing,
  };
}

