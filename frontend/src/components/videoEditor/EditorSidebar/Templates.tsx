'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { EditorProject } from '@/types/videoEditor';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  duration: number;
  category: string;
}

interface TemplatesProps {
  project: EditorProject;
  onApplyTemplate?: (template: Template) => void;
}

const Templates: React.FC<TemplatesProps> = ({ project, onApplyTemplate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load templates from localStorage or API
    const loadTemplates = () => {
      try {
        const stored = localStorage.getItem('videoEditor_templates');
        if (stored) {
          setTemplates(JSON.parse(stored));
        } else {
          // Default templates
          const defaultTemplates: Template[] = [
            {
              id: '1',
              name: 'Social Media Post',
              description: 'Perfect for Instagram and Facebook',
              thumbnail: '',
              duration: 15,
              category: 'social',
            },
            {
              id: '2',
              name: 'Product Showcase',
              description: 'Highlight your products',
              thumbnail: '',
              duration: 30,
              category: 'business',
            },
            {
              id: '3',
              name: 'Tutorial',
              description: 'Step-by-step guide template',
              thumbnail: '',
              duration: 60,
              category: 'education',
            },
          ];
          setTemplates(defaultTemplates);
          localStorage.setItem('videoEditor_templates', JSON.stringify(defaultTemplates));
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  const handleApplyTemplate = (template: Template) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
    } else {
      // Apply template to project
      console.log('Applying template:', template);
      // This would modify the project structure
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Templates
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} key={template.id}>
                <Paper
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box
                    sx={{
                      aspectRatio: '16/9',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 0.5,
                      }}
                    >
                      {template.duration}s
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {template.description}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleApplyTemplate(template)}
                      sx={{ textTransform: 'none' }}
                    >
                      Use Template
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Templates provide pre-made video structures. Apply a template to get started quickly.
        </Typography>
      </Box>
    </Box>
  );
};

export default Templates;

