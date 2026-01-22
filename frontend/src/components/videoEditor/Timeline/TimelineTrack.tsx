'use client';

import React, { useMemo, memo, useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  TextField, 
  Tooltip,
  Badge,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useDroppable } from '@dnd-kit/core';
import { Track, EditorProject, Clip } from '@/types/videoEditor';
import TimelineClip from './TimelineClip';

/**
 * Detect overlapping clips and calculate offset adjustments
 */
function detectOverlaps(clips: Clip[]): Map<string, number> {
  const overlaps = new Map<string, number>();
  const sorted = [...clips].sort((a, b) => a.startTime - b.startTime);
  
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const clip1 = sorted[i];
      const clip2 = sorted[j];
      
      // Check if clips overlap
      if (clip1.startTime + clip1.duration > clip2.startTime) {
        // Overlap detected - calculate offset needed
        const overlapAmount = (clip1.startTime + clip1.duration) - clip2.startTime;
        const existingOffset = overlaps.get(clip2.id) || 0;
        // Use maximum offset to push clip2 further right
        overlaps.set(clip2.id, Math.max(existingOffset, overlapAmount + 0.1)); // Add 0.1s gap
      } else {
        break; // No more overlaps possible since clips are sorted
      }
    }
  }
  
  return overlaps;
}

