'use client';

import React from 'react';
import { Box } from '@mui/material';

interface TimelineRulerProps {
  totalDuration: number;
  zoom: number;
  playheadTime: number;
  onPlayheadChange: (time: number) => void;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalDuration,
  zoom,
  playheadTime,
  onPlayheadChange,
}) => {
  // Calculate pixels per second based on zoom
  const pixelsPerSecond = 50 * zoom;
  const rulerWidth = Math.max(totalDuration * pixelsPerSecond, 1000);

  // Generate time markers - show every second
  const markers: number[] = [];
  for (let i = 0; i <= Math.ceil(totalDuration); i += 1) {
    markers.push(i);
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(totalDuration, x / pixelsPerSecond));
    onPlayheadChange(time);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: 'background.default',
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Box
        sx={{
          width: `${rulerWidth}px`,
          height: '100%',
          position: 'relative',
        }}
      >
        {markers.map((time) => (
          <Box
            key={time}
            sx={{
              position: 'absolute',
              left: `${time * pixelsPerSecond}px`,
              height: '100%',
              borderLeft: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'flex-start',
              pt: 0.5,
              px: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {formatTime(time)}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TimelineRuler;

