'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  LinearProgress,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from '@mui/material';
import { EditorProject } from '@/types/videoEditor';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  project: EditorProject;
  onExport: (format: string, quality: string) => Promise<void>;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  project,
  onExport,
}) => {
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onExport(format, quality);
      setProgress(100);
      setTimeout(() => {
        setExporting(false);
        setProgress(0);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
      setProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Video</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Format Selection */}
          <FormControl fullWidth>
            <FormLabel>Format</FormLabel>
            <RadioGroup
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <FormControlLabel value="mp4" control={<Radio />} label="MP4 (Recommended)" />
              <FormControlLabel value="webm" control={<Radio />} label="WebM" />
              <FormControlLabel value="mov" control={<Radio />} label="MOV" />
            </RadioGroup>
          </FormControl>

          {/* Quality Selection */}
          <FormControl fullWidth>
            <InputLabel>Quality</InputLabel>
            <Select
              value={quality}
              label="Quality"
              onChange={(e) => setQuality(e.target.value)}
            >
              <MenuItem value="1080p">1080p (Full HD)</MenuItem>
              <MenuItem value="720p">720p (HD)</MenuItem>
              <MenuItem value="480p">480p (SD)</MenuItem>
              <MenuItem value="360p">360p</MenuItem>
            </Select>
          </FormControl>

          {/* Project Info */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Project: {project.projectName || 'Untitled video'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Duration: {project.totalDuration.toFixed(2)}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aspect Ratio: {project.aspectRatio}
            </Typography>
          </Box>

          {/* Progress */}
          {exporting && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Exporting... {Math.round(progress)}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={exporting}
          sx={{ textTransform: 'none' }}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;

