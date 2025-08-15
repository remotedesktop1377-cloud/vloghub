import React from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { ContentCut as CutIcon } from '@mui/icons-material';
import { DurationOption } from '../../data/mockDurationOptions';

interface VideoDurationSectionProps {
  duration: string;
  onDurationChange: (duration: string) => void;
  durationOptions: DurationOption[];
  generatingChapters: boolean;
  onGenerateChapters: () => void;
  hypothesis: string;
}

const VideoDurationSection: React.FC<VideoDurationSectionProps> = ({
  duration,
  onDurationChange,
  durationOptions,
  generatingChapters,
  onGenerateChapters,
  hypothesis,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.8rem' }}>
        Video Duration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select the desired length for your generated video content.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Duration</InputLabel>
          <Select
            value={duration}
            label="Duration"
            onChange={(e) => onDurationChange(e.target.value)}
          >
            {durationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          size="large"
          startIcon={<CutIcon />}
          onClick={onGenerateChapters}
          disabled={!hypothesis.trim() || generatingChapters}
          sx={{
            bgcolor: '#1DA1F2',
            '&:hover': { bgcolor: '#0d8bd9' },
            px: 4,
            py: 1.5
          }}
        >
          {generatingChapters ? 'Generating Chapters...' : 'Generate Chapters'}
        </Button>
      </Box>
    </Paper>
  );
};

export default VideoDurationSection; 