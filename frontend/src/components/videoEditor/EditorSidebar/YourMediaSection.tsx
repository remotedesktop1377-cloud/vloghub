'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import { EditorProject, Clip, Track } from '@/types/videoEditor';
import MediaLibrary from './MediaLibrary';

interface YourMediaSectionProps {
  project: EditorProject;
  playheadTime: number;
  onAddClip: (clip: Clip, trackId: string) => void;
  onAddTrack: (type: Track['type']) => void;
}

const YourMediaSection: React.FC<YourMediaSectionProps> = ({
  project,
  playheadTime,
  onAddClip,
  onAddTrack,
}) => {
  const [showDropZone, setShowDropZone] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileUpload = useCallback((files: File[]) => {
    // Files will be handled by MediaLibrary component
    setShowDropZone(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
    },
    multiple: true,
    noClick: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <input {...getInputProps()} />
      
      {/* Header with Import Button */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Your media
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setShowDropZone(true)}
          sx={{
            bgcolor: '#9c27b0', // Purple accent color
            color: 'white',
            textTransform: 'none',
            px: 2,
            '&:hover': {
              bgcolor: '#7b1fa2',
            },
          }}
        >
          Import media
        </Button>
      </Box>

      {/* Visual Drop Zone */}
      {(showDropZone || isDragActive || dropzoneActive) && (
        <Paper
          sx={{
            m: 2,
            p: 4,
            border: '2px dashed',
            borderColor: isDragActive || dropzoneActive ? 'primary.main' : 'divider',
            bgcolor: isDragActive || dropzoneActive ? 'action.hover' : 'background.paper',
            textAlign: 'center',
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropZone(false);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 3,
              mb: 2,
              opacity: 0.7,
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <MusicNoteIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <ImageIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          
          <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
            Drag & drop media from your device to import
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Videos, audio, images, GIFs
          </Typography>
        </Paper>
      )}

      {/* Media Library */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MediaLibrary
          project={project}
          playheadTime={playheadTime}
          onAddClip={onAddClip}
          onAddTrack={onAddTrack}
        />
      </Box>
    </Box>
  );
};

export default YourMediaSection;

