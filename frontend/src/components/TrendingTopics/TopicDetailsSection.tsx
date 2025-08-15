import React from 'react';
import { Paper, Typography, Box, Button, TextField, Chip, CircularProgress } from '@mui/material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';
import { USE_HARDCODED } from '../../data/constants';

interface TopicDetailsSectionProps {
  selectedTopic: TrendingTopic;
  selectedTopicDetails: string;
  topicSuggestions: string[];
  loadingTopicSuggestions: boolean;
  enhancingDetails: boolean;
  selectedRegion: string;
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
  selectedRegion,
  onGetTopicSuggestions,
  onTopicDetailsChange,
  onEnhanceTopicDetails,
}) => {
  return (
    <Paper sx={{ p: 1.5 }} data-section="topic-details">
      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>
        Your Topic
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.65rem', display: 'block' }}>
        Describe your topic, This will help generate relevant video content.
      </Typography>

      {/* Topic Suggestions */}
      <Box sx={{ mb: 2, opacity: USE_HARDCODED ? 0.6 : 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            💡 Suggested topics for "{selectedTopic.topic}":
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onGetTopicSuggestions(selectedTopic.topic)}
            disabled={USE_HARDCODED || loadingTopicSuggestions}
            sx={{ minWidth: 'auto', px: 0.5, py: 0.25, fontSize: '0.6rem', height: 24 }}
          >
            🔄
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {USE_HARDCODED ? (
            // Show hardcoded suggestions in hardcoded mode
            HelperFunctions.generateFallbackTopicSuggestions(selectedTopic.topic, selectedRegion).map((suggestion: string, index: number) => (
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
                  fontSize: '0.55rem',
                  height: 20,
                  '&:hover': {
                    backgroundColor: 'rgba(29, 161, 242, 0.1)',
                    borderColor: '#1DA1F2',
                  }
                }}
              />
            ))
          ) : loadingTopicSuggestions ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={12} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
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
                  fontSize: '0.55rem',
                  height: 20,
                  '&:hover': {
                    backgroundColor: 'rgba(29, 161, 242, 0.1)',
                    borderColor: '#1DA1F2',
                  }
                }}
              />
            ))
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              No topic suggestions available. Click on a trending topic to generate suggestions.
            </Typography>
          )}
        </Box>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={3}
        variant="outlined"
        placeholder="Enter your topic details..."
        value={selectedTopicDetails}
        onChange={(e) => onTopicDetailsChange(e.target.value)}
        sx={{ mb: 1.5, '& .MuiInputBase-input': { fontSize: '0.7rem' } }}
        size="small"
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="small"
          onClick={onEnhanceTopicDetails}
          disabled={USE_HARDCODED || enhancingDetails || !selectedTopicDetails.trim()}
          sx={{ 
            bgcolor: '#9c27b0', 
            '&:hover': { bgcolor: '#7b1fa2' },
            fontSize: '0.7rem',
            px: 2,
            py: 0.5,
            height: 32
          }}
        >
          {enhancingDetails ? 'Enhancing...' : '✨ Enhance'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TopicDetailsSection; 