'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useDraggable } from '@dnd-kit/core';
import { useDropzone } from 'react-dropzone';
import { EditorProject, Clip, Track } from '@/types/videoEditor';

export interface AudioItem {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  duration?: number; // In seconds
  size?: number; // File size in bytes
  uploadedAt: number; // Timestamp
}

interface AudioLibraryProps {
  project: EditorProject;
  playheadTime: number;
  onAddClip: (clip: Clip, trackId: string) => void;
  onAddTrack: (type: Track['type']) => void;
}

const STORAGE_KEY = 'videoEditor_audioLibrary';

const AudioLibrary: React.FC<AudioLibraryProps> = ({
  project,
  playheadTime,
  onAddClip,
  onAddTrack,
}) => {
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Load audio from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as AudioItem[];
        setAudioItems(items);
      }
    } catch (error) {
      console.error('Failed to load audio library:', error);
    }
  }, []);

  // Save audio to localStorage
  const saveAudioItems = useCallback((items: AudioItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setAudioItems(items);
    } catch (error) {
      console.error('Failed to save audio library:', error);
    }
  }, []);

  // Get audio duration
  const getAudioDuration = (audioUrl: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.src = audioUrl;
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error('Failed to load audio'));
    });
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    setUploading(true);
    const newItems: AudioItem[] = [];

    for (const file of files) {
      try {
        // Create object URL
        const url = URL.createObjectURL(file);
        
        let duration: number | undefined;
        try {
          duration = await getAudioDuration(url);
        } catch (error) {
          console.warn('Failed to get duration for audio:', error);
        }

        const audioItem: AudioItem = {
          id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url,
          duration,
          size: file.size,
          uploadedAt: Date.now(),
        };

        newItems.push(audioItem);
      } catch (error) {
        console.error('Failed to process audio file:', file.name, error);
      }
    }

    // Add new items to library
    saveAudioItems([...audioItems, ...newItems]);
    setUploading(false);
  };

  // Delete audio item
  const handleDelete = (itemId: string) => {
    const item = audioItems.find((a) => a.id === itemId);
    if (item) {
      // Stop playing if this is the current audio
      if (playingId === itemId && audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        setPlayingId(null);
        setAudioElement(null);
      }
      // Revoke object URL to free memory
      URL.revokeObjectURL(item.url);
    }
    const updated = audioItems.filter((a) => a.id !== itemId);
    saveAudioItems(updated);
  };

  // Play/pause preview
  const handlePlayPause = (item: AudioItem) => {
    if (playingId === item.id && audioElement) {
      // Pause current
      audioElement.pause();
      audioElement.currentTime = 0;
      setPlayingId(null);
      setAudioElement(null);
    } else {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      // Play new audio
      const audio = new Audio(item.url);
      audio.play();
      setPlayingId(item.id);
      setAudioElement(audio);

      audio.onended = () => {
        setPlayingId(null);
        setAudioElement(null);
      };
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.m4a'],
    },
    multiple: true,
    noClick: true,
  });

  // Filter audio items
  const filteredItems = audioItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      {...getRootProps()}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isDragActive ? '2px dashed' : 'none',
        borderColor: isDragActive ? 'primary.main' : 'transparent',
        borderRadius: 1,
        p: isDragActive ? 1 : 0,
      }}
    >
      <input {...getInputProps()} />
      
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Audio Library
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drag audio to timeline or upload new files
      </Typography>

      {/* Upload Button */}
      <Button
        variant="outlined"
        startIcon={<CloudUploadIcon />}
        component="label"
        fullWidth
        sx={{ mb: 2, textTransform: 'none' }}
        disabled={uploading}
      >
        <input
          type="file"
          hidden
          multiple
          accept="audio/*"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFileUpload(files);
            }
          }}
        />
        {uploading ? 'Uploading...' : 'Upload Audio'}
      </Button>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search audio..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Audio List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {uploading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {filteredItems.length === 0 ? (
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              bgcolor: 'action.hover',
              border: '2px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {audioItems.length === 0
                ? 'No audio uploaded yet. Upload music or voiceovers to get started.'
                : 'No audio matches your search.'}
            </Typography>
          </Paper>
        ) : (
          <List dense>
            {filteredItems.map((item) => (
              <AudioItemListItem
                key={item.id}
                item={item}
                isPlaying={playingId === item.id}
                onPlayPause={handlePlayPause}
                onDelete={handleDelete}
                project={project}
                playheadTime={playheadTime}
                onAddClip={onAddClip}
                onAddTrack={onAddTrack}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

// Draggable Audio Item Component
interface AudioItemListItemProps {
  item: AudioItem;
  isPlaying: boolean;
  onPlayPause: (item: AudioItem) => void;
  onDelete: (id: string) => void;
  project: EditorProject;
  playheadTime: number;
  onAddClip: (clip: Clip, trackId: string) => void;
  onAddTrack: (type: Track['type']) => void;
}

const AudioItemListItem: React.FC<AudioItemListItemProps> = ({
  item,
  isPlaying,
  onPlayPause,
  onDelete,
  project,
  playheadTime,
  onAddClip,
  onAddTrack,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `audio-${item.id}`,
    data: {
      type: 'audio',
      audioItem: item,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <ListItem
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        bgcolor: 'background.paper',
        mb: 0.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        ...style,
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause(item);
            }}
          >
            {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      <ListItemIcon>
        <MusicNoteIcon />
      </ListItemIcon>
      <ListItemText
        primary={
          <Tooltip title={item.name}>
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.name}
            </Typography>
          </Tooltip>
        }
        secondary={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
            {item.duration && (
              <Chip
                label={`${Math.floor(item.duration)}s`}
                size="small"
                sx={{ fontSize: '0.65rem', height: 18 }}
              />
            )}
            {item.size && (
              <Typography variant="caption" color="text.secondary">
                {(item.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  );
};

export default AudioLibrary;

