import React from 'react';
import { Paper, Typography, TextField } from '@mui/material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { getDirectionSx } from '../../utils/languageUtils';

interface HypothesisSectionProps {
  selectedTopic: TrendingTopic | null;
  selectedTopicDetails: string;
  hypothesis: string;
  language?: string;
  onHypothesisChange: (hypothesis: string) => void;
}

const HypothesisSection: React.FC<HypothesisSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  hypothesis,
  language = 'english',
  onHypothesisChange,
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
    </Paper>
  );
};

export default HypothesisSection; 