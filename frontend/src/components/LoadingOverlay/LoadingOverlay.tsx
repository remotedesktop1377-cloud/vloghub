import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  generatingChapters?: boolean;
  enhancingDetails?: boolean;
  enhancingHypothesis?: boolean;
  imagesLoading?: boolean;
  pickerLoading?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  generatingChapters = false,
  enhancingDetails = false,
  enhancingHypothesis = false,
  imagesLoading = false,
  pickerLoading = false,
}) => {
  const isLoading = generatingChapters || 
                   enhancingDetails || 
                   enhancingHypothesis || 
                   imagesLoading || 
                   pickerLoading;

  if (!isLoading) return null;

  const getLoadingTitle = () => {
    if (generatingChapters) return 'Generating Script';
    if (enhancingDetails) return 'Enhancing Topic Details';
    if (enhancingHypothesis) return 'Enhancing Hypothesis';
    if (imagesLoading) return 'Generating Images';
    if (pickerLoading) return 'Generating Narration Variations';
    return 'Processing...';
  };

  const getLoadingDescription = () => {
    if (generatingChapters) return 'Please wait while AI creates script...';
    if (enhancingDetails) return 'Please wait while AI enhances your topic details...';
    if (enhancingHypothesis) return 'Please wait while AI enhances your hypothesis...';
    if (imagesLoading) return 'Please wait while AI generates creative images...';
    if (pickerLoading) return 'Please wait while AI generates narration variations...';
    return 'Please wait while AI processes your request...';
  };

  return (
    <Box
      className={styles.loadingOverlay}
      onClick={(e) => e.preventDefault()} // Prevent any clicks
      onTouchStart={(e) => e.preventDefault()} // Prevent touch events
      onTouchMove={(e) => e.preventDefault()} // Prevent touch events
      onTouchEnd={(e) => e.preventDefault()} // Prevent touch events
      sx={(theme: Theme) => ({
        '--overlay-bg': theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
        '--overlay-fg': theme.palette.mode === 'dark' ? theme.palette.text.primary : '#111111',
      }) as any}
    >
      <Box className={styles.loadingCard}>
        <CircularProgress
          size={60}
          className={styles.loadingSpinner}
        />
        <Typography
          variant="h6"
          gutterBottom
          className={styles.loadingTitle}
          color="text.primary"
        >
          {getLoadingTitle()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {getLoadingDescription()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This may take a few moments
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingOverlay; 