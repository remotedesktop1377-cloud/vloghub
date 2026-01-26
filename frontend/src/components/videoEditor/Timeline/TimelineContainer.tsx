'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { Box, Typography } from '@mui/material';
import { EditorProject } from '@/types/videoEditor';
import TimelineRuler from './TimelineRuler';
import TimelineTrack from './TimelineTrack';
import Playhead from './Playhead';
import { useClipOperations } from '@/hooks/useClipOperations';
import { updateProjectDuration } from '@/utils/videoEditorUtils';
import { getSnapPoints, shouldShowSnapIndicator } from '@/utils/clipSnapping';

interface TimelineContainerProps {
  project: EditorProject;
  zoom: number;
  playheadTime: number;
  selectedClipIds: string[];
  onPlayheadChange: (time: number) => void;
  onZoomChange: (zoom: number) => void;
  onClipSelect: (clipId: string) => void;
  onClipDeselect: (clipId: string) => void; // Empty string deselects all
  onProjectUpdate: (project: EditorProject) => void;
  onToggleTrackLock?: (trackId: string) => void;
  onToggleTrackMute?: (trackId: string) => void;
  onToggleTrackHide?: (trackId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  onRenameTrack?: (trackId: string, newName: string) => void;
  onDuplicateClip?: (clipId: string) => void;
  onDeleteClip?: (clipId: string) => void;
  onSplitClip?: (clipId: string, splitTime: number) => void;
  dragTime?: number | null; // Current drag time for snap indicators
  activeClipId?: string; // ID of clip being dragged
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({
  project,
  zoom,
  playheadTime,
  selectedClipIds,
  onPlayheadChange,
  onZoomChange,
  onClipSelect,
  onClipDeselect,
  onProjectUpdate,
  onToggleTrackLock,
  onToggleTrackMute,
  onToggleTrackHide,
  onDeleteTrack,
  onRenameTrack,
  onDuplicateClip,
  onDeleteClip,
  onSplitClip,
  dragTime,
  activeClipId,
}) => {
  // Memoize expensive calculations
  const pixelsPerSecond = useMemo(() => 50 * zoom, [zoom]);
  const timelineWidth = useMemo(
    () => Math.max(project.totalDuration * pixelsPerSecond, 1000),
    [project.totalDuration, pixelsPerSecond]
  );
  const [scrollLeft, setScrollLeft] = React.useState(0);

  // Calculate snap points and indicators
  const allClips = useMemo(() => project.timeline.flatMap(t => t.clips), [project.timeline]);
  const snapPoints = useMemo(() => getSnapPoints(allClips, activeClipId, playheadTime), [allClips, activeClipId, playheadTime]);
  const snapIndicator = useMemo(() => {
    if (dragTime !== null && dragTime !== undefined) {
      return shouldShowSnapIndicator(dragTime, allClips, pixelsPerSecond, activeClipId, playheadTime);
    }
    return null;
  }, [dragTime, allClips, pixelsPerSecond, activeClipId, playheadTime]);

  const { trimClip } = useClipOperations();

  // Sync scroll between ruler and tracks
  const rulerRef = React.useRef<HTMLDivElement>(null);
  const tracksRef = React.useRef<HTMLDivElement>(null);

  const handleRulerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scroll = e.currentTarget.scrollLeft;
    setScrollLeft(scroll);
    if (tracksRef.current) {
      tracksRef.current.scrollLeft = scroll;
    }
  };

  const handleTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scroll = e.currentTarget.scrollLeft;
    setScrollLeft(scroll);
    if (rulerRef.current) {
      rulerRef.current.scrollLeft = scroll;
    }
  };


  // Memoize handlers to prevent unnecessary re-renders
  const handleTrimStart = useCallback((clipId: string, newStartTime: number, newDuration: number, newTrimIn: number) => {
    const updatedProject = trimClip(project, clipId, newTrimIn, 0, newStartTime, newDuration);
    // Update total duration after trimming
    const updatedWithDuration = updateProjectDuration(updatedProject);
    onProjectUpdate(updatedWithDuration);
  }, [project, trimClip, onProjectUpdate]);

  const handleTrimEnd = useCallback((clipId: string, newDuration: number, newTrimOut: number) => {
    const clip = project.timeline
      .flatMap((t) => t.clips)
      .find((c) => c.id === clipId);
    if (!clip) return;

    const updatedProject = trimClip(project, clipId, clip.trimIn, newTrimOut, undefined, newDuration);
    // Update total duration after trimming
    const updatedWithDuration = updateProjectDuration(updatedProject);
    onProjectUpdate(updatedWithDuration);
  }, [project, trimClip, onProjectUpdate]);

