'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import RectangleIcon from '@mui/icons-material/Rectangle';
import CircleIcon from '@mui/icons-material/Circle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { EditorProject, Clip, Track } from '@/types/videoEditor';

interface GraphicsProps {
  project: EditorProject;
  playheadTime: number;
  onAddClip: (clip: Clip, trackId: string) => void;
  onAddTrack: (type: Track['type']) => void;
}

interface GraphicItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'shape' | 'icon';
}

const Graphics: React.FC<GraphicsProps> = ({
  project,
  playheadTime,
  onAddClip,
  onAddTrack,
}) => {
  const graphics: GraphicItem[] = [
    { id: 'rect', name: 'Rectangle', icon: <RectangleIcon />, type: 'shape' },
    { id: 'circle', name: 'Circle', icon: <CircleIcon />, type: 'shape' },
    { id: 'arrow', name: 'Arrow', icon: <ArrowForwardIcon />, type: 'icon' },
    { id: 'star', name: 'Star', icon: <StarIcon />, type: 'icon' },
    { id: 'heart', name: 'Heart', icon: <FavoriteIcon />, type: 'icon' },
  ];

  const handleAddGraphic = (graphic: GraphicItem) => {
    // Find or create overlay track
    let overlayTrack = project.timeline.find(t => t.type === 'overlay');
    if (!overlayTrack) {
      // Track will be created by parent component
      overlayTrack = {
        id: `track-${Date.now()}`,
        type: 'overlay',
        clips: [],
      };
    }

    // Create a text clip representing the graphic (in a real implementation, this would be a graphic clip)
    const newClip: Clip = {
      id: `graphic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mediaId: graphic.id,
      mediaType: 'text', // Using text type as placeholder for graphics
      startTime: playheadTime,
      duration: 5,
      trimIn: 0,
      trimOut: 0,
      position: { x: 50, y: 50 },
      properties: {
        text: graphic.name,
        fontSize: 48,
        fontColor: '#FFFFFF',
        opacity: 1,
      },
    };

    onAddClip(newClip, overlayTrack.id);
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Graphics
      </Typography>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Grid container spacing={1}>
          {graphics.map((graphic) => (
            <Grid item xs={6} key={graphic.id}>
              <Tooltip title={graphic.name}>
                <Paper
                  onClick={() => handleAddGraphic(graphic)}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    bgcolor: 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      boxShadow: 3,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Box sx={{ color: 'text.primary', fontSize: 48 }}>
                    {graphic.icon}
                  </Box>
                </Paper>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Add shapes and icons to your video. Click to add to timeline at current playhead.
        </Typography>
      </Box>
    </Box>
  );
};

export default Graphics;

