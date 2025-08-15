import React from 'react';
import { Paper, Typography, Box, Button, Chip, TextField } from '@mui/material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';
import { USE_HARDCODED } from '../../data/constants';

interface TopicDetailsSectionProps {
  selectedTopic: TrendingTopic;
  selectedTopicDetails: string;
  topicSuggestions: string[];
  loadingTopicSuggestions: boolean;
  enhancingDetails: boolean;
  onGetTopicSuggestions: (topicName: string) => void;
  onTopicDetailsChange: (details: string) => void;
  onEnhanceTopicDetails: () => void;
}

const TopicDetailsSection: React.FC<TopicDetailsSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  topicSuggestions,
  loadingTopicSuggestions,
  enhancingDetails,
  onGetTopicSuggestions,
  onTopicDetailsChange,
  onEnhanceTopicDetails,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }} data-section="topic-details">
      <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.8rem' }}>
        Your Topic
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Describe your topic, This will help generate relevant video content.
      </Typography>

      {/* Topic Suggestions */}
      <Box sx={{ mb: 3, opacity: USE_HARDCODED ? 0.6 : 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            💡 Suggested topics for "{selectedTopic.topic}":
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onGetTopicSuggestions(selectedTopic.topic)}
            disabled={USE_HARDCODED || loadingTopicSuggestions}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            🔄
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {USE_HARDCODED ? (
            // Show hardcoded suggestions in hardcoded mode
            HelperFunctions.generateFallbackTopicSuggestions(selectedTopic.topic, 'pakistan').map((suggestion: string, index: number) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                variant="outlined"
                onClick={() => onTopicDetailsChange(suggestion)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(29, 161, 242, 0.1)',
                    borderColor: '#1DA1F2',
                  }
                }}
              />
            ))
          ) : loadingTopicSuggestions ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Generating topic suggestions...
              </Typography>
            </Box>
          ) : topicSuggestions.length > 0 ? (
            topicSuggestions.map((suggestion: string, index: number) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                variant="outlined"
                onClick={() => {
                  onTopicDetailsChange(suggestion);
                  // Don't automatically scroll to hypothesis - let user stay in topic section
                }}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(29, 161, 242, 0.1)',
                    borderColor: '#1DA1F2',
                  }
                }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No topic suggestions available. Click on a trending topic to generate suggestions.
            </Typography>
          )}
        </Box>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Enter your topic details..."
        value={selectedTopicDetails}
        onChange={(e) => onTopicDetailsChange(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={onEnhanceTopicDetails}
          disabled={USE_HARDCODED || enhancingDetails || !selectedTopicDetails.trim()}
          sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
        >
          {enhancingDetails ? 'Enhancing...' : '✨ Enhance'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TopicDetailsSection; 