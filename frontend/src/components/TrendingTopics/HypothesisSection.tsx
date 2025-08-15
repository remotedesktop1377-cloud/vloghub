import React from 'react';
import { Paper, Typography, Box, Button, Chip, TextField } from '@mui/material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';
import { USE_HARDCODED } from '../../data/constants';

interface HypothesisSectionProps {
  selectedTopic: TrendingTopic | null;
  selectedTopicDetails: string;
  hypothesis: string;
  hypothesisSuggestions: string[];
  loadingHypothesisSuggestions: boolean;
  enhancingHypothesis: boolean;
  onFetchHypothesisSuggestions: () => void;
  onHypothesisChange: (hypothesis: string) => void;
  onEnhanceHypothesis: () => void;
}

const HypothesisSection: React.FC<HypothesisSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  hypothesis,
  hypothesisSuggestions,
  loadingHypothesisSuggestions,
  enhancingHypothesis,
  onFetchHypothesisSuggestions,
  onHypothesisChange,
  onEnhanceHypothesis,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3, opacity: selectedTopic ? 1 : 0.6 }} data-section="hypothesis">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.8rem' }}>
          Your Hypothesis
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Describe your hypothesis, angle, or unique perspective on this topic. This will help generate relevant video content.
      </Typography>

      {/* Hypothesis Suggestions */}
      <Box sx={{ mb: 3, opacity: USE_HARDCODED ? 0.6 : 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            💡 Suggested hypotheses for "{selectedTopicDetails ? selectedTopicDetails : selectedTopic?.topic}":
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={onFetchHypothesisSuggestions}
            disabled={USE_HARDCODED || !selectedTopic || loadingHypothesisSuggestions}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            🔄
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {USE_HARDCODED ? (
            // Show hardcoded hypothesis suggestions in hardcoded mode
            HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic?.topic || '', 'pakistan').map((suggestion: string, idx: number) => (
              <Chip
                key={idx}
                label={suggestion}
                size="small"
                variant="outlined"
                onClick={() => {
                  onHypothesisChange(suggestion);
                  // Don't automatically scroll anywhere - let user stay where they are
                }}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(29, 161, 242, 0.1)', borderColor: '#1DA1F2' } }}
              />
            ))
          ) : (!selectedTopic || !selectedTopicDetails.trim()) ? (
            null
          ) : loadingHypothesisSuggestions ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Generating hypothesis suggestions...
              </Typography>
            </Box>
          ) : (
            (hypothesisSuggestions || []).map((suggestion: string, idx: number) => (
              <Chip
                key={idx}
                label={suggestion}
                size="small"
                variant="outlined"
                onClick={() => {
                  onHypothesisChange(suggestion);
                  // Don't automatically scroll anywhere - let user stay where they are
                }}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(29, 161, 242, 0.1)', borderColor: '#1DA1F2' } }}
              />
            ))
          )}
        </Box>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Enter your hypothesis, research question, or unique angle on this topic..."
        value={hypothesis}
        disabled={!selectedTopic}
        onChange={(e) => onHypothesisChange(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={onEnhanceHypothesis}
          disabled={USE_HARDCODED || !selectedTopic || !hypothesis.trim() || enhancingHypothesis}
          sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
        >
          {enhancingHypothesis ? 'Enhancing...' : '✨ Enhance'}
        </Button>
      </Box>
    </Paper>
  );
};

export default HypothesisSection; 