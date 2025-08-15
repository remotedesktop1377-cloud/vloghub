import React from 'react';
import { Paper, Typography, Box, Button, TextField, Chip, CircularProgress } from '@mui/material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';
import { USE_HARDCODED } from '../../data/constants';

interface HypothesisSectionProps {
  selectedTopic: TrendingTopic;
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
    <Paper sx={{ p: 1.5, opacity: selectedTopic ? 1 : 0.6 }} data-section="hypothesis">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
          Your Hypothesis
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.65rem', display: 'block' }}>
        Describe your hypothesis, angle, or unique perspective on this topic. This will help generate relevant video content.
      </Typography>

      {/* Hypothesis Suggestions */}
      <Box sx={{ mb: 2, opacity: 0.6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            💡 Suggested hypotheses for "{selectedTopicDetails ? selectedTopicDetails : selectedTopic?.topic}":
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={onFetchHypothesisSuggestions}
            disabled={!selectedTopic || loadingHypothesisSuggestions}
            sx={{ minWidth: 'auto', px: 0.5, py: 0.25, fontSize: '0.6rem', height: 24 }}
          >
            🔄
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {(!selectedTopic || !selectedTopicDetails.trim()) ? (
            null
          ) : loadingHypothesisSuggestions ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={12} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
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
                }}
                sx={{ 
                  cursor: 'pointer', 
                  fontSize: '0.55rem',
                  height: 20,
                  '&:hover': { 
                    backgroundColor: 'rgba(29, 161, 242, 0.1)', 
                    borderColor: '#1DA1F2' 
                  } 
                }}
              />
            ))
          )}
        </Box>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={3}
        variant="outlined"
        placeholder="Enter your hypothesis, research question, or unique angle on this topic..."
        value={hypothesis}
        disabled={!selectedTopic}
        onChange={(e) => onHypothesisChange(e.target.value)}
        sx={{ mb: 1.5, '& .MuiInputBase-input': { fontSize: '0.7rem' } }}
        size="small"
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={onEnhanceHypothesis}
          disabled={!selectedTopic || !hypothesis.trim() || enhancingHypothesis}
          sx={{ 
            bgcolor: '#9c27b0', 
            '&:hover': { bgcolor: '#7b1fa2' },
            fontSize: '0.7rem',
            px: 2,
            py: 0.5,
            height: 32
          }}
        >
          {enhancingHypothesis ? 'Enhancing...' : '✨ Enhance'}
        </Button>
      </Box>
    </Paper>
  );
};

export default HypothesisSection; 