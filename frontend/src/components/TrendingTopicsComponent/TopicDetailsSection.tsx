'use client';

import React from 'react';
import { Paper, Typography, TextField, Box, Chip, Button, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import { TrendingTopic } from '../../types/TrendingTopics';      

interface TopicDetailsSectionProps {
  selectedTopic: TrendingTopic;
  selectedTopicDetails: string;
  topicSuggestions: string[];
  selectedTopicSuggestions: string[];
  loadingTopicSuggestions: boolean;
  enhancingDetails: boolean;
  selectedRegion: string;
  language?: string;
  onTopicDetailsChange: (details: string) => void;
  onEnhanceTopicDetails: (originalText?: string) => void;
  onTopicSuggestionsChange: (suggestions: string[]) => void;
  onRestoreTopicSuggestions: (suggestions: string[]) => void;
}

const TopicDetailsSection: React.FC<TopicDetailsSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  topicSuggestions,
  selectedTopicSuggestions,
  loadingTopicSuggestions,
  enhancingDetails,
  selectedRegion,
  language = 'english',
  onTopicDetailsChange,
  onEnhanceTopicDetails,
  onTopicSuggestionsChange,
  onRestoreTopicSuggestions,
}) => {
  return (
    <Paper sx={{ p: 1.5 }} data-section="topic-details">
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
      {selectedTopic.topic}
      </Typography>
      {selectedTopic.description && (
        <Typography variant="subtitle1" gutterBottom sx={{
          fontSize: '1.25rem',
          color: 'text.secondary',
          fontWeight: 400,
          fontStretch: 'normal',
        }}>
          {selectedTopic.description}
        </Typography>
      )}
      
    </Paper>
  );
};

export default TopicDetailsSection; 