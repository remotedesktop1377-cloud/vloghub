'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { Box, Paper, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider, CircularProgress } from '@mui/material';
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
import { generateClipThumbnail } from '@/utils/thumbnailGenerator';
import { getOrGenerateThumbnail, getThumbnailCacheKey } from '@/utils/thumbnailCache';
import { generateWaveformFromBuffer, normalizeWaveform } from '@/utils/waveformGenerator';
import { getOrGenerateWaveform } from '@/utils/waveformCache';

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(clip.thumbnailUrl || null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [waveformLoading, setWaveformLoading] = useState(false);

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

  // Load thumbnail
  useEffect(() => {
    // Only generate thumbnails for video and image clips
    if (clip.mediaType !== 'video' && clip.mediaType !== 'image') {
      return;
    }

    // If thumbnail already exists, use it
    if (clip.thumbnailUrl) {
      setThumbnailUrl(clip.thumbnailUrl);
      return;
    }

    // Generate thumbnail asynchronously
    const loadThumbnail = async () => {
      setThumbnailLoading(true);
      try {
        const thumbnail = await getOrGenerateThumbnail(
          clip,
          () => generateClipThumbnail(clip, clip.startTime || 0)
        );
        if (thumbnail) {
          setThumbnailUrl(thumbnail);
        }
      } catch (error) {
        console.error('Failed to load thumbnail:', error);
      } finally {
        setThumbnailLoading(false);
      }
    };

    // Debounce thumbnail loading
    const timeoutId = setTimeout(loadThumbnail, 300);
    return () => clearTimeout(timeoutId);
  }, [clip.id, clip.mediaId, clip.mediaType, clip.startTime, clip.thumbnailUrl]);

  // Load waveform for audio clips
  useEffect(() => {
    if (clip.mediaType !== 'audio') {
      return;
    }

    const loadWaveform = async () => {
      setWaveformLoading(true);
      try {
        const waveform = await getOrGenerateWaveform(
          clip.mediaId,
          () => generateWaveformFromBuffer(clip.mediaId, Math.max(50, Math.floor(clipWidth / 4)))
        );
        if (waveform && waveform.peaks) {
          const normalized = normalizeWaveform(waveform.peaks);
          setWaveformData(normalized);
        }
      } catch (error) {
        console.error('Failed to load waveform:', error);
      } finally {
        setWaveformLoading(false);
      }
    };

    // Only load waveform if clip is wide enough
    if (clipWidth > 50) {
      const timeoutId = setTimeout(loadWaveform, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [clip.id, clip.mediaId, clip.mediaType, clipWidth]);

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

  // Get clip color based on media type with professional gradients
  const getClipColor = useMemo(() => {
    switch (clip.mediaType) {
      case 'video':
        return {
          bg: isSelected 
            ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)'
            : 'linear-gradient(135deg, #42a5f5 0%, #2196f3 50%, #1976d2 100%)',
          border: isSelected ? '#0d47a1' : '#1565c0',
          hover: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #0277bd 100%)',
          borderHover: '#0277bd',
        };
      case 'image':
        return {
          bg: isSelected 
            ? 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 50%, #4a148c 100%)'
            : 'linear-gradient(135deg, #ba68c8 0%, #ab47bc 50%, #9c27b0 100%)',
          border: isSelected ? '#4a148c' : '#6a1b9a',
          hover: 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 50%, #38006b 100%)',
          borderHover: '#38006b',
        };
      case 'audio':
        return {
          bg: isSelected 
            ? 'linear-gradient(135deg, #388e3c 0%, #2e7d32 50%, #1b5e20 100%)'
            : 'linear-gradient(135deg, #66bb6a 0%, #4caf50 50%, #388e3c 100%)',
          border: isSelected ? '#1b5e20' : '#2e7d32',
          hover: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 50%, #0d4f1a 100%)',
          borderHover: '#0d4f1a',
        };
      case 'text':
        return {
          bg: isSelected 
            ? 'linear-gradient(135deg, #f57c00 0%, #e65100 50%, #bf360c 100%)'
            : 'linear-gradient(135deg, #ffb74d 0%, #ff9800 50%, #f57c00 100%)',
          border: isSelected ? '#bf360c' : '#e65100',
          hover: 'linear-gradient(135deg, #e65100 0%, #bf360c 50%, #a6260a 100%)',
          borderHover: '#a6260a',
        };
      default:
        return {
          bg: isSelected 
            ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)'
            : 'linear-gradient(135deg, #42a5f5 0%, #2196f3 50%, #1976d2 100%)',
          border: isSelected ? '#0d47a1' : '#1565c0',
          hover: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #0277bd 100%)',
          borderHover: '#0277bd',
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
        background: getClipColor.bg,
        color: 'white',
        cursor: isTrimmingStart || isTrimmingEnd ? 'ew-resize' : dndIsDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isSelected ? '3px solid' : '2px solid',
        borderColor: getClipColor.border,
        opacity: dndIsDragging ? 0.6 : 1,
        borderRadius: '4px',
        boxShadow: isSelected 
          ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          : '0 2px 6px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        '&:hover': {
          background: getClipColor.hover,
          borderColor: getClipColor.borderHover || getClipColor.border,
          boxShadow: isSelected 
            ? '0 6px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15) inset'
            : '0 4px 10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          transform: isSelected ? 'scale(1.03)' : 'scale(1.01)',
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
              background: `linear-gradient(90deg, ${getClipColor.border} 0%, ${getClipColor.border}dd 100%)`,
              cursor: 'ew-resize',
              zIndex: 1,
              borderRight: '2px solid',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '4px 0 0 4px',
              transition: 'all 0.15s ease',
              boxShadow: 'inset -2px 0 4px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                width: `${trimHandleWidth + 3}px`,
                background: `linear-gradient(90deg, ${getClipColor.borderHover || getClipColor.border} 0%, ${getClipColor.border}dd 100%)`,
                boxShadow: 'inset -2px 0 6px rgba(0, 0, 0, 0.3), 0 0 8px rgba(0, 0, 0, 0.2)',
              },
              '&:active': {
                width: `${trimHandleWidth + 4}px`,
                boxShadow: 'inset -2px 0 8px rgba(0, 0, 0, 0.4)',
              },
            }}
          />
        </Tooltip>
      )}

      {/* Thumbnail Background */}
      {thumbnailUrl && clipWidth > 40 && clip.mediaType !== 'audio' && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${thumbnailUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.4,
            zIndex: 0,
            borderRadius: '4px',
          }}
        />
      )}
      
      {/* Waveform for Audio Clips */}
      {clip.mediaType === 'audio' && waveformData && clipWidth > 50 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            px: 0.5,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${waveformData.length} 100`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            {waveformData.map((peak, index) => {
              const barHeight = peak * 80; // Max 80% of height
              const x = index;
              const y = 50 - barHeight / 2;
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width="1"
                  height={barHeight}
                  fill="rgba(255, 255, 255, 0.6)"
                />
              );
            })}
          </svg>
        </Box>
      )}
      
      {/* Loading Indicator */}
      {(thumbnailLoading || waveformLoading) && clipWidth > 40 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <CircularProgress size={16} sx={{ color: 'white' }} />
        </Box>
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
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          position: 'relative',
          textShadow: thumbnailUrl ? '0 1px 3px rgba(0, 0, 0, 0.8)' : '0 1px 2px rgba(0, 0, 0, 0.3)',
          transition: 'opacity 0.2s ease',
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
              background: `linear-gradient(90deg, ${getClipColor.border}dd 0%, ${getClipColor.border} 100%)`,
              cursor: 'ew-resize',
              zIndex: 1,
              borderLeft: '2px solid',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '0 4px 4px 0',
              transition: 'all 0.15s ease',
              boxShadow: 'inset 2px 0 4px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                width: `${trimHandleWidth + 3}px`,
                background: `linear-gradient(90deg, ${getClipColor.border}dd 0%, ${getClipColor.borderHover || getClipColor.border} 100%)`,
                boxShadow: 'inset 2px 0 6px rgba(0, 0, 0, 0.3), 0 0 8px rgba(0, 0, 0, 0.2)',
              },
              '&:active': {
                width: `${trimHandleWidth + 4}px`,
                boxShadow: 'inset 2px 0 8px rgba(0, 0, 0, 0.4)',
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

