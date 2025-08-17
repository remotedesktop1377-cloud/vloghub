import React, { useState } from 'react';
import { Paper, Typography, Box, Button, TextField, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
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
  selectedRegion: string;
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
  selectedRegion,
  onFetchHypothesisSuggestions,
  onHypothesisChange,
  onEnhanceHypothesis,
}) => {
  const [showSuggestionsPopup, setShowSuggestionsPopup] = useState(false);

  const handleShowSuggestions = () => {
    if (!loadingHypothesisSuggestions && selectedTopic && selectedTopicDetails.trim()) {
      onFetchHypothesisSuggestions();
      setShowSuggestionsPopup(true);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onHypothesisChange(suggestion);
    setShowSuggestionsPopup(false);
  };

  const getSuggestionsToShow = () => {
    if (USE_HARDCODED) {
      return HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic?.topic || '', selectedRegion);
    }
    return hypothesisSuggestions.length > 0 ? hypothesisSuggestions : [];
  };

  return (
    <>
      <Paper sx={{ p: 1.5, opacity: selectedTopic ? 1 : 0.6 }} data-section="hypothesis">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Your Hypothesis
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.75rem', display: 'block' }}>
          Describe your hypothesis, angle, or unique perspective on this topic. This will help generate relevant video content.
        </Typography>

        {/* Hypothesis Suggestions */}
        <Box sx={{ mb: 2, opacity: USE_HARDCODED ? 0.6 : 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              💡 Suggested hypotheses for "{selectedTopicDetails ? selectedTopicDetails : selectedTopic?.topic}":
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={handleShowSuggestions}
              disabled={USE_HARDCODED || !selectedTopic || loadingHypothesisSuggestions}
              sx={{ minWidth: 'auto', px: 0.5, py: 0.25, fontSize: '0.6rem', height: 24 }}
            >
              🔄
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {USE_HARDCODED ? (
              // Show hardcoded hypothesis suggestions in hardcoded mode
              HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic?.topic || '', selectedRegion).map((suggestion: string, idx: number) => (
                <Chip
                  key={idx}
                  label={suggestion}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    onHypothesisChange(suggestion);
                    // Don't automatically scroll anywhere - let user stay where they are
                  }}
                  sx={{ 
                    cursor: 'pointer', 
                    fontSize: '0.65rem',
                    height: 22,
                    '&:hover': { 
                      backgroundColor: 'rgba(29, 161, 242, 0.1)', 
                      borderColor: '#1DA1F2' 
                    } 
                  }}
                />
              ))
            ) : (!selectedTopic || !selectedTopicDetails.trim()) ? (
              null
            ) : loadingHypothesisSuggestions ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={12} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
                    fontSize: '0.65rem',
                    height: 22,
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
          sx={{ mb: 1.5, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
          size="small"
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={onEnhanceHypothesis}
            disabled={USE_HARDCODED || !selectedTopic || !hypothesis.trim() || enhancingHypothesis}
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

      {/* Hypothesis Suggestions Popup */}
      <Dialog 
        open={showSuggestionsPopup} 
        onClose={() => setShowSuggestionsPopup(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '0.9rem', pb: 1 }}>
          Hypothesis Suggestions for "{selectedTopicDetails ? selectedTopicDetails : selectedTopic?.topic}"
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {getSuggestionsToShow().map((suggestion: string, index: number) => (
              <Box
                key={index}
                sx={{
                  p: 1.5,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#1DA1F2',
                    backgroundColor: 'rgba(29,161,242,0.02)'
                  }
                }}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {suggestion}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuggestionsPopup(false)} size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HypothesisSection; 