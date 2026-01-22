'use client';

import React from 'react';
import { Box } from '@mui/material';

interface PlayheadProps {
  playheadTime: number;
  totalDuration: number;
  zoom: number;
}

const Playhead: React.FC<PlayheadProps> = ({
  playheadTime,
  totalDuration,
  zoom,
}) => {
  const pixelsPerSecond = 50 * zoom;
  const playheadPosition = playheadTime * pixelsPerSecond;
  
  // Ensure playhead is visible even when scrolled
  const playheadStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${playheadPosition}px`,
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#f44336',
    zIndex: 10,
    pointerEvents: 'none',
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${playheadPosition}px`,
        top: 0,
        bottom: 0,
        width: '2px',
        bgcolor: 'error.main',
        zIndex: 10,
        pointerEvents: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -4,
          left: -4,
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: 'error.main',
        },
        '&::after': {
          content: `"${formatTime(playheadTime)}"`,
          position: 'absolute',
          top: -20,
          left: -30,
          width: 60,
          fontSize: '0.7rem',
          color: 'error.main',
          fontWeight: 600,
          textAlign: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'error.main',
          borderRadius: 1,
          px: 0.5,
          whiteSpace: 'nowrap',
        },
      }}
    />
  );
};

export default Playhead;

