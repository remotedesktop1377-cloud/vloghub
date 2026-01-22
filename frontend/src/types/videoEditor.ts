export interface EditorProject {
  timeline: Track[];
  playheadTime: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  totalDuration: number;
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'overlay';
  clips: Clip[];
  locked?: boolean;
  muted?: boolean;
  name?: string; // Track name (e.g., "Video 1", "Audio 1")
  hidden?: boolean; // Hide track from preview
}

export interface Clip {
  id: string;
  mediaId: string; // URL or reference to media
  mediaType: 'video' | 'image' | 'audio' | 'text';
  startTime: number; // Position on timeline
  duration: number;
  trimIn: number; // Trim start offset
  trimOut: number; // Trim end offset
  position?: { x: number; y: number }; // For overlays
  properties: ClipProperties;
  sceneId?: string; // Link back to original SceneData
}

export interface ClipProperties {
  volume?: number; // 0-1 (0 = silent, 1 = full volume)
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  alignment?: string;
  animation?: 'fadeIn' | 'fadeOut' | 'none';
  // Audio-specific properties
  muted?: boolean; // Clip-level mute
  fadeIn?: number; // Fade-in duration in seconds
  fadeOut?: number; // Fade-out duration in seconds
  loop?: boolean; // Loop audio (for background music)
  audioDetached?: boolean; // Whether audio is detached from video
  detachedAudioClipId?: string; // ID of the detached audio clip (if audio is detached)
}

export interface EditorState {
  project: EditorProject;
  selectedClipIds: string[];
  zoom: number;
  isPlaying: boolean;
  history: EditorProject[];
  historyIndex: number;
  maxHistorySize: number;
}

// Extended types for editor functionality
export interface EditorActions {
  setPlayheadTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  togglePlay: () => void;
  selectClip: (clipId: string) => void;
  deselectClip: (clipId: string) => void;
  selectAllClips: () => void;
  clearSelection: () => void;
  addTrack: (type: Track['type']) => void;
  removeTrack: (trackId: string) => void;
  updateProject: (project: EditorProject) => void;
  undo: () => void;
  redo: () => void;
}

