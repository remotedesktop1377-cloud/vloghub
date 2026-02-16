import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TextElement, MediaFile, ActiveElement, ExportConfig } from '../../types/video_editor';
import { ProjectState } from '../../types/video_editor';
import { deleteProject } from './projectsSlice';

export const initialState: ProjectState = {
    id: crypto.randomUUID(),
    projectName: '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    mediaFiles: [],
    textElements: [],
    currentTime: 0,
    isPlaying: false,
    isMuted: false,
    duration: 0,
    zoomLevel: 1,
    timelineZoom: 100,
    enableMarkerTracking: true,
    activeSection: 'media',
    activeElement: null,
    activeElementIndex: 0,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    aspectRatio: '16:9',
    history: [],
    future: [],
    autoRenderRequested: false,
    autoRenderProjectId: '',
    exportSettings: {
        resolution: '480p',
        quality: 'low',
        speed: 'fastest',
        fps: 30,
        format: 'mp4',
        includeSubtitles: false,
    },
};

const calculateTotalDuration = (
    mediaFiles: MediaFile[],
    textElements: TextElement[]
): number => {
    const mediaDurations = mediaFiles.map(v => v.positionEnd);
    const textDurations = textElements.map(v => v.positionEnd);
    return Math.max(0, ...mediaDurations, ...textDurations);
};

// Shallow equality check for arrays
const arraysAreEqual = (a: MediaFile[] | TextElement[], b: MediaFile[] | TextElement[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) return false;
    }
    return true;
};

// Deep equality check for MediaFile arrays (checks key properties)
const mediaFilesAreEqual = (a: MediaFile[], b: MediaFile[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const itemA = a[i];
        const itemB = b[i];
        if (
            itemA.id !== itemB.id ||
            itemA.src !== itemB.src ||
            itemA.positionStart !== itemB.positionStart ||
            itemA.positionEnd !== itemB.positionEnd ||
            itemA.startTime !== itemB.startTime ||
            itemA.endTime !== itemB.endTime ||
            itemA.x !== itemB.x ||
            itemA.y !== itemB.y ||
            itemA.width !== itemB.width ||
            itemA.height !== itemB.height ||
            itemA.opacity !== itemB.opacity ||
            itemA.zIndex !== itemB.zIndex ||
            itemA.playbackSpeed !== itemB.playbackSpeed ||
            itemA.volume !== itemB.volume ||
            itemA.type !== itemB.type
        ) {
            return false;
        }
    }
    return true;
};

const projectStateSlice = createSlice({
    name: 'projectState',
    initialState,
    reducers: {
        setMediaFiles: (state, action: PayloadAction<MediaFile[]>) => {
            // Only update if content actually changed to prevent unnecessary re-renders
            if (!mediaFilesAreEqual(state.mediaFiles, action.payload)) {
                state.mediaFiles = action.payload;
                // Calculate duration based on the last video's end time
                state.duration = calculateTotalDuration(state.mediaFiles, state.textElements);
            }
        },
        setProjectName: (state, action: PayloadAction<string>) => {
            state.projectName = action.payload;
        },
        setProjectId: (state, action: PayloadAction<string>) => {
            state.id = action.payload;
        },
        setProjectCreatedAt: (state, action: PayloadAction<string>) => {
            state.createdAt = action.payload;
        },
        setProjectLastModified: (state, action: PayloadAction<string>) => {
            state.lastModified = action.payload;
        },

        setTextElements: (state, action: PayloadAction<TextElement[]>) => {
            // Only update if content actually changed to prevent unnecessary re-renders
            if (!arraysAreEqual(state.textElements, action.payload)) {
                state.textElements = action.payload;
                state.duration = calculateTotalDuration(state.mediaFiles, state.textElements);
            }
        },
        setCurrentTime: (state, action: PayloadAction<number>) => {
            state.currentTime = action.payload;
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setIsMuted: (state, action: PayloadAction<boolean>) => {
            state.isMuted = action.payload;
        },
        setActiveSection: (state, action: PayloadAction<ActiveElement>) => {
            state.activeSection = action.payload;
        },
        setActiveElement: (state, action: PayloadAction<ActiveElement | null>) => {
            state.activeElement = action.payload;
        },
        setActiveElementIndex: (state, action: PayloadAction<number>) => {
            state.activeElementIndex = action.payload;
        },
        setFilesID: (state, action: PayloadAction<string[]>) => {
            state.filesID = action.payload;
        },
        setExportSettings: (state, action: PayloadAction<ExportConfig>) => {
            state.exportSettings = action.payload;
        },
        setResolution: (state, action: PayloadAction<string>) => {
            state.exportSettings.resolution = action.payload;
        },
        setQuality: (state, action: PayloadAction<string>) => {
            state.exportSettings.quality = action.payload;
        },
        setSpeed: (state, action: PayloadAction<string>) => {
            state.exportSettings.speed = action.payload;
        },
        setFps: (state, action: PayloadAction<number>) => {
            state.exportSettings.fps = action.payload;
        },
        setTimelineZoom: (state, action: PayloadAction<number>) => {
            state.timelineZoom = action.payload;
        },
        setMarkerTrack: (state, action: PayloadAction<boolean>) => {
            state.enableMarkerTracking = action.payload;
        },
        setAutoRenderRequested: (state, action: PayloadAction<boolean>) => {
            state.autoRenderRequested = action.payload;
        },
        setAutoRenderProjectId: (state, action: PayloadAction<string>) => {
            state.autoRenderProjectId = action.payload;
        },
        // Special reducer for rehydrating state from IndexedDB
        rehydrate: (state, action: PayloadAction<ProjectState>) => {
            return { ...state, ...action.payload };
        },
        createNewProject: (state) => {
            return { ...initialState };
        },
    },
});

export const {
    setMediaFiles,
    setTextElements,
    setCurrentTime,
    setProjectName,
    setIsPlaying,
    setFilesID,
    setExportSettings,
    setResolution,
    setQuality,
    setSpeed,
    setFps,
    setMarkerTrack,
    setIsMuted,
    setActiveSection,
    setActiveElement,
    setActiveElementIndex,
    setTimelineZoom,
    rehydrate,
    createNewProject,
    setAutoRenderRequested,
    setAutoRenderProjectId,
} = projectStateSlice.actions;

export default projectStateSlice.reducer; 