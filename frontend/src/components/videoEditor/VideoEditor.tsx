'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { EditorProject, Clip, Track } from '@/types/videoEditor';
import { SceneData } from '@/types/sceneData';
import { useEditorState } from '@/hooks/useEditorState';
import { useTimelineSync } from '@/hooks/useTimelineSync';
import { useClipOperations } from '@/hooks/useClipOperations';
import { useEditorPersistence } from '@/hooks/useEditorPersistence';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { editorProjectToScenesData } from '@/utils/timelineConverter';
import { calculateSnapPosition } from '@/utils/clipSnapping';
import { findTrackEnd, updateProjectDuration, isPlayheadNearEnd } from '@/utils/videoEditorUtils';
import { toast } from 'react-toastify';
import EditorTopBar from './EditorTopBar';
import EditorErrorBoundary from './EditorErrorBoundary';
import EditorSidebar from './EditorSidebar';
import PreviewArea from './PreviewArea';
import PropertiesPanel from './PropertiesPanel';
import TimelineContainer from './Timeline/TimelineContainer';
import ExportDialog from './ExportDialog';

interface VideoEditorProps {
  open: boolean;
  onClose: () => void;
  initialProject?: EditorProject;
  scenesData?: SceneData[];
  narratorVideoUrl?: string;
  jobId?: string;
  userId?: string;
  onSave?: (project: EditorProject, updatedScenes: SceneData[]) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({
  open,
  onClose,
  initialProject,
  scenesData = [],
  narratorVideoUrl,
  jobId,
  userId,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sync with SceneData if provided
  const {
    editorProject: syncedProject,
    setEditorProject,
    syncToScenesData,
  } = useTimelineSync({
    scenesData,
    narratorVideoUrl,
    onScenesDataUpdate: (updatedScenes) => {
      // This will be called when we sync back, but we'll handle save separately
      console.log('Scenes updated from timeline:', updatedScenes);
    },
  });

  // Use synced project if available, otherwise use initial project
  const projectToUse = syncedProject || initialProject;
  const { state, actions } = useEditorState(projectToUse);
  const { deleteClip, duplicateClip, splitClip, moveClip, trimClip } = useClipOperations();

  // Persistence hook
  const { save: saveProject, isSaving } = useEditorPersistence({
    project: state.project,
    jobId,
    userId,
    autoSaveEnabled: true,
    autoSaveInterval: 30000, // 30 seconds
    onSaveSuccess: () => {
      console.log('Auto-save successful');
    },
    onSaveError: (error) => {
      console.error('Auto-save error:', error);
    },
  });

  // Trim handlers for keyboard shortcuts
  const handleTrimIn = (clipId: string, time: number) => {
    const clip = state.project.timeline
      .flatMap((t) => t.clips)
      .find((c) => c.id === clipId);
    if (!clip) return;

    const trimIn = clip.trimIn + (time - clip.startTime);
    const newStartTime = time;
    const newDuration = clip.duration - (time - clip.startTime);
    
    if (newDuration > 0.1) {
      const updatedProject = moveClip(state.project, clipId, newStartTime);
      const trimmedProject = trimClip(updatedProject, clipId, trimIn, clip.trimOut, newStartTime, newDuration);
      const updatedWithDuration = updateProjectDuration(trimmedProject);
      actions.updateProject(updatedWithDuration);
    }
  };

  const handleTrimOut = (clipId: string, time: number) => {
    const clip = state.project.timeline
      .flatMap((t) => t.clips)
      .find((c) => c.id === clipId);
    if (!clip) return;

    const newDuration = time - clip.startTime;
    const trimOut = clip.trimOut - (clip.duration - newDuration);
    
    if (newDuration > 0.1) {
      const trimmedProject = trimClip(state.project, clipId, clip.trimIn, trimOut, undefined, newDuration);
      const updatedWithDuration = updateProjectDuration(trimmedProject);
      actions.updateProject(updatedWithDuration);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    state,
    actions,
    enabled: open, // Only enable when editor is open
    onDeleteClips: handleDeleteClips,
    onSplitClip: (clipId, time) => {
      handleSplitClips([clipId], time);
    },
    onTrimIn: handleTrimIn,
    onTrimOut: handleTrimOut,
  });

  // Drag and drop state
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dropPosition, setDropPosition] = useState<{ x: number; trackId?: string } | null>(null);
  const [dragTime, setDragTime] = useState<number | null>(null); // Current drag time position for snap indicators
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Update editor project when synced project changes (only on initial load)
  useEffect(() => {
    if (syncedProject && open) {
      // Only update if the timeline structure is different (initial load)
      const syncedTimelineIds = syncedProject.timeline.map(t => t.id).sort().join(',');
      const currentTimelineIds = state.project.timeline.map(t => t.id).sort().join(',');
      
      if (syncedTimelineIds !== currentTimelineIds || syncedProject.totalDuration !== state.project.totalDuration) {
        actions.updateProject(syncedProject);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedProject, open]);

  const handleClose = () => {
    actions.clearSelection();
    onClose();
  };

  const handleSave = async () => {
    // Validate project before saving
    if (state.project.timeline.length === 0) {
      toast.warning('Cannot save: No tracks in project');
      return;
    }

    if (state.project.totalDuration === 0) {
      toast.warning('Cannot save: Project has no duration');
      return;
    }

    try {
      // Save to persistence (localStorage + Supabase)
      await saveProject(state.project, true);

      // Convert to SceneData and call onSave callback
      if (onSave) {
        let updatedScenes: SceneData[] = [];
        if (scenesData.length > 0) {
          updatedScenes = editorProjectToScenesData(state.project, scenesData);
        }
        onSave(state.project, updatedScenes);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project. Please try again.');
    }
  };

  // Clip operations
  const handleDeleteClips = (clipIds: string[]) => {
    let updatedProject = state.project;
    clipIds.forEach((clipId) => {
      updatedProject = deleteClip(updatedProject, clipId);
    });
    // Update total duration after deletion
    const updatedWithDuration = updateProjectDuration(updatedProject);
    actions.updateProject(updatedWithDuration);
    actions.clearSelection();
  };

  const handleDuplicateClips = (clipIds: string[]) => {
    let updatedProject = state.project;
    clipIds.forEach((clipId) => {
      updatedProject = duplicateClip(updatedProject, clipId);
    });
    // Update total duration after duplication
    const updatedWithDuration = updateProjectDuration(updatedProject);
    actions.updateProject(updatedWithDuration);
  };

  const handleSplitClips = (clipIds: string[], splitTime: number) => {
    let updatedProject = state.project;
    clipIds.forEach((clipId) => {
      updatedProject = splitClip(updatedProject, clipId, splitTime);
    });
    // Update total duration after split (duration shouldn't change, but ensure consistency)
    const updatedWithDuration = updateProjectDuration(updatedProject);
    actions.updateProject(updatedWithDuration);
  };

  // Drag handlers
  const pixelsPerSecond = 50 * state.zoom;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'clip') {
      const clip = active.data.current.clip as Clip;
      setActiveClip(clip);
      setDragOffset(null);
    } else if (active.data.current?.type === 'media' || active.data.current?.type === 'audio') {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (event.delta) {
      setDragOffset({ x: event.delta.x, y: event.delta.y });
    }
    
    // Calculate current drag time for snap indicators
    if (event.active.data.current?.type === 'clip' && activeClip && dragOffset) {
      const deltaSeconds = dragOffset.x / pixelsPerSecond;
      const currentDragTime = Math.max(0, activeClip.startTime + deltaSeconds);
      setDragTime(currentDragTime);
    } else {
      setDragTime(null);
    }
    
    // Track drop position for library items
    if (event.active.data.current?.type === 'media' || event.active.data.current?.type === 'audio') {
      const over = event.over;
      if (over) {
        let trackId: string | undefined;
        if (over.id.toString().startsWith('track-')) {
          trackId = over.id.toString().replace('track-', '');
        } else if (over.data.current?.type === 'track') {
          trackId = over.data.current.trackId;
        }
        
        if (trackId && event.activatorEvent) {
          // Calculate drop position from mouse coordinates
          // This will be refined in handleDragEnd with actual drop coordinates
          const mouseEvent = event.activatorEvent as MouseEvent;
          if (mouseEvent) {
            // Use playhead time as default, will be calculated more accurately in handleDragEnd
            setDropPosition({ x: state.project.playheadTime * pixelsPerSecond, trackId });
          } else {
            setDropPosition({ x: state.project.playheadTime * pixelsPerSecond, trackId });
          }
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const dragType = active.data.current?.type;
    
    // Handle media/audio library drops
    if (dragType === 'media' || dragType === 'audio') {
      setActiveClip(null);
      setDragOffset(null);
      
      if (!over) {
        setDropPosition(null);
        return;
      }
      
      // Get drop target track
      let targetTrackId: string | undefined;
      if (over.id.toString().startsWith('track-')) {
        targetTrackId = over.id.toString().replace('track-', '');
      } else if (over.data.current?.type === 'track') {
        targetTrackId = over.data.current.trackId;
      }
      
      if (!targetTrackId) {
        setDropPosition(null);
        return;
      }
      
      // Find the target track
      const targetTrack = state.project.timeline.find((t) => t.id === targetTrackId);
      if (!targetTrack) {
        console.warn('Target track not found. Please add a track first.');
        setDropPosition(null);
        return;
      }
      
      // Create clip from media/audio item
      let newClip: Clip | null = null;
      
      if (dragType === 'media' && active.data.current) {
        const mediaItem = active.data.current.mediaItem as { id: string; url: string; type: 'image' | 'video'; name: string; duration?: number };
        const mediaType: Clip['mediaType'] = mediaItem.type === 'video' ? 'video' : 'image';
        
        // Ensure we're dropping on the right track type
        const expectedTrackType: Track['type'] = mediaType === 'video' ? 'video' : 'overlay';
        if (targetTrack.type !== expectedTrackType) {
          console.warn(`Cannot drop ${mediaType} on ${targetTrack.type} track`);
          setDropPosition(null);
          return;
        }
        
        // Smart placement logic: ALWAYS auto-append to end for video clips on main video track
        const clipDuration = mediaItem.duration || (mediaType === 'image' ? 5 : 10);
        const existingClips = targetTrack.clips;
        const trackEnd = findTrackEnd(targetTrack);
        const isMainVideoTrack = targetTrack.type === 'video' && mediaType === 'video';
        
        let startTime: number;
        
        // For video clips on main video track, ALWAYS append to end (like CapCut)
        if (isMainVideoTrack) {
          // Auto-append to end of track - this ensures videos are concatenated sequentially
          startTime = trackEnd;
          console.log('Auto-appending video to track end:', { trackEnd, clipDuration, totalDuration: state.project.totalDuration });
        } else {
          // Calculate start time from drop position
          startTime = state.project.playheadTime;
          
          // Try to get actual mouse position from the drag event
          if (event.activatorEvent) {
            const mouseEvent = event.activatorEvent as MouseEvent;
            // Find timeline container element to calculate relative position
            const timelineContainer = document.querySelector('[data-timeline-container]') as HTMLElement;
            if (timelineContainer) {
              const rect = timelineContainer.getBoundingClientRect();
              const relativeX = mouseEvent.clientX - rect.left;
              // Account for scroll position
              const scrollLeft = timelineContainer.scrollLeft || 0;
              const trackHeaderWidth = 200; // Width of track header
              const actualX = relativeX + scrollLeft - trackHeaderWidth;
              startTime = Math.max(0, actualX / pixelsPerSecond);
            }
          } else if (dropPosition?.x !== undefined) {
            startTime = Math.max(0, dropPosition.x / pixelsPerSecond);
          }
          
          // Check for overlaps and adjust position
          // Find if there's an overlap and push forward if needed
          let adjustedStartTime = startTime;
          for (const existingClip of existingClips) {
            if (adjustedStartTime < existingClip.startTime + existingClip.duration && 
                adjustedStartTime + clipDuration > existingClip.startTime) {
              // Overlap detected - push new clip after existing one
              adjustedStartTime = existingClip.startTime + existingClip.duration + 0.1; // 0.1s gap
            }
          }
          
          // Gap detection: if gap > 0.5s, snap to previous clip end
          const sortedClips = [...existingClips].sort((a, b) => a.startTime - b.startTime);
          const previousClip = sortedClips
            .filter(c => c.startTime + c.duration <= adjustedStartTime)
            .sort((a, b) => (b.startTime + b.duration) - (a.startTime + a.duration))[0];
          
          if (previousClip) {
            const gap = adjustedStartTime - (previousClip.startTime + previousClip.duration);
            if (gap > 0.5) {
              // Snap to previous clip end
              adjustedStartTime = previousClip.startTime + previousClip.duration;
            }
          }
          
          startTime = adjustedStartTime;
        }
        
        newClip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mediaId: mediaItem.url,
          mediaType: mediaType,
          startTime: startTime,
          duration: mediaItem.duration || (mediaType === 'image' ? 5 : 10),
          trimIn: 0,
          trimOut: 0,
          properties: {
            volume: 1,
            opacity: 1,
          },
        };
      } else if (dragType === 'audio' && active.data.current) {
        const audioItem = active.data.current.audioItem as { id: string; url: string; name: string; duration?: number };
        
        // Ensure we're dropping on an audio track
        if (targetTrack.type !== 'audio') {
          console.warn('Cannot drop audio on non-audio track');
          setDropPosition(null);
          return;
        }
        
        // Smart placement for audio: auto-append if track is empty or playhead near end
        const clipDuration = audioItem.duration || 10;
        const existingClips = targetTrack.clips;
        const trackEnd = findTrackEnd(targetTrack);
        const shouldAutoAppend = existingClips.length === 0 || 
          isPlayheadNearEnd(state.project.playheadTime, state.project.totalDuration, 0.9);
        
        let startTime: number;
        
        if (shouldAutoAppend) {
          // Auto-append to end of track
          startTime = trackEnd;
        } else {
          // Calculate start time from drop position
          startTime = state.project.playheadTime;
          
          // Try to get actual mouse position from the drag event
          if (event.activatorEvent) {
            const mouseEvent = event.activatorEvent as MouseEvent;
            const timelineContainer = document.querySelector('[data-timeline-container]') as HTMLElement;
            if (timelineContainer) {
              const rect = timelineContainer.getBoundingClientRect();
              const relativeX = mouseEvent.clientX - rect.left;
              const scrollLeft = timelineContainer.scrollLeft || 0;
              const trackHeaderWidth = 200;
              const actualX = relativeX + scrollLeft - trackHeaderWidth;
              startTime = Math.max(0, actualX / pixelsPerSecond);
            }
          } else if (dropPosition?.x !== undefined) {
            startTime = Math.max(0, dropPosition.x / pixelsPerSecond);
          }
          
          // Check for overlaps and adjust position
          let adjustedStartTime = startTime;
          for (const existingClip of existingClips) {
            if (adjustedStartTime < existingClip.startTime + existingClip.duration && 
                adjustedStartTime + clipDuration > existingClip.startTime) {
              adjustedStartTime = existingClip.startTime + existingClip.duration + 0.1;
            }
          }
          
          // Gap detection: if gap > 0.5s, snap to previous clip end
          const sortedClips = [...existingClips].sort((a, b) => a.startTime - b.startTime);
          const previousClip = sortedClips
            .filter(c => c.startTime + c.duration <= adjustedStartTime)
            .sort((a, b) => (b.startTime + b.duration) - (a.startTime + a.duration))[0];
          
          if (previousClip) {
            const gap = adjustedStartTime - (previousClip.startTime + previousClip.duration);
            if (gap > 0.5) {
              adjustedStartTime = previousClip.startTime + previousClip.duration;
            }
          }
          
          startTime = adjustedStartTime;
        }
        
        newClip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mediaId: audioItem.url,
          mediaType: 'audio',
          startTime: startTime,
          duration: clipDuration,
          trimIn: 0,
          trimOut: clipDuration,
          properties: {
            volume: 1,
          },
        };
      }
      
      if (newClip) {
        // Add clip to track using the onAddClip handler
        const updated = {
          ...state.project,
          timeline: state.project.timeline.map((track) =>
            track.id === targetTrackId
              ? {
                  ...track,
                  clips: [...track.clips, newClip!].sort((a, b) => a.startTime - b.startTime),
                }
              : track
          ),
        };
        
        // Update total duration using utility function
        const updatedWithDuration = updateProjectDuration(updated);
        
        actions.updateProject(updatedWithDuration);
        console.log('Clip added from library:', { clipId: newClip.id, trackId: targetTrackId, startTime: newClip.startTime });
      }
      
      setDropPosition(null);
      return;
    }
    
    // Handle existing clip movement
    if (!active.data.current || active.data.current.type !== 'clip') {
      setActiveClip(null);
      setDragOffset(null);
      setDropPosition(null);
      return;
    }

    const clip = active.data.current.clip as Clip;
    const allClips = state.project.timeline.flatMap((track) => track.clips);

    // Get drop target
    let targetTrackId: string | undefined;
    if (over) {
      if (over.id.toString().startsWith('track-')) {
        targetTrackId = over.id.toString().replace('track-', '');
      } else if (over.data.current?.type === 'track') {
        targetTrackId = over.data.current.trackId;
      }
    }

    // Calculate new position from drag offset
    if (dragOffset) {
      const deltaSeconds = dragOffset.x / pixelsPerSecond;
      let newStartTime = Math.max(0, clip.startTime + deltaSeconds);

      // Apply snapping
      const snapResult = calculateSnapPosition(newStartTime, allClips, clip.id, pixelsPerSecond);
      if (snapResult.snapped && snapResult.snapTime !== null) {
        newStartTime = snapResult.snapTime;
      }

      // Update project with moved clip
      const updatedProject = moveClip(state.project, clip.id, newStartTime, targetTrackId);
      // Update total duration after moving clip
      const updatedWithDuration = updateProjectDuration(updatedProject);
      actions.updateProject(updatedWithDuration);
      console.log('Clip moved:', { clipId: clip.id, newStartTime, targetTrackId });
    }

    setActiveClip(null);
    setDragOffset(null);
    setDropPosition(null);
    setDragTime(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          m: 0,
          borderRadius: 0,
          bgcolor: 'background.default',
        },
      }}
    >
      <EditorErrorBoundary onReset={() => window.location.reload()}>
        <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <EditorTopBar
          onSave={handleSave}
          onClose={handleClose}
          isPlaying={state.isPlaying}
          onTogglePlay={actions.togglePlay}
          playheadTime={state.project.playheadTime}
          totalDuration={state.project.totalDuration}
          isSaving={isSaving}
          projectName={state.project.projectName || 'Untitled video'}
          onProjectNameChange={(name) => {
            const updated = {
              ...state.project,
              projectName: name,
            };
            actions.updateProject(updated);
          }}
          onExport={() => {
            setExportDialogOpen(true);
          }}
        />

        {/* Main Editor Layout */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Left Sidebar */}
          <EditorSidebar
            onAddTrack={actions.addTrack}
            onRemoveTrack={actions.removeTrack}
            onToggleTrackLock={(trackId) => {
              const updated = {
                ...state.project,
                timeline: state.project.timeline.map((track) =>
                  track.id === trackId ? { ...track, locked: !track.locked } : track
                ),
              };
              actions.updateProject(updated);
            }}
            onToggleTrackMute={(trackId) => {
              const updated = {
                ...state.project,
                timeline: state.project.timeline.map((track) =>
                  track.id === trackId ? { ...track, muted: !track.muted } : track
                ),
              };
              actions.updateProject(updated);
            }}
            onToggleTrackHide={(trackId) => {
              const updated = {
                ...state.project,
                timeline: state.project.timeline.map((track) =>
                  track.id === trackId ? { ...track, hidden: !track.hidden } : track
                ),
              };
              actions.updateProject(updated);
            }}
            onRenameTrack={(trackId, newName) => {
              const updated = {
                ...state.project,
                timeline: state.project.timeline.map((track) =>
                  track.id === trackId ? { ...track, name: newName } : track
                ),
              };
              actions.updateProject(updated);
            }}
            tracks={state.project.timeline}
            project={state.project}
            playheadTime={state.project.playheadTime}
            onAddTextClip={(clip, trackId) => {
              const updated = {
                ...state.project,
                timeline: state.project.timeline.map((track) =>
                  track.id === trackId
                    ? {
                        ...track,
                        clips: [...track.clips, clip].sort((a, b) => a.startTime - b.startTime),
                      }
                    : track
                ),
              };
              // Update total duration using utility function
              const updatedWithDuration = updateProjectDuration(updated);
              actions.updateProject(updatedWithDuration);
            }}
            onAddClip={(clip, trackId) => {
              // Find the target track
              const targetTrack = state.project.timeline.find((t) => t.id === trackId);
              if (!targetTrack) return;

              // For video clips on main video track, auto-append to end
              const isMainVideoTrack = targetTrack.type === 'video' && clip.mediaType === 'video';
              let clipToAdd = clip;
              
              if (isMainVideoTrack) {
                const trackEnd = findTrackEnd(targetTrack);
                clipToAdd = {
                  ...clip,
                  startTime: trackEnd, // Auto-append to end
                };
                console.log('Auto-appending video via onAddClip:', { trackEnd, clipDuration: clip.duration });
              }

              const updated = {
                ...state.project,
                timeline: state.project.timeline.map((track) =>
                  track.id === trackId
                    ? {
                        ...track,
                        clips: [...track.clips, clipToAdd].sort((a, b) => a.startTime - b.startTime),
                      }
                    : track
                ),
              };
              // Update total duration using utility function
              const updatedWithDuration = updateProjectDuration(updated);
              actions.updateProject(updatedWithDuration);
            }}
          />

          {/* Center: Preview Area */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <PreviewArea
              project={state.project}
              playheadTime={state.project.playheadTime}
              isPlaying={state.isPlaying}
              narratorVideoUrl={narratorVideoUrl}
              onPlayheadChange={actions.setPlayheadTime}
              onProjectUpdate={actions.updateProject}
              selectedCanvasClipId={state.selectedCanvasClipId}
              onCanvasClipSelect={actions.selectCanvasClip}
              onAspectRatioChange={(aspectRatio) => {
                const updated = {
                  ...state.project,
                  aspectRatio,
                };
                actions.updateProject(updated);
              }}
              onSkipToBeginning={() => {
                actions.setPlayheadTime(0);
              }}
              onUndo={actions.undo}
              onRedo={actions.redo}
              canUndo={state.historyIndex > 0}
              canRedo={state.historyIndex < state.history.length - 1}
              onExport={() => {
                setExportDialogOpen(true);
              }}
            />

            {/* Timeline */}
            <Box
              sx={{
                height: '300px',
                borderTop: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <TimelineContainer
                project={state.project}
                zoom={state.zoom}
                playheadTime={state.project.playheadTime}
                selectedClipIds={state.selectedClipIds}
                onPlayheadChange={actions.setPlayheadTime}
                onZoomChange={actions.setZoom}
                onClipSelect={actions.selectClip}
                onClipDeselect={(clipId) => {
                  if (clipId === '') {
                    actions.clearSelection();
                  } else {
                    actions.deselectClip(clipId);
                  }
                }}
                onProjectUpdate={actions.updateProject}
                dragTime={dragTime}
                activeClipId={activeClip?.id}
                onToggleTrackLock={(trackId) => {
                  const updated = {
                    ...state.project,
                    timeline: state.project.timeline.map((track) =>
                      track.id === trackId ? { ...track, locked: !track.locked } : track
                    ),
                  };
                  actions.updateProject(updated);
                }}
                onToggleTrackMute={(trackId) => {
                  const updated = {
                    ...state.project,
                    timeline: state.project.timeline.map((track) =>
                      track.id === trackId ? { ...track, muted: !track.muted } : track
                    ),
                  };
                  actions.updateProject(updated);
                }}
                onToggleTrackHide={(trackId) => {
                  const updated = {
                    ...state.project,
                    timeline: state.project.timeline.map((track) =>
                      track.id === trackId ? { ...track, hidden: !track.hidden } : track
                    ),
                  };
                  actions.updateProject(updated);
                }}
                onDeleteTrack={(trackId) => {
                  actions.removeTrack(trackId);
                }}
                onRenameTrack={(trackId, newName) => {
                  const updated = {
                    ...state.project,
                    timeline: state.project.timeline.map((track) =>
                      track.id === trackId ? { ...track, name: newName } : track
                    ),
                  };
                  actions.updateProject(updated);
                }}
                onDuplicateClip={(clipId) => {
                  handleDuplicateClips([clipId]);
                }}
                onDeleteClip={(clipId) => {
                  handleDeleteClips([clipId]);
                }}
                onSplitClip={(clipId, splitTime) => {
                  handleSplitClips([clipId], splitTime);
                }}
              />
            </Box>
          </Box>

          {/* Right: Properties Panel */}
          <PropertiesPanel
            selectedClipIds={state.selectedClipIds}
            project={state.project}
            playheadTime={state.project.playheadTime}
            onProjectUpdate={actions.updateProject}
            onDeleteClips={handleDeleteClips}
            onDuplicateClips={handleDuplicateClips}
            onSplitClips={handleSplitClips}
          />
        </Box>
        </DndContext>
      </DialogContent>
      </EditorErrorBoundary>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        project={state.project}
        onExport={async (format, quality) => {
          // TODO: Implement actual export functionality
          console.log('Exporting:', { format, quality, project: state.project });
          // This would typically call a backend API or use a video processing library
        }}
      />
    </Dialog>
  );
};

export default VideoEditor;

