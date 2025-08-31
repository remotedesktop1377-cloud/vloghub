'use client';

import React from 'react';
import { Paper, Typography, TextField, Box, Chip, Button, CircularProgress } from '@mui/material';
import { TrendingTopic } from '../../types/TrendingTopics';
import { getDirectionSx } from '../../utils/languageUtils';

interface HypothesisSectionProps {
  selectedTopic: TrendingTopic | null;
  selectedTopicDetails: string;
  hypothesis: string;
  hypothesisSuggestions: string[];
  selectedHypothesisSuggestions: string[];
  loadingHypothesisSuggestions: boolean;
  enhancingHypothesis: boolean;
  selectedRegion: string;
  selectedTopicSuggestions: string[];
  language?: string;
  onFetchHypothesisSuggestions: () => void;
  onHypothesisChange: (hypothesis: string) => void;
  onEnhanceHypothesis: (originalText?: string) => void;
  onHypothesisSuggestionsChange: (suggestions: string[]) => void;
  onRestoreHypothesisSuggestions: (suggestions: string[]) => void;
}

const HypothesisSection: React.FC<HypothesisSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  hypothesis,
  hypothesisSuggestions,
  selectedHypothesisSuggestions,
  loadingHypothesisSuggestions,
  enhancingHypothesis,
  selectedRegion,
  selectedTopicSuggestions,
  language = 'english',
  onFetchHypothesisSuggestions,
  onHypothesisChange,
  onEnhanceHypothesis,
  onHypothesisSuggestionsChange,
  onRestoreHypothesisSuggestions,
}) => {
  return (
    <Paper sx={{ p: 1.5, opacity: selectedTopic ? 1 : 0.6 }} data-section="hypothesis">
      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '1.5rem', fontWeight: 500, mb: 1 }}>
        What’s your unique perspective on this topic?
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        variant="outlined"
        placeholder="Please share your personal angle, insight, or viewpoint here..."
        value={hypothesis}
        disabled={!selectedTopic}
        onChange={(e) => onHypothesisChange(e.target.value)}
        sx={{
          fontSize: '0.9rem'
        }}
        size="small"
      />
      
      {/* Simplified hypothesis section for now */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Hypothesis suggestions functionality will be added here.
        </Typography>
      </Box>
    </Paper>
  );
};

export default HypothesisSection; 