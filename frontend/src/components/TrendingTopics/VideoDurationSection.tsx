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
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>
        Video Duration
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.65rem', display: 'block' }}>
        Select the desired length for your generated video content.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ fontSize: '0.7rem' }}>Duration</InputLabel>
          <Select
            value={duration}
            label="Duration"
            onChange={(e) => onDurationChange(e.target.value)}
            sx={{ '& .MuiSelect-select': { fontSize: '0.7rem' } }}
          >
            {durationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.7rem' }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          size="small"
          startIcon={<CutIcon />}
          onClick={onGenerateChapters}
          disabled={!hypothesis.trim() || generatingChapters}
          sx={{
            bgcolor: '#1DA1F2',
            '&:hover': { bgcolor: '#0d8bd9' },
            px: 3,
            py: 0.75,
            fontSize: '0.7rem',
            height: 32
          }}
        >
          {generatingChapters ? 'Generating Chapters...' : 'Generate Chapters'}
        </Button>
      </Box>
    </Paper>
  );
};

export default VideoDurationSection; 