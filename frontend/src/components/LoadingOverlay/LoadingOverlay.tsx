import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  title?: string;
  desc?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  title = '',
  desc = '',
}) => {

  return (
    <Box
      className={styles.loadingOverlay}
      onClick={(e) => e.preventDefault()} // Prevent any clicks
      onTouchStart={(e) => e.preventDefault()} // Prevent touch events
      onTouchMove={(e) => e.preventDefault()} // Prevent touch events
      onTouchEnd={(e) => e.preventDefault()} // Prevent touch events
    >
      <Box className={styles.loadingCard}>
        <CircularProgress
          size={60}
          color='primary'
          className={styles.loadingSpinner}
        />
        <Typography
          variant="h6"
          gutterBottom
          className={styles.loadingTitle}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {desc}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This may take a few moments
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingOverlay; 