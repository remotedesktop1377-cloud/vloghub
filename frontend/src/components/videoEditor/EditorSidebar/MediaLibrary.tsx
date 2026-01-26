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
import CollectionsIcon from '@mui/icons-material/Collections';
import MovieIcon from '@mui/icons-material/Movie';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
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
      
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.95rem' }}>
        Media Library
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
        Drag media to timeline or upload new files
      </Typography>

      {/* Upload Button */}
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        component="label"
        fullWidth
        disabled={uploading}
        sx={{
          mb: 2,
          textTransform: 'none',
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
          color: 'white',
          fontWeight: 600,
          py: 1.2,
          boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
            boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }}
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
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip
          icon={<FolderOpenIcon sx={{ fontSize: '16px !important' }} />}
          label="All"
          size="small"
          onClick={() => setFilterType('all')}
          sx={{
            fontWeight: filterType === 'all' ? 600 : 400,
            bgcolor: filterType === 'all' ? 'primary.main' : 'transparent',
            color: filterType === 'all' ? 'white' : 'text.primary',
            border: filterType === 'all' ? 'none' : '1px solid',
            borderColor: 'divider',
            '&:hover': {
              bgcolor: filterType === 'all' ? 'primary.dark' : 'action.hover',
            },
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
        />
        <Chip
          icon={<CollectionsIcon sx={{ fontSize: '16px !important' }} />}
          label="Images"
          size="small"
          onClick={() => setFilterType('image')}
          sx={{
            fontWeight: filterType === 'image' ? 600 : 400,
            bgcolor: filterType === 'image' ? 'primary.main' : 'transparent',
            color: filterType === 'image' ? 'white' : 'text.primary',
            border: filterType === 'image' ? 'none' : '1px solid',
            borderColor: 'divider',
            '&:hover': {
              bgcolor: filterType === 'image' ? 'primary.dark' : 'action.hover',
            },
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
        />
        <Chip
          icon={<MovieIcon sx={{ fontSize: '16px !important' }} />}
          label="Videos"
          size="small"
          onClick={() => setFilterType('video')}
          sx={{
            fontWeight: filterType === 'video' ? 600 : 400,
            bgcolor: filterType === 'video' ? 'primary.main' : 'transparent',
            color: filterType === 'video' ? 'white' : 'text.primary',
            border: filterType === 'video' ? 'none' : '1px solid',
            borderColor: 'divider',
            '&:hover': {
              bgcolor: filterType === 'video' ? 'primary.dark' : 'action.hover',
            },
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
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
              p: 4,
              textAlign: 'center',
              bgcolor: 'action.hover',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              transition: 'all 0.3s ease',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {mediaItems.length === 0 ? (
                <>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.1,
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      No media uploaded yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload images or videos to get started
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      No matches found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or filter
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        ) : (
          <Grid container spacing={1.5}>
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
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-2px)',
          '& .media-delete-btn': {
            opacity: 1,
          },
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
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
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

        {/* Overlay gradient on hover */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '&:hover': {
              opacity: 1,
            },
          }}
        />

        {/* Type Badge */}
        <Chip
          label={item.type === 'video' ? 'Video' : 'Image'}
          size="small"
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            fontSize: '0.7rem',
            height: 22,
            fontWeight: 600,
            bgcolor: item.type === 'video' ? 'primary.main' : 'secondary.main',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />

        {/* Duration (for videos) */}
        {item.type === 'video' && item.duration && (
          <Chip
            label={`${Math.floor(item.duration)}s`}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              fontSize: '0.7rem',
              height: 22,
              fontWeight: 600,
              bgcolor: 'rgba(0, 0, 0, 0.75)',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
        )}

        {/* Delete Button - Reveal on hover */}
        <Tooltip title="Delete media">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="media-delete-btn"
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              opacity: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
                transform: 'scale(1.1)',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Name */}
      <Box sx={{ p: 1, minHeight: 40 }}>
        <Tooltip title={item.name} arrow>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              fontSize: '0.75rem',
              lineHeight: 1.4,
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

