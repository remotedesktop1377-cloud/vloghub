import { useState, useCallback, useEffect } from 'react';
import * as React from 'react';
import { EditorProject, EditorState, EditorActions, Track, Clip } from '@/types/videoEditor';

const DEFAULT_ZOOM = 1;
const MAX_HISTORY_SIZE = 50;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

export function useEditorState(initialProject?: EditorProject) {
  // Create a snapshot of current project for history
  const createSnapshot = useCallback((proj: EditorProject): EditorProject => {
    return JSON.parse(JSON.stringify(proj));
  }, []);

  // Initialize default project if none provided
  const defaultProject: EditorProject = initialProject || {
    timeline: [],
    playheadTime: 0,
    aspectRatio: '16:9',
    totalDuration: 0,
    frameRate: 30,
  };
  
  // Ensure frameRate is set (backward compatibility)
  if (defaultProject.frameRate === undefined) {
    defaultProject.frameRate = 30;
  }

  const [project, setProject] = useState<EditorProject>(defaultProject);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [selectedCanvasClipId, setSelectedCanvasClipId] = useState<string | null>(null); // Canvas selection for transforms
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [history, setHistory] = useState<EditorProject[]>([createSnapshot(defaultProject)]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Update project when initialProject changes
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      setHistory([createSnapshot(initialProject)]);
      setHistoryIndex(0);
    }
  }, [initialProject, createSnapshot]);

  // Add to history
  const addToHistory = useCallback((proj: EditorProject) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(createSnapshot(proj));
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex]);

  // Update project with history tracking
  const updateProject = useCallback((newProject: EditorProject) => {
    setProject(newProject);
    addToHistory(newProject);
  }, [addToHistory]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousProject = history[historyIndex - 1];
      setProject(previousProject);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextProject = history[historyIndex + 1];
      setProject(nextProject);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  // Actions
  const actions: EditorActions = {
    setPlayheadTime: useCallback((time: number) => {
      setProject((prev) => ({
        ...prev,
        playheadTime: Math.max(0, Math.min(time, prev.totalDuration)),
      }));
    }, []),

    setZoom: useCallback((newZoom: number) => {
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
    }, []),

    togglePlay: useCallback(() => {
      setIsPlaying((prev) => !prev);
    }, []),

    selectClip: useCallback((clipId: string) => {
      setSelectedClipIds((prev) => 
        prev.includes(clipId) ? prev : [...prev, clipId]
      );
    }, []),

    deselectClip: useCallback((clipId: string) => {
      setSelectedClipIds((prev) => prev.filter((id) => id !== clipId));
    }, []),

    selectAllClips: useCallback(() => {
      const allClipIds = project.timeline.flatMap((track) =>
        track.clips.map((clip) => clip.id)
      );
      setSelectedClipIds(allClipIds);
    }, [project]),

    clearSelection: useCallback(() => {
      setSelectedClipIds([]);
    }, []),

    selectCanvasClip: useCallback((clipId: string | null) => {
      setSelectedCanvasClipId(clipId);
    }, []),

    addTrack: useCallback((type: Track['type']) => {
      // Count existing tracks of this type to generate name
      const existingTracksOfType = project.timeline.filter((t) => t.type === type);
      const trackNumber = existingTracksOfType.length + 1;
      const trackName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackNumber}`;
      
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        type,
        clips: [],
        name: trackName,
        locked: false,
        muted: false,
        hidden: false,
      };
      setProject((prev) => ({
        ...prev,
        timeline: [...prev.timeline, newTrack],
      }));
    }, [project]),

    removeTrack: useCallback((trackId: string) => {
      setProject((prev) => ({
        ...prev,
        timeline: prev.timeline.filter((track) => track.id !== trackId),
      }));
    }, []),

    updateProject,
    undo,
    redo,
  };

  const state: EditorState = {
    project,
    selectedClipIds,
    selectedCanvasClipId,
    zoom,
    isPlaying,
    history,
    historyIndex,
    maxHistorySize: MAX_HISTORY_SIZE,
  };

  return { state, actions };
}

