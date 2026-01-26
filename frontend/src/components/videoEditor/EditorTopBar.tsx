'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  TextField,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface EditorTopBarProps {
  onSave: () => void;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playheadTime: number;
  totalDuration: number;
  isSaving?: boolean;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onExport?: () => void;
}

const EditorTopBar: React.FC<EditorTopBarProps> = ({
  onSave,
  onClose,
  isPlaying,
  onTogglePlay,
  playheadTime,
  totalDuration,
  isSaving = false,
  projectName = 'Untitled video',
  onProjectNameChange,
  onExport,
}) => {
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(projectName);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchor(null);
  };

  const handleExportFormat = (format: string) => {
    if (onExport) {
      onExport();
    }
    handleExportClose();
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (onProjectNameChange && editedName !== projectName) {
      onProjectNameChange(editedName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditedName(projectName);
      setIsEditingName(false);
    }
  };

  return (
    <Toolbar
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: '56px !important',
        px: 2,
        justifyContent: 'space-between',
      }}
    >
      {/* Left Side */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Vloghub
        </Typography>

        {isEditingName ? (
          <TextField
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            size="small"
            autoFocus
            sx={{
              minWidth: 200,
              '& .MuiInputBase-input': {
                py: 0.5,
                fontSize: '0.875rem',
              },
            }}
          />
        ) : (
          <Typography
            variant="body1"
            onClick={() => setIsEditingName(true)}
            sx={{
              cursor: 'text',
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            {projectName}
          </Typography>
        )}

        <Tooltip title="AI Features (Coming soon)">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <AutoAwesomeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Center - Playback Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
          <IconButton
            onClick={onTogglePlay}
            sx={{
              bgcolor: '#9c27b0', // Purple accent
              color: 'white',
              '&:hover': {
                bgcolor: '#7b1fa2',
              },
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>

        <Typography 
          variant="body2" 
          sx={{ 
            minWidth: 120, 
            fontFamily: '"Roboto Mono", "Courier New", monospace', 
            textAlign: 'center',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: 'text.primary',
            fontSize: '0.875rem',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        >
          {formatTime(playheadTime)} / {formatTime(totalDuration)}
        </Typography>
      </Box>

      {/* Right Side */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          endIcon={<ArrowDropDownIcon />}
          startIcon={<GetAppIcon />}
          onClick={handleExportClick}
          sx={{ textTransform: 'none' }}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExportFormat('mp4-1080p')}>MP4 - 1080p</MenuItem>
          <MenuItem onClick={() => handleExportFormat('mp4-720p')}>MP4 - 720p</MenuItem>
          <MenuItem onClick={() => handleExportFormat('mp4-480p')}>MP4 - 480p</MenuItem>
          <Divider />
          <MenuItem onClick={() => handleExportFormat('webm')}>WebM</MenuItem>
        </Menu>

        <Tooltip title="Help & Support">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Text Size / Accessibility">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <TextFieldsIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={isSaving ? 'Saving project...' : 'Save project (Ctrl/Cmd + S)'}>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              bgcolor: '#9c27b0', // Purple accent
              '&:hover': {
                bgcolor: '#7b1fa2',
              },
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Tooltip>

        <Tooltip title="Close editor">
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>
  );
};

export default EditorTopBar;

