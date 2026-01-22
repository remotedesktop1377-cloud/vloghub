'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Tooltip,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { useDraggable } from '@dnd-kit/core';
import { useDropzone } from 'react-dropzone';
import { EditorProject, Clip, Track } from '@/types/videoEditor';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  duration?: number; // For videos, in seconds
  size?: number; // File size in bytes
  uploadedAt: number; // Timestamp
}

interface MediaLibraryProps {
  project: EditorProject;
  playheadTime: number;
  onAddClip: (clip: Clip, trackId: string) => void;
  onAddTrack: (type: Track['type']) => void;
}

const STORAGE_KEY = 'videoEditor_mediaLibrary';

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  project,
  playheadTime,
  onAddClip,
  onAddTrack,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  // Load media from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as MediaItem[];
        setMediaItems(items);
      }
    } catch (error) {
      console.error('Failed to load media library:', error);
    }
  }, []);

  // Save media to localStorage
  const saveMediaItems = useCallback((items: MediaItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setMediaItems(items);
    } catch (error) {
      console.error('Failed to save media library:', error);
    }
  }, []);

  // Generate thumbnail for video
  const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.currentTime = 1; // Seek to 1 second
      
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
    });
  };

  // Get video duration
  const getVideoDuration = (videoUrl: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error('Failed to load video'));
    });
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    setUploading(true);
    const newItems: MediaItem[] = [];

    for (const file of files) {
      try {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        
        // Create object URL
        const url = URL.createObjectURL(file);
        
        let thumbnail: string | undefined;
        let duration: number | undefined;

        if (fileType === 'video') {
          try {
            thumbnail = await generateVideoThumbnail(url);
            duration = await getVideoDuration(url);
          } catch (error) {
            console.warn('Failed to generate thumbnail/duration for video:', error);
          }
        } else {
          // For images, use the file itself as thumbnail
          thumbnail = url;
        }

        const mediaItem: MediaItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url,
          type: fileType,
          thumbnail,
          duration,
          size: file.size,
          uploadedAt: Date.now(),
        };

        newItems.push(mediaItem);
      } catch (error) {
        console.error('Failed to process file:', file.name, error);
      }
    }

    // Add new items to library
    saveMediaItems([...mediaItems, ...newItems]);
    setUploading(false);
  };

  // Delete media item
  const handleDelete = (itemId: string) => {
    const item = mediaItems.find((m) => m.id === itemId);
    if (item) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(item.url);
      if (item.thumbnail && item.thumbnail !== item.url) {
        URL.revokeObjectURL(item.thumbnail);
      }
    }
    const updated = mediaItems.filter((m) => m.id !== itemId);
    saveMediaItems(updated);
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
    },
    multiple: true,
    noClick: true, // Don't open file dialog on click
  });

  // Filter media items
  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  // This function is kept for reference but not used in drag & drop
  // Tracks should be created manually or will be auto-created on drop if needed

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
        Media Library
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drag media to timeline or upload new files
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
          accept="image/*,video/*"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFileUpload(files);
            }
          }}
        />
        {uploading ? 'Uploading...' : 'Upload Media'}
      </Button>

      {/* Search and Filter */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search media..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Filter Chips */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
        <Chip
          label="All"
          size="small"
          onClick={() => setFilterType('all')}
          color={filterType === 'all' ? 'primary' : 'default'}
          variant={filterType === 'all' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Images"
          size="small"
          onClick={() => setFilterType('image')}
          color={filterType === 'image' ? 'primary' : 'default'}
          variant={filterType === 'image' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Videos"
          size="small"
          onClick={() => setFilterType('video')}
          color={filterType === 'video' ? 'primary' : 'default'}
          variant={filterType === 'video' ? 'filled' : 'outlined'}
        />
      </Box>

      {/* Media Grid */}
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
              {mediaItems.length === 0
                ? 'No media uploaded yet. Upload images or videos to get started.'
                : 'No media matches your search.'}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={1}>
            {filteredItems.map((item) => (
              <Grid item xs={6} key={item.id}>
                <MediaItemThumbnail
                  item={item}
                  onDelete={handleDelete}
                  project={project}
                  playheadTime={playheadTime}
                  onAddClip={onAddClip}
                  onAddTrack={onAddTrack}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

// Draggable Media Item Component
interface MediaItemThumbnailProps {
  item: MediaItem;
  onDelete: (id: string) => void;
  project: EditorProject;
  playheadTime: number;
  onAddClip: (clip: Clip, trackId: string) => void;
  onAddTrack: (type: Track['type']) => void;
}

const MediaItemThumbnail: React.FC<MediaItemThumbnailProps> = ({
  item,
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
    id: `media-${item.id}`,
    data: {
      type: 'media',
      mediaItem: item,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        '&:hover': {
          boxShadow: 3,
        },
        ...style,
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          width: '100%',
          aspectRatio: '16/9',
          position: 'relative',
          bgcolor: 'action.hover',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.thumbnail ? (
          <Box
            component="img"
            src={item.thumbnail}
            alt={item.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            {item.type === 'video' ? (
              <VideoLibraryIcon fontSize="large" />
            ) : (
              <ImageIcon fontSize="large" />
            )}
          </Box>
        )}

        {/* Type Badge */}
        <Chip
          label={item.type}
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            fontSize: '0.65rem',
            height: 20,
          }}
          color={item.type === 'video' ? 'primary' : 'secondary'}
        />

        {/* Duration (for videos) */}
        {item.type === 'video' && item.duration && (
          <Chip
            label={`${Math.floor(item.duration)}s`}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              fontSize: '0.65rem',
              height: 20,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
            }}
          />
        )}

        {/* Delete Button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              bgcolor: 'error.main',
              color: 'white',
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Name */}
      <Box sx={{ p: 0.5 }}>
        <Tooltip title={item.name}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </Typography>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default MediaLibrary;

