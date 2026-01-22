'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { Box, Paper, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SettingsIcon from '@mui/icons-material/Settings';
import { Clip, Track } from '@/types/videoEditor';
import { useDraggable } from '@dnd-kit/core';
import { useAudioEditing } from '@/hooks/useAudioEditing';

interface TimelineClipProps {
  clip: Clip;
  track: Track;
  zoom: number;
  pixelsPerSecond: number;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onTrimStart?: (clipId: string, newStartTime: number, newDuration: number, newTrimIn: number) => void;
  onTrimEnd?: (clipId: string, newDuration: number, newTrimOut: number) => void;
  overlapOffset?: number; // Visual offset to prevent overlapping display
  onDuplicate?: (clipId: string) => void;
  onDelete?: (clipId: string) => void;
  onSplit?: (clipId: string, splitTime: number) => void;
  playheadTime?: number; // Current playhead time for split operation
}

const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  track,
  zoom,
  pixelsPerSecond,
  isSelected,
  onSelect,
  onDeselect,
  onTrimStart,
  onTrimEnd,
  overlapOffset = 0,
  onDuplicate,
  onDelete,
  onSplit,
  playheadTime = 0,
}) => {
  const audioEditing = useAudioEditing();
  
  // Memoize expensive calculations
  const effectiveVolume = useMemo(
    () => audioEditing.getEffectiveVolume(clip, track),
    [clip.properties.volume, clip.properties.muted, track.muted, audioEditing]
  );
  const effectiveMuted = useMemo(
    () => audioEditing.getEffectiveMuted(clip, track),
    [clip.properties.muted, track.muted, audioEditing]
  );
  const hasAudio = useMemo(
    () => clip.mediaType === 'audio' || clip.mediaType === 'video',
    [clip.mediaType]
  );
  const clipWidth = useMemo(
    () => clip.duration * pixelsPerSecond,
    [clip.duration, pixelsPerSecond]
  );
  const clipLeft = useMemo(
    () => (clip.startTime + overlapOffset) * pixelsPerSecond,
    [clip.startTime, pixelsPerSecond, overlapOffset]
  );
  const [isTrimmingStart, setIsTrimmingStart] = useState(false);
  const [isTrimmingEnd, setIsTrimmingEnd] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndIsDragging,
  } = useDraggable({
    id: clip.id,
    data: {
      type: 'clip',
      clip,
    },
    disabled: isTrimmingStart || isTrimmingEnd, // Disable drag when trimming
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't select if clicking on trim handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('trim-handle')) {
      return;
    }

    // Shift+Click for multi-select
    if (e.shiftKey) {
      if (!isSelected) {
        onSelect();
      }
      // If already selected, keep it selected (don't toggle)
      return;
    }

    // Regular click: toggle selection
    if (isSelected) {
      onDeselect();
    } else {
      onSelect();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: e.clientX + 2,
            mouseY: e.clientY - 6,
          }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(clip.id);
    }
    handleCloseContextMenu();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(clip.id);
    }
    handleCloseContextMenu();
  };

  const handleSplit = () => {
    if (onSplit) {
      // Split at playhead if it's within the clip, otherwise split at clip center
      const splitTime = playheadTime >= clip.startTime && playheadTime <= clip.startTime + clip.duration
        ? playheadTime
        : clip.startTime + clip.duration / 2;
      onSplit(clip.id, splitTime);
    }
    handleCloseContextMenu();
  };

  // Trim handle handlers
  const handleTrimStartMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsTrimmingStart(true);
    setDragStartX(e.clientX);
    setDragStartTime(clip.startTime);
  };

  const handleTrimEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsTrimmingEnd(true);
    setDragStartX(e.clientX);
  };

  // Handle mouse move for trimming
  useEffect(() => {
    if (!isTrimmingStart && !isTrimmingEnd) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const deltaSeconds = deltaX / pixelsPerSecond;

      if (isTrimmingStart && onTrimStart) {
        const newStartTime = Math.max(0, dragStartTime + deltaSeconds);
        const timeReduction = newStartTime - dragStartTime;
        const newDuration = Math.max(0.1, clip.duration - timeReduction);
        const newTrimIn = clip.trimIn + timeReduction;
        onTrimStart(clip.id, newStartTime, newDuration, newTrimIn);
      } else if (isTrimmingEnd && onTrimEnd) {
        const durationDelta = deltaSeconds;
        const newDuration = Math.max(0.1, clip.duration + durationDelta);
        const newTrimOut = clip.trimOut - durationDelta;
        onTrimEnd(clip.id, newDuration, newTrimOut);
      }
    };

    const handleMouseUp = () => {
      setIsTrimmingStart(false);
      setIsTrimmingEnd(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTrimmingStart, isTrimmingEnd, dragStartX, dragStartTime, pixelsPerSecond, clip, onTrimStart, onTrimEnd]);

  // Apply drag transform
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, 0, 0)`,
      }
    : undefined;

  // Get clip color based on media type
  const getClipColor = useMemo(() => {
    switch (clip.mediaType) {
      case 'video':
        return {
          bg: isSelected ? 'primary.main' : 'primary.light',
          border: isSelected ? 'primary.dark' : 'primary.main',
          hover: 'primary.dark',
        };
      case 'image':
        return {
          bg: isSelected ? 'secondary.main' : 'secondary.light',
          border: isSelected ? 'secondary.dark' : 'secondary.main',
          hover: 'secondary.dark',
        };
      case 'audio':
        return {
          bg: isSelected ? 'success.main' : 'success.light',
          border: isSelected ? 'success.dark' : 'success.main',
          hover: 'success.dark',
        };
      case 'text':
        return {
          bg: isSelected ? 'warning.main' : 'warning.light',
          border: isSelected ? 'warning.dark' : 'warning.main',
          hover: 'warning.dark',
        };
      default:
        return {
          bg: isSelected ? 'primary.main' : 'primary.light',
          border: isSelected ? 'primary.dark' : 'primary.main',
          hover: 'primary.dark',
        };
    }
  }, [clip.mediaType, isSelected]);

  // Extract filename from mediaId URL
  const clipName = useMemo(() => {
    if (clip.mediaType === 'text') {
      return clip.properties.text || 'Text';
    }
    try {
      const url = new URL(clip.mediaId);
      const pathname = url.pathname;
      const filename = pathname.split('/').pop() || clip.mediaId.split('/').pop() || 'Media';
      return filename.length > 20 ? filename.substring(0, 20) + '...' : filename;
    } catch {
      const parts = clip.mediaId.split('/');
      const filename = parts[parts.length - 1] || 'Media';
      return filename.length > 20 ? filename.substring(0, 20) + '...' : filename;
    }
  }, [clip.mediaId, clip.mediaType, clip.properties.text]);

  // Format duration
  const durationText = useMemo(() => {
    if (clip.duration < 1) {
      return `${Math.round(clip.duration * 10) / 10}s`;
    }
    return `${Math.round(clip.duration * 10) / 10}s`;
  }, [clip.duration]);

  const trimHandleWidth = 8; // Increased from 6 for better visibility
  const minClipWidth = 20; // Minimum visible width

  return (
    <>
    <Paper
      ref={setNodeRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      data-clip={clip.id}
      {...(isTrimmingStart || isTrimmingEnd ? {} : listeners)}
      {...attributes}
      sx={{
        position: 'absolute',
        left: `${clipLeft}px`,
        top: 8,
        width: `${clipWidth}px`,
        minWidth: `${minClipWidth}px`,
        height: 'calc(100% - 16px)',
        bgcolor: getClipColor.bg,
        color: isSelected ? 'primary.contrastText' : 'text.primary',
        cursor: isTrimmingStart || isTrimmingEnd ? 'ew-resize' : dndIsDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isSelected ? '3px solid' : '2px solid',
        borderColor: getClipColor.border,
        opacity: dndIsDragging ? 0.5 : 1,
        boxShadow: isSelected ? '0 0 8px rgba(0, 0, 0, 0.3)' : 'none',
        '&:hover': {
          bgcolor: getClipColor.hover,
          color: 'primary.contrastText',
          boxShadow: isSelected ? '0 0 12px rgba(0, 0, 0, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.2)',
        },
        ...style,
      }}
    >
      {/* Trim Start Handle */}
      {clipWidth > minClipWidth && (
        <Tooltip title={`Trim start: ${clip.startTime.toFixed(2)}s | Duration: ${durationText}`}>
          <Box
            className="trim-handle"
            onMouseDown={handleTrimStartMouseDown}
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${trimHandleWidth}px`,
              height: '100%',
              bgcolor: getClipColor.border,
              cursor: 'ew-resize',
              zIndex: 1,
              borderRight: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: getClipColor.hover,
                width: `${trimHandleWidth + 2}px`,
              },
            }}
          />
        </Tooltip>
      )}

      {/* Clip Content */}
      <Box
        sx={{
          fontSize: '0.7rem',
          fontWeight: 500,
          textAlign: 'center',
          px: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          zIndex: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          position: 'relative',
        }}
      >
        <Tooltip title={clip.mediaType === 'text' ? clip.properties.text || 'Text' : clipName}>
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              fontWeight: 600,
            }}
          >
            {clipName}
          </Box>
        </Tooltip>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.65rem',
            opacity: 0.9,
          }}
        >
          <span>{durationText}</span>
          {hasAudio && (
            <Tooltip title={effectiveMuted ? 'Muted' : `Volume: ${Math.round(effectiveVolume * 100)}%`}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: effectiveMuted ? 0.5 : 1,
                }}
              >
                {effectiveMuted ? (
                  <VolumeOffIcon sx={{ fontSize: '0.75rem' }} />
                ) : effectiveVolume > 0.5 ? (
                  <VolumeUpIcon sx={{ fontSize: '0.75rem' }} />
                ) : effectiveVolume > 0 ? (
                  <VolumeDownIcon sx={{ fontSize: '0.75rem' }} />
                ) : (
                  <VolumeOffIcon sx={{ fontSize: '0.75rem' }} />
                )}
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Trim End Handle */}
      {clipWidth > minClipWidth && (
        <Tooltip title={`Trim end: ${(clip.startTime + clip.duration).toFixed(2)}s | Duration: ${durationText}`}>
          <Box
            className="trim-handle"
            onMouseDown={handleTrimEndMouseDown}
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: `${trimHandleWidth}px`,
              height: '100%',
              bgcolor: getClipColor.border,
              cursor: 'ew-resize',
              zIndex: 1,
              borderLeft: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: getClipColor.hover,
                width: `${trimHandleWidth + 2}px`,
              },
            }}
          />
        </Tooltip>
      )}
    </Paper>
    <Menu
      open={contextMenu !== null}
      onClose={handleCloseContextMenu}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
      }
    >
      <MenuItem onClick={handleDuplicate} disabled={!onDuplicate}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Duplicate</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleSplit} disabled={!onSplit}>
        <ListItemIcon>
          <ContentCutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Split at Playhead</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleDelete} disabled={!onDelete} sx={{ color: 'error.main' }}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
    </Menu>
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(TimelineClip, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.clip.id === nextProps.clip.id &&
    prevProps.clip.startTime === nextProps.clip.startTime &&
    prevProps.clip.duration === nextProps.clip.duration &&
    prevProps.clip.trimIn === nextProps.clip.trimIn &&
    prevProps.clip.trimOut === nextProps.clip.trimOut &&
    prevProps.clip.properties.volume === nextProps.clip.properties.volume &&
    prevProps.clip.properties.muted === nextProps.clip.properties.muted &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.pixelsPerSecond === nextProps.pixelsPerSecond &&
    prevProps.track.muted === nextProps.track.muted &&
    prevProps.track.locked === nextProps.track.locked
  );
});

