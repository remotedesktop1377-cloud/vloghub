'use client';

import React from 'react';
import { Box } from '@mui/material';
import { EditorProject } from '@/types/videoEditor';

interface SafeAreaGuidesProps {
  visible: boolean;
  containerWidth: number;
  containerHeight: number;
  aspectRatio: EditorProject['aspectRatio'];
}

const SafeAreaGuides: React.FC<SafeAreaGuidesProps> = ({
  visible,
  containerWidth,
  containerHeight,
  aspectRatio,
}) => {
  if (!visible) return null;

  // Calculate safe area dimensions
  // Action safe area: 90% of canvas
  // Title safe area: 80% of canvas
  const actionSafeArea = 0.9;
  const titleSafeArea = 0.8;

  const actionWidth = containerWidth * actionSafeArea;
  const actionHeight = containerHeight * actionSafeArea;
  const titleWidth = containerWidth * titleSafeArea;
  const titleHeight = containerHeight * titleSafeArea;

  const actionLeft = (containerWidth - actionWidth) / 2;
  const actionTop = (containerHeight - actionHeight) / 2;
  const titleLeft = (containerWidth - titleWidth) / 2;
  const titleTop = (containerHeight - titleHeight) / 2;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {/* Title Safe Area (80%) - Inner rectangle */}
      <Box
        sx={{
          position: 'absolute',
          left: `${titleLeft}px`,
          top: `${titleTop}px`,
          width: `${titleWidth}px`,
          height: `${titleHeight}px`,
          border: '1px dashed',
          borderColor: 'warning.main',
          opacity: 0.6,
        }}
      />
      
      {/* Action Safe Area (90%) - Outer rectangle */}
      <Box
        sx={{
          position: 'absolute',
          left: `${actionLeft}px`,
          top: `${actionTop}px`,
          width: `${actionWidth}px`,
          height: `${actionHeight}px`,
          border: '1px dashed',
          borderColor: 'info.main',
          opacity: 0.6,
        }}
      />
      
      {/* Labels */}
      <Box
        sx={{
          position: 'absolute',
          left: `${titleLeft + 4}px`,
          top: `${titleTop + 4}px`,
          fontSize: '0.75rem',
          color: 'warning.main',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
        }}
      >
        Title Safe (80%)
      </Box>
      
      <Box
        sx={{
          position: 'absolute',
          left: `${actionLeft + 4}px`,
          top: `${actionTop + 4}px`,
          fontSize: '0.75rem',
          color: 'info.main',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
        }}
      >
        Action Safe (90%)
      </Box>
    </Box>
  );
};

export default SafeAreaGuides;

