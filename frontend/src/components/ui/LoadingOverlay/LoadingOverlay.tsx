import React, { useEffect } from 'react';
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

  // Lock down all interactions and scrolling while overlay is mounted
  useEffect(() => {
    const prevent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction as string;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });
    window.addEventListener('keydown', prevent as any, { passive: false });
    window.addEventListener('mousedown', prevent, { passive: false });
    window.addEventListener('mouseup', prevent, { passive: false });
    window.addEventListener('click', prevent, { passive: false });

    return () => {
      window.removeEventListener('wheel', prevent as any);
      window.removeEventListener('touchmove', prevent as any);
      window.removeEventListener('keydown', prevent as any);
      window.removeEventListener('mousedown', prevent as any);
      window.removeEventListener('mouseup', prevent as any);
      window.removeEventListener('click', prevent as any);
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction || '';
    };
  }, []);

  return (
    <Box
      className={styles.loadingOverlay}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <Box className={styles.loadingCard}>
        <CircularProgress
          size={60}
          color='primary'
          className={styles.loadingSpinner}
          sx={{ mb: 4, mt: 4 }}
        />
        <Typography
          variant="h4"
          gutterBottom
          className={styles.loadingTitle}
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 10 }}>
          {desc}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          This may take a few moments
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingOverlay; 