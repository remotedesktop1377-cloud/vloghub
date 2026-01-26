'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  IconButton,
  InputAdornment,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { EditorProject } from '@/types/videoEditor';

interface BrandColor {
  id: string;
  name: string;
  value: string;
}

interface BrandKit {
  id: string;
  name: string;
  logo?: string;
  colors: BrandColor[];
  fonts: string[];
}

interface BrandKitProps {
  project: EditorProject;
  onBrandKitUpdate?: (brandKit: BrandKit) => void;
}

const BrandKit: React.FC<BrandKitProps> = ({ project, onBrandKitUpdate }) => {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    // Load brand kit from localStorage
    const loadBrandKit = () => {
      try {
        const stored = localStorage.getItem('videoEditor_brandKit');
        if (stored) {
          setBrandKit(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load brand kit:', error);
      }
    };

    loadBrandKit();
  }, []);

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      
      const updated = {
        ...brandKit,
        logo: url,
      } as BrandKit;
      
      setBrandKit(updated);
      localStorage.setItem('videoEditor_brandKit', JSON.stringify(updated));
    }
  }, [brandKit]);

  const handleAddColor = () => {
    const newColor: BrandColor = {
      id: `color-${Date.now()}`,
      name: 'New Color',
      value: '#000000',
    };

    const updated = {
      ...brandKit,
      colors: [...(brandKit?.colors || []), newColor],
    } as BrandKit;

    setBrandKit(updated);
    localStorage.setItem('videoEditor_brandKit', JSON.stringify(updated));
  };

  const handleColorChange = (colorId: string, field: 'name' | 'value', newValue: string) => {
    if (!brandKit) return;

    const updated = {
      ...brandKit,
      colors: brandKit.colors.map(c =>
        c.id === colorId ? { ...c, [field]: newValue } : c
      ),
    };

    setBrandKit(updated);
    localStorage.setItem('videoEditor_brandKit', JSON.stringify(updated));
  };

  const handleDeleteColor = (colorId: string) => {
    if (!brandKit) return;

    const updated = {
      ...brandKit,
      colors: brandKit.colors.filter(c => c.id !== colorId),
    };

    setBrandKit(updated);
    localStorage.setItem('videoEditor_brandKit', JSON.stringify(updated));
  };

  if (!brandKit) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Brand Kit
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Create a brand kit to maintain consistency across your videos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            const newBrandKit: BrandKit = {
              id: `brandkit-${Date.now()}`,
              name: 'My Brand',
              colors: [],
              fonts: [],
            };
            setBrandKit(newBrandKit);
            localStorage.setItem('videoEditor_brandKit', JSON.stringify(newBrandKit));
          }}
        >
          Create Brand Kit
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Brand Kit
      </Typography>

      {/* Logo Upload */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Logo
        </Typography>
        {brandKit.logo ? (
          <Box sx={{ position: 'relative', mb: 1 }}>
            <Box
              component="img"
              src={brandKit.logo}
              alt="Brand logo"
              sx={{
                maxWidth: '100%',
                maxHeight: 100,
                objectFit: 'contain',
              }}
            />
            <IconButton
              size="small"
              onClick={() => {
                const updated = { ...brandKit, logo: undefined };
                setBrandKit(updated);
                localStorage.setItem('videoEditor_brandKit', JSON.stringify(updated));
              }}
              sx={{ position: 'absolute', top: 0, right: 0 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ textTransform: 'none' }}
          >
            Upload Logo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </Button>
        )}
      </Paper>

      {/* Brand Colors */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Colors
          </Typography>
          <IconButton size="small" onClick={handleAddColor}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        <Grid container spacing={1}>
          {brandKit.colors.map((color) => (
            <Grid item xs={12} key={color.id}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <input
                  type="color"
                  value={color.value}
                  onChange={(e) => handleColorChange(color.id, 'value', e.target.value)}
                  style={{
                    width: 40,
                    height: 40,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                />
                <TextField
                  size="small"
                  value={color.name}
                  onChange={(e) => handleColorChange(color.id, 'name', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleDeleteColor(color.id)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Brand kit helps maintain consistency. Use these assets across your projects.
        </Typography>
      </Box>
    </Box>
  );
};

export default BrandKit;

