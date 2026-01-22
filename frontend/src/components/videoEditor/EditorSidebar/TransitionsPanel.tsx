'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Tooltip,
} from '@mui/material';
import { EditorProject } from '@/types/videoEditor';

interface TransitionsPanelProps {
  project: EditorProject;
}

interface Transition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const transitions: Transition[] = [
  {
    id: 'fade',
    name: 'Fade',
    description: 'Smooth fade transition',
    icon: '○',
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    description: 'Cross dissolve between clips',
    icon: '●',
  },
  {
    id: 'wipe-left',
    name: 'Wipe Left',
    description: 'Wipe from right to left',
    icon: '→',
  },
  {
    id: 'wipe-right',
    name: 'Wipe Right',
    description: 'Wipe from left to right',
    icon: '←',
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    description: 'Slide up transition',
    icon: '↑',
  },
  {
    id: 'slide-down',
    name: 'Slide Down',
    description: 'Slide down transition',
    icon: '↓',
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Zoom in effect',
    icon: '🔍',
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    description: 'Zoom out effect',
    icon: '🔍',
  },
];

const TransitionsPanel: React.FC<TransitionsPanelProps> = ({ project }) => {
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null);

  // Note: Transition application logic will be implemented in later phases
  // For now, this is a placeholder UI component

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Transitions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Apply transitions between clips
      </Typography>

      <Paper
        sx={{
          p: 2,
          bgcolor: 'info.light',
          color: 'info.contrastText',
          mb: 2,
        }}
      >
        <Typography variant="caption">
          💡 Transitions can be applied by selecting clips on the timeline and choosing a transition effect in the Properties panel.
        </Typography>
      </Paper>

      {/* Transitions Grid */}
      <Grid container spacing={1}>
        {transitions.map((transition) => (
          <Grid item xs={6} key={transition.id}>
            <Tooltip title={transition.description}>
              <Paper
                onClick={() => setSelectedTransition(transition.id)}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedTransition === transition.id ? '2px solid' : '1px solid',
                  borderColor: selectedTransition === transition.id ? 'primary.main' : 'divider',
                  bgcolor: selectedTransition === transition.id ? 'primary.light' : 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {transition.icon}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {transition.name}
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {selectedTransition && (
        <Paper
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'warning.light',
            color: 'warning.contrastText',
          }}
        >
          <Typography variant="caption">
            ⚠️ To apply a transition, select a clip on the timeline and use the Properties panel to add transition effects.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TransitionsPanel;