  // Auto-scroll to playhead (only when playing)
  React.useEffect(() => {
    // Only auto-scroll if playhead moves significantly
    const playheadPosition = playheadTime * pixelsPerSecond;
    const containerWidth = rulerRef.current?.clientWidth || 0;
    const currentScroll = scrollLeft;
    const margin = containerWidth * 0.2; // 20% margin

    // Scroll if playhead is outside visible area with margin
    if (playheadPosition < currentScroll + margin || playheadPosition > currentScroll + containerWidth - margin) {
      const newScroll = Math.max(0, playheadPosition - containerWidth / 2);
      setScrollLeft(newScroll);
      if (rulerRef.current) rulerRef.current.scrollLeft = newScroll;
      if (tracksRef.current) tracksRef.current.scrollLeft = newScroll;
    }
  }, [playheadTime, zoom, pixelsPerSecond, scrollLeft]);

  // Handle click outside clips to deselect all
  const handleTimelineClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the timeline container (not on clips or tracks)
    const target = e.target as HTMLElement;
    if (target.classList.contains('timeline-track-content') || 
        target.classList.contains('timeline-container') ||
        (target.tagName === 'DIV' && !target.closest('[data-clip]'))) {
      // Check if we're clicking on empty space, not on a clip
      if (!target.closest('[data-clip]') && !target.closest('.MuiPaper-root')) {
        onClipDeselect(''); // Pass empty string to deselect all
      }
    }
  };

  // Handle mouse wheel zoom (Ctrl/Cmd + scroll)
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(10, zoom + delta));
      onZoomChange(newZoom);
    }
  }, [zoom, onZoomChange]);

  return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Timeline Ruler */}
        <Box
          ref={rulerRef}
          onScroll={handleRulerScroll}
          sx={{
            height: 40,
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          <TimelineRuler
            totalDuration={project.totalDuration}
            zoom={zoom}
            playheadTime={playheadTime}
            onPlayheadChange={onPlayheadChange}
            project={project}
          />
          <Playhead
            playheadTime={playheadTime}
            totalDuration={project.totalDuration}
            zoom={zoom}
            project={project}
            showFrames={zoom > 2}
          />
        </Box>

        {/* Snap Overlay - Shows snap lines when dragging */}
        {dragTime !== null && dragTime !== undefined && snapIndicator?.snapped && (
          <Box
            sx={{
              position: 'absolute',
              top: 40,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${(snapIndicator.snapTime || 0) * pixelsPerSecond}px`,
                width: '2px',
                bgcolor: snapIndicator.snapType === 'playhead' 
                  ? 'primary.main' 
                  : snapIndicator.snapType === 'zero'
                  ? 'warning.main'
                  : 'success.main',
                opacity: 0.8,
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
              }}
            />
            {/* Snap distance indicator */}
            {snapIndicator.snapDistance < 50 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 5,
                  left: `${(snapIndicator.snapTime || 0) * pixelsPerSecond + 5}px`,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {((snapIndicator.snapDistance || 0) / pixelsPerSecond).toFixed(2)}s
              </Box>
            )}
          </Box>
        )}

        {/* Tracks */}
        <Box
          ref={tracksRef}
          onScroll={handleTracksScroll}
          onClick={handleTimelineClick}
          onWheel={handleWheel}
          data-timeline-container
          className="timeline-container"
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {project.timeline.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No tracks. Add a track from the sidebar.
              </Typography>
            </Box>
          ) : (
            project.timeline.map((track) => (
              <TimelineTrack
                key={track.id}
                track={track}
                zoom={zoom}
                totalDuration={project.totalDuration}
                selectedClipIds={selectedClipIds}
                pixelsPerSecond={pixelsPerSecond}
                onClipSelect={onClipSelect}
                onClipDeselect={onClipDeselect}
                onProjectUpdate={onProjectUpdate}
                onTrimStart={handleTrimStart}
                onTrimEnd={handleTrimEnd}
                onToggleTrackLock={onToggleTrackLock}
                onToggleTrackMute={onToggleTrackMute}
                onToggleTrackHide={onToggleTrackHide}
                onDeleteTrack={onDeleteTrack}
                onRenameTrack={onRenameTrack}
                onDuplicateClip={onDuplicateClip}
                onDeleteClip={onDeleteClip}
                onSplitClip={onSplitClip}
                playheadTime={playheadTime}
              />
            ))
          )}
        </Box>
      </Box>
  );
};

export default TimelineContainer;

