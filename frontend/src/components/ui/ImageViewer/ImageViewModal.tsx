import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Button,
  ButtonGroup,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as FitToScreenIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  ViewComfy as ThumbnailIcon,
  ViewModule as GridIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';

export type ImageViewMode = 'thumbnail' | 'preview' | 'fullscreen';

interface ImageData {
  url: string;
  name?: string;
  type?: 'generated' | 'uploaded';
  prompt?: string;
}

interface ImageViewModalProps {
  open: boolean;
  onClose: () => void;
  images: ImageData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  viewMode: ImageViewMode;
  onViewModeChange: (mode: ImageViewMode) => void;
  title?: string;
  showNavigation?: boolean;
  showDownload?: boolean;
  showViewModeSelector?: boolean;
}

export const ImageViewModal: React.FC<ImageViewModalProps> = ({
  open,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  viewMode,
  onViewModeChange,
  title = 'Image Viewer',
  showNavigation = true,
  showDownload = true,
  showViewModeSelector = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentImage = images[currentIndex];

  useEffect(() => {
    if (viewMode === 'fullscreen') {
      setZoom(1);
    }
  }, [viewMode]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
      setZoom(1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleFitToScreen = () => {
    setZoom(1);
  };

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage.url;
      link.download = currentImage.name || `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (viewMode !== 'fullscreen') {
      onViewModeChange('fullscreen');
    }
  };

  const getDialogMaxWidth = () => {
    switch (viewMode) {
      case 'thumbnail':
        return 'sm';
      case 'preview':
        return 'md';
      case 'fullscreen':
        return false;
      default:
        return 'md';
    }
  };

  const getImageHeight = () => {
    switch (viewMode) {
      case 'thumbnail':
        return '200px';
      case 'preview':
        return '400px';
      case 'fullscreen':
        return '80vh';
      default:
        return '400px';
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={getDialogMaxWidth()}
      fullWidth={viewMode !== 'fullscreen'}
      fullScreen={viewMode === 'fullscreen' || isFullscreen}
      PaperProps={{
        sx: {
          bgcolor: viewMode === 'fullscreen' ? 'black' : 'background.paper',
          ...(viewMode === 'fullscreen' && {
            m: 0,
            maxHeight: '100vh',
            height: '100vh'
          })
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          ...(viewMode === 'fullscreen' && {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white'
          })
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="span">
            {title}
          </Typography>
          {currentImage.type && (
            <Chip
              label={currentImage.type === 'generated' ? 'AI Generated' : 'Uploaded'}
              size="small"
              color={currentImage.type === 'generated' ? 'primary' : 'default'}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* View Mode Selector */}
          {showViewModeSelector && (
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Thumbnail View">
                <Button
                  onClick={() => onViewModeChange('thumbnail')}
                  variant={viewMode === 'thumbnail' ? 'contained' : 'outlined'}
                >
                  <ThumbnailIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Preview View">
                <Button
                  onClick={() => onViewModeChange('preview')}
                  variant={viewMode === 'preview' ? 'contained' : 'outlined'}
                >
                  <PreviewIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Fullscreen View">
                <Button
                  onClick={() => onViewModeChange('fullscreen')}
                  variant={viewMode === 'fullscreen' ? 'contained' : 'outlined'}
                >
                  <FullscreenIcon fontSize="small" />
                </Button>
              </Tooltip>
            </ButtonGroup>
          )}

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Image Content */}
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          ...(viewMode === 'fullscreen' && {
            bgcolor: 'black',
            height: '100vh',
            pt: '80px' // Account for header
          })
        }}
      >
        {/* Navigation Arrows */}
        {showNavigation && images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              <PrevIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={currentIndex === images.length - 1}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              <NextIcon />
            </IconButton>
          </>
        )}

        {/* Main Image */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: getImageHeight(),
            overflow: 'auto',
            cursor: viewMode === 'fullscreen' ? 'zoom-in' : 'default'
          }}
          onClick={viewMode === 'fullscreen' ? handleZoomIn : undefined}
        >
          <img
            src={currentImage.url}
            alt={currentImage.name || `Image ${currentIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${zoom})`,
              transition: 'transform 0.3s ease',
              cursor: viewMode === 'fullscreen' && zoom > 1 ? 'zoom-out' : 'inherit'
            }}
          />
        </Box>

        {/* Image Info */}
        {currentImage.prompt && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              p: 2,
              maxHeight: '30%',
              overflow: 'auto'
            }}
          >
            <Typography variant="caption" component="p">
              <strong>Prompt:</strong> {currentImage.prompt}
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Footer Controls */}
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          ...(viewMode === 'fullscreen' && {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white'
          })
        }}
      >
        {/* Zoom Controls */}
        {viewMode !== 'thumbnail' && (
          <ButtonGroup size="small" variant="outlined">
            <Tooltip title="Zoom Out">
              <Button onClick={handleZoomOut} disabled={zoom <= 0.1}>
                <ZoomOutIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Fit to Screen">
              <Button onClick={handleFitToScreen}>
                <FitToScreenIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Zoom In">
              <Button onClick={handleZoomIn} disabled={zoom >= 5}>
                <ZoomInIcon fontSize="small" />
              </Button>
            </Tooltip>
          </ButtonGroup>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Image Counter */}
          {images.length > 1 && (
            <Typography variant="body2" color="text.secondary">
              {currentIndex + 1} of {images.length}
            </Typography>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {showDownload && (
              <Tooltip title="Download Image">
                <Button
                  onClick={handleDownload}
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                >
                  Download
                </Button>
              </Tooltip>
            )}
            {!isMobile && (
              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                <Button
                  onClick={toggleFullscreen}
                  variant="outlined"
                  size="small"
                  startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                >
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

