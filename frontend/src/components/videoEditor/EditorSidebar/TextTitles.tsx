'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { EditorProject, Clip, Track } from '@/types/videoEditor';

interface TextTitlesProps {
  project: EditorProject;
  playheadTime: number;
  onAddTextClip: (clip: Clip, trackId: string) => void;
}

const TextTitles: React.FC<TextTitlesProps> = ({
  project,
  playheadTime,
  onAddTextClip,
}) => {
  const [text, setText] = useState('Sample Text');
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [duration, setDuration] = useState(5);
  const [animation, setAnimation] = useState<'none' | 'fadeIn' | 'fadeOut'>('fadeIn');

  // Find or create an overlay track
  const getOrCreateOverlayTrack = (): Track | null => {
    // Find existing overlay track
    let overlayTrack = project.timeline.find((track) => track.type === 'overlay');
    
    // If no overlay track exists, we'll need to create one (but we can't modify project here)
    // So we'll return null and let the parent handle track creation
    if (!overlayTrack) {
      return null;
    }
    
    return overlayTrack;
  };

  const handleAddText = () => {
    const overlayTrack = getOrCreateOverlayTrack();
    
    if (!overlayTrack) {
      // Show message that overlay track is needed
      alert('Please add an Overlay track first from the Tracks section below.');
      return;
    }

    // Create text clip
    const textClip: Clip = {
      id: `text-clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mediaId: `text-${Date.now()}`,
      mediaType: 'text',
      startTime: playheadTime,
      duration: duration,
      trimIn: 0,
      trimOut: 0,
      position: { x: 50, y: 50 }, // Default center position (percentage)
      properties: {
        text: text,
        fontSize: fontSize,
        fontColor: fontColor,
        alignment: alignment,
        animation: animation,
        opacity: 1,
      },
    };

    onAddTextClip(textClip, overlayTrack.id);
    
    // Reset form
    setText('Sample Text');
    setFontSize(48);
    setFontColor('#FFFFFF');
    setAlignment('center');
    setDuration(5);
    setAnimation('fadeIn');
  };

  const presetTemplates = [
    { label: 'Title', text: 'Title', fontSize: 64, color: '#FFFFFF', alignment: 'center' as const },
    { label: 'Subtitle', text: 'Subtitle', fontSize: 36, color: '#FFFFFF', alignment: 'center' as const },
    { label: 'Caption', text: 'Caption', fontSize: 24, color: '#FFFFFF', alignment: 'center' as const },
    { label: 'Lower Third', text: 'Name', fontSize: 32, color: '#FFFFFF', alignment: 'left' as const },
  ];

  const handlePresetClick = (preset: typeof presetTemplates[0]) => {
    setText(preset.text);
    setFontSize(preset.fontSize);
    setFontColor(preset.color);
    setAlignment(preset.alignment);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Text & Titles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add text overlays to your video
      </Typography>

      {/* Preset Templates */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Quick Templates
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {presetTemplates.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              variant="outlined"
              onClick={() => handlePresetClick(preset)}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              {preset.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Text Input */}
      <TextField
        fullWidth
        label="Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        size="small"
        sx={{ mb: 2 }}
        multiline
        rows={2}
      />

      {/* Font Size */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Font Size: {fontSize}px
        </Typography>
        <Slider
          value={fontSize}
          min={12}
          max={120}
          step={1}
          onChange={(_, value) => setFontSize(value as number)}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Font Color */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
          Color:
        </Typography>
        <input
          type="color"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
          style={{
            width: '100%',
            height: 36,
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        />
      </Box>

      {/* Alignment */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Alignment</InputLabel>
        <Select
          value={alignment}
          label="Alignment"
          onChange={(e) => setAlignment(e.target.value as 'left' | 'center' | 'right')}
        >
          <MenuItem value="left">Left</MenuItem>
          <MenuItem value="center">Center</MenuItem>
          <MenuItem value="right">Right</MenuItem>
        </Select>
      </FormControl>

      {/* Duration */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Duration: {duration}s
        </Typography>
        <Slider
          value={duration}
          min={0.5}
          max={30}
          step={0.5}
          onChange={(_, value) => setDuration(value as number)}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Animation */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Animation</InputLabel>
        <Select
          value={animation}
          label="Animation"
          onChange={(e) => setAnimation(e.target.value as 'none' | 'fadeIn' | 'fadeOut')}
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="fadeIn">Fade In</MenuItem>
          <MenuItem value="fadeOut">Fade Out</MenuItem>
        </Select>
      </FormControl>

      {/* Add Button */}
      <Button
        fullWidth
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddText}
        sx={{ textTransform: 'none' }}
      >
        Add Text to Timeline
      </Button>

      {!getOrCreateOverlayTrack() && (
        <Paper
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'warning.light',
            color: 'warning.contrastText',
          }}
        >
          <Typography variant="caption">
            ⚠️ Add an Overlay track from the Tracks section below first.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TextTitles;

