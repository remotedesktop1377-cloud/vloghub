'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { EditorProject, EditorState, Clip, Track } from '@/types/videoEditor';
import { calculateTotalDuration } from '@/utils/videoEditorUtils';

interface EditorContextValue {
  state: EditorState;
  updateProject: (project: EditorProject) => void;
  setPlayheadTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSelectedClips: (clipIds: string[]) => void;
  addClip: (trackId: string, clip: Clip) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  deleteClip: (clipId: string) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  trimClip: (clipId: string, trimIn: number, trimOut: number) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  duplicateClip: (clipId: string) => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

type EditorAction =
  | { type: 'UPDATE_PROJECT'; payload: EditorProject }
  | { type: 'SET_PLAYHEAD_TIME'; payload: number }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'SET_SELECTED_CLIPS'; payload: string[] }
  | { type: 'ADD_CLIP'; payload: { trackId: string; clip: Clip } }
  | { type: 'UPDATE_CLIP'; payload: { clipId: string; updates: Partial<Clip> } }
  | { type: 'DELETE_CLIP'; payload: string }
  | { type: 'MOVE_CLIP'; payload: { clipId: string; newTrackId: string; newStartTime: number } }
  | { type: 'TRIM_CLIP'; payload: { clipId: string; trimIn: number; trimOut: number } }
  | { type: 'SPLIT_CLIP'; payload: { clipId: string; splitTime: number } }
  | { type: 'DUPLICATE_CLIP'; payload: string }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_TO_HISTORY' };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'UPDATE_PROJECT': {
      const newProject = action.payload;
      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);
      
      return {
        ...state,
        project: newProject,
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'SET_PLAYHEAD_TIME':
      return {
        ...state,
        project: {
          ...state.project,
          playheadTime: Math.max(0, Math.min(action.payload, state.project.totalDuration)),
        },
      };

    case 'SET_IS_PLAYING':
      return {
        ...state,
        isPlaying: action.payload,
      };

    case 'SET_SELECTED_CLIPS':
      return {
        ...state,
        selectedClipIds: action.payload,
      };

    case 'ADD_CLIP': {
      const { trackId, clip } = action.payload;
      const timeline = state.project.timeline.map(track =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, clip].sort((a, b) => a.startTime - b.startTime) }
          : track
      );
      
      const newProject: EditorProject = {
        ...state.project,
        timeline,
        totalDuration: calculateTotalDuration({ ...state.project, timeline }),
      };

      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);

      return {
        ...state,
        project: newProject,
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'UPDATE_CLIP': {
      const { clipId, updates } = action.payload;
      const timeline = state.project.timeline.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      }));

      const newProject: EditorProject = {
        ...state.project,
        timeline,
        totalDuration: calculateTotalDuration({ ...state.project, timeline }),
      };

      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);

      return {
        ...state,
        project: newProject,
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'DELETE_CLIP': {
      const timeline = state.project.timeline.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.id !== action.payload),
      }));

      const newProject: EditorProject = {
        ...state.project,
        timeline,
        totalDuration: calculateTotalDuration({ ...state.project, timeline }),
      };

      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);

      return {
        ...state,
        project: newProject,
        selectedClipIds: state.selectedClipIds.filter(id => id !== action.payload),
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'MOVE_CLIP': {
      const { clipId, newTrackId, newStartTime } = action.payload;
      let movedClip: Clip | null = null;

      // Remove clip from old track
      let timeline = state.project.timeline.map(track => ({
        ...track,
        clips: track.clips.filter(clip => {
          if (clip.id === clipId) {
            movedClip = clip;
            return false;
          }
          return true;
        }),
      }));

      // Add clip to new track
      if (movedClip) {
        timeline = timeline.map(track =>
          track.id === newTrackId
            ? {
                ...track,
                clips: [
                  ...track.clips,
                  { ...movedClip!, startTime: newStartTime },
                ].sort((a, b) => a.startTime - b.startTime),
              }
            : track
        );
      }

      const newProject: EditorProject = {
        ...state.project,
        timeline,
        totalDuration: calculateTotalDuration({ ...state.project, timeline }),
      };

      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);

      return {
        ...state,
        project: newProject,
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'TRIM_CLIP': {
      const { clipId, trimIn, trimOut } = action.payload;
      const timeline = state.project.timeline.map(track => ({
        ...track,
        clips: track.clips.map(clip => {
          if (clip.id === clipId) {
            const newDuration = trimOut - trimIn;
            return {
              ...clip,
              trimIn,
              trimOut,
              duration: Math.max(0.1, newDuration),
            };
          }
          return clip;
        }),
      }));

      const newProject: EditorProject = {
        ...state.project,
        timeline,
        totalDuration: calculateTotalDuration({ ...state.project, timeline }),
      };

      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);

      return {
        ...state,
        project: newProject,
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'SPLIT_CLIP': {
      const { clipId, splitTime } = action.payload;
      let splitClip: Clip | null = null;

      const timeline = state.project.timeline.map(track => ({
        ...track,
        clips: track.clips.flatMap(clip => {
          if (clip.id === clipId) {
            const relativeSplitTime = splitTime - clip.startTime;
            
            if (relativeSplitTime > 0 && relativeSplitTime < clip.duration) {
              const firstPart: Clip = {
                ...clip,
                duration: relativeSplitTime,
                trimOut: clip.trimIn + relativeSplitTime,
              };
              
              const secondPart: Clip = {
                ...clip,
                id: `${clip.id}-split-${Date.now()}`,
                startTime: splitTime,
                duration: clip.duration - relativeSplitTime,
                trimIn: clip.trimIn + relativeSplitTime,
              };

              return [firstPart, secondPart];
            }
          }
          return [clip];
        }),
      }));

      const newProject: EditorProject = {
        ...state.project,
        timeline,
        totalDuration: calculateTotalDuration({ ...state.project, timeline }),
      };

      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);

      return {
        ...state,
        project: newProject,
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'DUPLICATE_CLIP': {
      const clipToDuplicate = state.project.timeline
        .flatMap(track => track.clips)
        .find(clip => clip.id === action.payload);

      if (!clipToDuplicate) return state;

      const duplicatedClip: Clip = {
        ...clipToDuplicate,
        id: `${clipToDuplicate.id}-copy-${Date.now()}`,
        startTime: clipToDuplicate.startTime + clipToDuplicate.duration,
      };

      const timeline = state.project.timeline.map(track =>
        track.clips.some(c => c.id === action.payload)
          ? {
              ...track,
              clips: [...track.clips, duplicatedClip].sort((a, b) => a.startTime - b.startTime),
            }
          : track
      );

      const newProject: EditorProject = {
        ...state.project,
        timeline,
        totalDuration: calculateTotalDuration({ ...state.project, timeline }),
      };

      const history = [...state.history.slice(0, state.historyIndex + 1), newProject];
      const historyIndex = Math.min(history.length - 1, state.maxHistorySize - 1);

      return {
        ...state,
        project: newProject,
        history: history.slice(-state.maxHistorySize),
        historyIndex,
      };
    }

    case 'SET_ZOOM':
      return {
        ...state,
        zoom: Math.max(0.1, Math.min(10, action.payload)),
      };

    case 'UNDO': {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          ...state,
          project: state.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return state;
    }

    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          ...state,
          project: state.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return state;
    }

    default:
      return state;
  }
}

interface EditorProviderProps {
  initialProject: EditorProject;
  children: React.ReactNode;
}

export function EditorProvider({ initialProject, children }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    project: initialProject,
    selectedClipIds: [],
    zoom: 1,
    isPlaying: false,
    history: [initialProject],
    historyIndex: 0,
    maxHistorySize: 50,
  });

  const updateProject = useCallback((project: EditorProject) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: project });
  }, []);

  const setPlayheadTime = useCallback((time: number) => {
    dispatch({ type: 'SET_PLAYHEAD_TIME', payload: time });
  }, []);

  const setIsPlaying = useCallback((isPlaying: boolean) => {
    dispatch({ type: 'SET_IS_PLAYING', payload: isPlaying });
  }, []);

  const setSelectedClips = useCallback((clipIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_CLIPS', payload: clipIds });
  }, []);

  const addClip = useCallback((trackId: string, clip: Clip) => {
    dispatch({ type: 'ADD_CLIP', payload: { trackId, clip } });
  }, []);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    dispatch({ type: 'UPDATE_CLIP', payload: { clipId, updates } });
  }, []);

  const deleteClip = useCallback((clipId: string) => {
    dispatch({ type: 'DELETE_CLIP', payload: clipId });
  }, []);

  const moveClip = useCallback((clipId: string, newTrackId: string, newStartTime: number) => {
    dispatch({ type: 'MOVE_CLIP', payload: { clipId, newTrackId, newStartTime } });
  }, []);

  const trimClip = useCallback((clipId: string, trimIn: number, trimOut: number) => {
    dispatch({ type: 'TRIM_CLIP', payload: { clipId, trimIn, trimOut } });
  }, []);

  const splitClip = useCallback((clipId: string, splitTime: number) => {
    dispatch({ type: 'SPLIT_CLIP', payload: { clipId, splitTime } });
  }, []);

  const duplicateClip = useCallback((clipId: string) => {
    dispatch({ type: 'DUPLICATE_CLIP', payload: clipId });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const value: EditorContextValue = {
    state,
    updateProject,
    setPlayheadTime,
    setIsPlaying,
    setSelectedClips,
    addClip,
    updateClip,
    deleteClip,
    moveClip,
    trimClip,
    splitClip,
    duplicateClip,
    setZoom,
    undo,
    redo,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}

