'use client';

import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

interface PlaybackControlsProps {
  playheadTime: number;
  totalDuration: number;
  onSkipToBeginning?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playheadTime,
  totalDuration,
  onSkipToBeginning,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        bgcolor: 'background.paper',
      }}
    >
      <Tooltip title="Skip to Beginning">
        <IconButton size="small" onClick={onSkipToBeginning}>
          <SkipPreviousIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Undo (Ctrl/Cmd + Z)">
        <span>
          <IconButton size="small" onClick={onUndo} disabled={!canUndo}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Redo (Ctrl/Cmd + Shift + Z)">
        <span>
          <IconButton size="small" onClick={onRedo} disabled={!canRedo}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      <Typography 
        variant="body2" 
        sx={{ 
          fontFamily: '"Roboto Mono", "Courier New", monospace', 
          minWidth: 140, 
          textAlign: 'center',
          fontWeight: 600,
          letterSpacing: '0.5px',
          color: 'text.primary',
          fontSize: '0.9375rem',
          px: 2,
          py: 0.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {formatTime(playheadTime)} / {formatTime(totalDuration)}
      </Typography>
    </Box>
  );
};

export default PlaybackControls;

