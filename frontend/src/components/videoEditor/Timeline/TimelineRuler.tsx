'use client';

import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { formatTime, formatTimeWithFrames, getFrameRate, frameToTime } from '@/utils/videoEditorUtils';
import { EditorProject } from '@/types/videoEditor';

interface TimelineRulerProps {
  totalDuration: number;
  zoom: number;
  playheadTime: number;
  onPlayheadChange: (time: number) => void;
  project?: EditorProject;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalDuration,
  zoom,
  playheadTime,
  onPlayheadChange,
  project,
}) => {
  // Calculate pixels per second based on zoom
  const pixelsPerSecond = 50 * zoom;
  const rulerWidth = Math.max(totalDuration * pixelsPerSecond, 1000);
  const frameRate = getFrameRate(project || {});
  
  // Determine if we should show frame markers (at high zoom)
  const showFrames = zoom > 2;
  const frameDuration = 1 / frameRate;
  
  // Generate markers based on zoom level
  const markers = useMemo(() => {
    if (showFrames) {
      // Show frame markers at high zoom
      const markers: Array<{ time: number; isFrame: boolean; frameNumber?: number }> = [];
      const frameCount = Math.ceil(totalDuration * frameRate);
      
      // Show every 10th frame to avoid clutter
      const frameStep = Math.max(1, Math.floor(10 / zoom));
      for (let frame = 0; frame <= frameCount; frame += frameStep) {
        const time = frameToTime(frame, frameRate);
        if (time <= totalDuration) {
          markers.push({ time, isFrame: true, frameNumber: frame });
        }
      }
      
      // Also show second markers
      for (let i = 0; i <= Math.ceil(totalDuration); i += 1) {
        if (!markers.find(m => Math.abs(m.time - i) < 0.01)) {
          markers.push({ time: i, isFrame: false });
        }
      }
      
      return markers.sort((a, b) => a.time - b.time);
    } else {
      // Show second markers at normal zoom
      const markers: Array<{ time: number; isFrame: boolean }> = [];
      for (let i = 0; i <= Math.ceil(totalDuration); i += 1) {
        markers.push({ time: i, isFrame: false });
      }
      return markers;
    }
  }, [totalDuration, zoom, showFrames, frameRate]);

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
        {markers.map((marker, index) => (
          <Box
            key={`${marker.time}-${marker.isFrame ? 'frame' : 'second'}-${index}`}
            sx={{
              position: 'absolute',
              left: `${marker.time * pixelsPerSecond}px`,
              height: '100%',
              borderLeft: '1px solid',
              borderColor: marker.isFrame ? 'divider' : 'text.secondary',
              borderWidth: marker.isFrame ? '1px' : '2px',
              display: 'flex',
              alignItems: 'flex-start',
              pt: 0.5,
              px: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: marker.isFrame ? '0.65rem' : '0.75rem',
                color: marker.isFrame ? 'text.disabled' : 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {marker.isFrame && marker.frameNumber !== undefined
                ? formatTimeWithFrames(marker.time, frameRate)
                : formatTime(marker.time)}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TimelineRuler;

