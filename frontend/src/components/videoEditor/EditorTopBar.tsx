'use client';

import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Slider,
  ButtonGroup,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PreviewIcon from '@mui/icons-material/Preview';
import GetAppIcon from '@mui/icons-material/GetApp';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';

interface EditorTopBarProps {
  onSave: () => void;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  playheadTime: number;
  totalDuration: number;
  isSaving?: boolean;
  onFitToTimeline?: () => void;
  onZoomToSelection?: () => void;
  hasSelection?: boolean;
}

const EditorTopBar: React.FC<EditorTopBarProps> = ({
  onSave,
  onClose,
  isPlaying,
  onTogglePlay,
  zoom,
  onZoomChange,
  playheadTime,
  totalDuration,
  isSaving = false,
  onFitToTimeline,
  onZoomToSelection,
  hasSelection = false,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <Toolbar
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: '64px !important',
        px: 2,
      }}
    >
      <Typography variant="h6" sx={{ flexGrow: 0, mr: 3, fontWeight: 600 }}>
        Video Editor
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
          <IconButton
            onClick={onTogglePlay}
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>

        {/* Time Display */}
        <Typography variant="body2" sx={{ minWidth: 80, fontFamily: 'monospace' }}>
          {formatTime(playheadTime)} / {formatTime(totalDuration)}
        </Typography>

        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 350 }}>
          <IconButton
            size="small"
            onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
            disabled={zoom <= 0.1}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <Slider
            value={zoom}
            onChange={(_, value) => onZoomChange(value as number)}
            min={0.1}
            max={10}
            step={0.1}
            sx={{ width: 120 }}
            size="small"
          />
          <IconButton
            size="small"
            onClick={() => onZoomChange(Math.min(10, zoom + 0.1))}
            disabled={zoom >= 10}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          
          {/* Zoom Presets */}
          <ButtonGroup size="small" variant="outlined" sx={{ ml: 1 }}>
            <Tooltip title="Fit to Timeline">
              <Button onClick={onFitToTimeline} disabled={!onFitToTimeline}>
                Fit
              </Button>
            </Tooltip>
            <Button onClick={() => onZoomChange(0.25)}>25%</Button>
            <Button onClick={() => onZoomChange(0.5)}>50%</Button>
            <Button onClick={() => onZoomChange(1)}>100%</Button>
            <Button onClick={() => onZoomChange(2)}>200%</Button>
            <Button onClick={() => onZoomChange(4)}>400%</Button>
          </ButtonGroup>
          
          {/* Zoom to Selection */}
          {onZoomToSelection && (
            <Tooltip title="Zoom to Selection">
              <IconButton
                size="small"
                onClick={onZoomToSelection}
                disabled={!hasSelection}
              >
                <FitScreenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Preview video (Coming soon)">
          <span>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => {
                // TODO: Implement preview
                console.log('Preview clicked');
              }}
              disabled
              sx={{ textTransform: 'none' }}
            >
              Preview
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Export video (Coming soon)">
          <span>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={() => {
                // TODO: Implement export
                console.log('Export clicked');
              }}
              disabled
              sx={{ textTransform: 'none' }}
            >
              Export
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={isSaving ? 'Saving project...' : 'Save project (Ctrl/Cmd + S)'}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={isSaving}
            sx={{ textTransform: 'none' }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Tooltip>
        <Tooltip title="Close editor">
          <IconButton onClick={onClose} color="inherit">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>
  );
};

export default EditorTopBar;

