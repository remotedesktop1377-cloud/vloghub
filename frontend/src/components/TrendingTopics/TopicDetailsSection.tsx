import React from 'react';
import { Paper, Typography, TextField } from '@mui/material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { getDirectionSx } from '../../utils/languageUtils';

interface TopicDetailsSectionProps {
  selectedTopic: TrendingTopic;
  selectedTopicDetails: string;
  language?: string;
  onTopicDetailsChange: (details: string) => void;
}

const TopicDetailsSection: React.FC<TopicDetailsSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  language = 'english',
  onTopicDetailsChange,
}) => {
  return (
    <Paper sx={{ p: 1.5 }} data-section="topic-details">
      <Typography variant="h5" gutterBottom >
        {selectedTopic.topic}
      </Typography>
      {selectedTopic.description && (
        <Typography variant="subtitle2" gutterBottom sx={{
          fontSize: '0.9rem',
          color: 'gray',
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