interface TimelineTrackProps {
  track: Track;
  zoom: number;
  totalDuration: number;
  selectedClipIds: string[];
  pixelsPerSecond: number;
  onClipSelect: (clipId: string) => void;
  onClipDeselect: (clipId: string) => void;
  onProjectUpdate: (project: EditorProject) => void;
  onTrimStart?: (clipId: string, newStartTime: number, newDuration: number, newTrimIn: number) => void;
  onTrimEnd?: (clipId: string, newDuration: number, newTrimOut: number) => void;
  onToggleTrackLock?: (trackId: string) => void;
  onToggleTrackMute?: (trackId: string) => void;
  onToggleTrackHide?: (trackId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  onRenameTrack?: (trackId: string, newName: string) => void;
  onDuplicateClip?: (clipId: string) => void;
  onDeleteClip?: (clipId: string) => void;
  onSplitClip?: (clipId: string, splitTime: number) => void;
  playheadTime?: number;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  track,
  zoom,
  totalDuration,
  selectedClipIds,
  pixelsPerSecond,
  onClipSelect,
  onClipDeselect,
  onProjectUpdate,
  onTrimStart,
  onTrimEnd,
  onToggleTrackLock,
  onToggleTrackMute,
  onToggleTrackHide,
  onDeleteTrack,
  onRenameTrack,
  onDuplicateClip,
  onDeleteClip,
  onSplitClip,
  playheadTime = 0,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(track.name || `${track.type.charAt(0).toUpperCase() + track.type.slice(1)} Track`);
  // Memoize track width calculation
  const trackWidth = useMemo(
    () => Math.max(totalDuration * pixelsPerSecond, 1000),
    [totalDuration, pixelsPerSecond]
  );

  const { setNodeRef, isOver } = useDroppable({
    id: `track-${track.id}`,
    data: {
      type: 'track',
      trackId: track.id,
    },
  });

  // Detect overlaps and calculate offsets
  const overlapOffsets = useMemo(() => {
    return detectOverlaps(track.clips);
  }, [track.clips]);

  // Sort clips by startTime to ensure proper rendering order
  const sortedClips = useMemo(() => {
    return [...track.clips].sort((a, b) => a.startTime - b.startTime);
  }, [track.clips]);

  const handleNameSave = () => {
    if (onRenameTrack && editedName.trim()) {
      onRenameTrack(track.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(track.name || `${track.type.charAt(0).toUpperCase() + track.type.slice(1)} Track`);
    setIsEditingName(false);
  };

  const trackDisplayName = track.name || `${track.type.charAt(0).toUpperCase() + track.type.slice(1)} Track`;

  return (
    <Box
      sx={{
        height: 80,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        position: 'relative',
        bgcolor: isOver ? 'action.hover' : 'background.paper',
      }}
    >
      {/* Track Label */}
      <Box
        sx={{
          width: 200,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'action.hover',
        }}
      >
        {/* Track Name and Controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            gap: 0.5,
            minHeight: 32,
          }}
        >
          {isEditingName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
              <TextField
                size="small"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
                }}
                autoFocus
                sx={{ 
                  flex: 1,
                  '& .MuiInputBase-input': {
                    py: 0.5,
                    fontSize: '0.75rem',
                  },
                }}
              />
              <IconButton size="small" onClick={handleNameSave} color="primary">
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleNameCancel}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <>
              <Tooltip title="Click to rename">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flex: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                    px: 0.5,
                    borderRadius: 1,
                  }}
                  onClick={() => setIsEditingName(true)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    {trackDisplayName}
                  </Typography>
                  <EditIcon sx={{ fontSize: '0.875rem', opacity: 0.5 }} />
                </Box>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Track Controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1,
            py: 0.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {onToggleTrackLock && (
              <Tooltip title={track.locked ? 'Unlock track' : 'Lock track'}>
                <IconButton
                  size="small"
                  onClick={() => onToggleTrackLock(track.id)}
                  sx={{ p: 0.5 }}
                >
                  {track.locked ? (
                    <LockIcon sx={{ fontSize: '0.875rem' }} />
                  ) : (
                    <LockOpenIcon sx={{ fontSize: '0.875rem' }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {(track.type === 'audio' || track.type === 'video') && onToggleTrackMute && (
              <Tooltip title={track.muted ? 'Unmute track' : 'Mute track'}>
                <IconButton
                  size="small"
                  onClick={() => onToggleTrackMute(track.id)}
                  sx={{ p: 0.5 }}
                >
                  {track.muted ? (
                    <VolumeOffIcon sx={{ fontSize: '0.875rem' }} />
                  ) : (
                    <VolumeUpIcon sx={{ fontSize: '0.875rem' }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {onToggleTrackHide && (
              <Tooltip title={track.hidden ? 'Show track' : 'Hide track'}>
                <IconButton
                  size="small"
                  onClick={() => onToggleTrackHide(track.id)}
                  sx={{ p: 0.5 }}
                >
                  {track.hidden ? (
                    <VisibilityOffIcon sx={{ fontSize: '0.875rem' }} />
                  ) : (
                    <VisibilityIcon sx={{ fontSize: '0.875rem' }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Badge badgeContent={track.clips.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16 } }}>
            {onDeleteTrack && (
              <Tooltip title="Delete track">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (window.confirm(`Delete "${trackDisplayName}"? This will remove all clips on this track.`)) {
                      onDeleteTrack(track.id);
                    }
                  }}
                  sx={{ p: 0.5 }}
                  color="error"
                >
                  <DeleteIcon sx={{ fontSize: '0.875rem' }} />
                </IconButton>
              </Tooltip>
            )}
          </Badge>
        </Box>
      </Box>

      {/* Track Content */}
      <Box
        ref={setNodeRef}
        className="timeline-track-content"
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${trackWidth}px`,
            height: '100%',
            position: 'relative',
          }}
        >
          {sortedClips.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Drop clips here
              </Typography>
            </Box>
          ) : (
            sortedClips.map((clip) => {
              // Get overlap offset for visual positioning (doesn't modify actual clip data)
              const offset = overlapOffsets.get(clip.id) || 0;

              return (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  track={track}
                  zoom={zoom}
                  pixelsPerSecond={pixelsPerSecond}
                  isSelected={selectedClipIds.includes(clip.id)}
                  onSelect={() => onClipSelect(clip.id)}
                  onDeselect={() => onClipDeselect(clip.id)}
                  onTrimStart={onTrimStart}
                  onTrimEnd={onTrimEnd}
                  overlapOffset={offset}
                  onDuplicate={onDuplicateClip}
                  onDelete={onDeleteClip}
                  onSplit={onSplitClip}
                  playheadTime={playheadTime}
                />
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(TimelineTrack, (prevProps, nextProps) => {
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.track.clips.length === nextProps.track.clips.length &&
    prevProps.track.locked === nextProps.track.locked &&
    prevProps.track.muted === nextProps.track.muted &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.pixelsPerSecond === nextProps.pixelsPerSecond &&
    prevProps.selectedClipIds.length === nextProps.selectedClipIds.length &&
    prevProps.selectedClipIds.every((id, idx) => id === nextProps.selectedClipIds[idx])
  );
});

