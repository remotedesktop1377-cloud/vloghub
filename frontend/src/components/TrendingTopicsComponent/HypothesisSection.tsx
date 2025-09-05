'use client';

import React from 'react';
import { Paper, Typography, TextField, Box, Chip, Button, CircularProgress } from '@mui/material';
import { TrendingTopic } from '../../types/TrendingTopics';

interface HypothesisSectionProps {
  selectedTopic: TrendingTopic | null;
  hypothesis: string;
  onHypothesisChange: (hypothesis: string) => void;
}

const HypothesisSection: React.FC<HypothesisSectionProps> = ({
  selectedTopic,
  hypothesis,
  onHypothesisChange,
}) => {
  return (
    <Paper sx={{ p: 1.5, opacity: selectedTopic ? 1 : 0.6 }} data-section="hypothesis">
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
        What’s your unique perspective on this topic?
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Please share your personal angle, insight, or viewpoint here..."
        value={hypothesis}
        disabled={!selectedTopic}
        onChange={(e) => onHypothesisChange(e.target.value)}
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '1.25rem'
          }
        }}
        size="small"
      />
    </Paper>
  );
};

export default HypothesisSection; 