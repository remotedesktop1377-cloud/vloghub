import React, { useState } from 'react';
import { Paper, Typography, Box, Button, TextField, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, InputAdornment, Checkbox, FormControlLabel } from '@mui/material';
import { AutoFixHigh as MagicIcon } from '@mui/icons-material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';
import { USE_HARDCODED } from '../../data/constants';
import TopicSuggestionsEnhanceDialog from './TopicSuggestionsEnhanceDialog';
import { apiService } from '../../utils/apiService';
import { getDirectionSx } from '../../utils/languageUtils';

interface TopicDetailsSectionProps {
  selectedTopic: TrendingTopic;
  selectedTopicDetails: string;
  topicSuggestions: string[];
  loadingTopicSuggestions: boolean;
  enhancingDetails: boolean;
  selectedRegion: string;
  selectedTopicSuggestions?: string[];
  language?: string;

  onTopicDetailsChange: (details: string) => void;
  onEnhanceTopicDetails: (originalText?: string) => void;
  onTopicSuggestionsChange?: (suggestions: string[]) => void;
  onRestoreTopicSuggestions?: (suggestions: string[]) => void;
}

const TopicDetailsSection: React.FC<TopicDetailsSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  topicSuggestions,
  loadingTopicSuggestions,
  enhancingDetails,
  selectedRegion,
  selectedTopicSuggestions = [],
  language = 'english',

  onTopicDetailsChange,
  onEnhanceTopicDetails,
  onTopicSuggestionsChange,
  onRestoreTopicSuggestions,
}) => {


  // Enhancement dialog state
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<string[]>([]);
  const [enhancingAllSuggestions, setEnhancingAllSuggestions] = useState(false);
  const [originalSuggestionsForEnhancement, setOriginalSuggestionsForEnhancement] = useState<string[]>([]);

  const handleEnhanceFromSuggestion = (suggestion: string) => {
    // Call enhance directly with the suggestion text without modifying the text field
    onEnhanceTopicDetails(suggestion);
  };

  const handleToggleTopicSuggestion = (suggestion: string) => {
    if (!onTopicSuggestionsChange) return;

    const isSelected = selectedTopicSuggestions.includes(suggestion);
    if (isSelected) {
      onTopicSuggestionsChange(selectedTopicSuggestions.filter(s => s !== suggestion));
    } else {
      onTopicSuggestionsChange([...selectedTopicSuggestions, suggestion]);
    }
  };

  const handleSelectAllTopicSuggestions = () => {
    if (!onTopicSuggestionsChange) return;

    if (selectedTopicSuggestions.length === topicSuggestions.length) {
      // Deselect all
      onTopicSuggestionsChange([]);
    } else {
      // Select all
      onTopicSuggestionsChange([...topicSuggestions]);
    }
  };

  const getSuggestionsToShow = () => {
    if (USE_HARDCODED) {
      return HelperFunctions.generateFallbackTopicSuggestions(selectedTopic.topic, selectedRegion);
    }
    return topicSuggestions.length > 0 ? topicSuggestions : [];
  };

  const handleEnhanceAllSuggestions = async () => {
    // console.log('🚀 handleEnhanceAllSuggestions called');
    // console.log('📊 USE_HARDCODED:', USE_HARDCODED);

    if (USE_HARDCODED) {
      console.log('❌ Skipping due to USE_HARDCODED mode');
      return;
    }

    const currentSuggs = getSuggestionsToShow();
    // console.log('📋 Current suggestions:', currentSuggs);

    if (currentSuggs.length === 0) {
      console.log('❌ No suggestions to enhance');
      return;
    }

    try {
      // console.log('🔄 Starting enhancement process...');
      setEnhancingAllSuggestions(true);
      setOriginalSuggestionsForEnhancement(currentSuggs);
      setShowEnhanceDialog(true);

      const result = await apiService.enhanceTopicSuggestions({
        suggestions: currentSuggs,
        topic: selectedTopic.topic,
        region: selectedRegion
      });

      // console.log('📥 API Response:', result);
      // console.log('📝 API Response type:', typeof result);

      let enhancedResults: string[] = [];

      if (result.success && 'data' in result && result.data?.enhancedSuggestions) {
        // console.log('✨ Received enhanced suggestions:', result.data.enhancedSuggestions);
        // console.log('📊 Enhanced suggestions count:', result.data.enhancedSuggestions.length);
        enhancedResults = result.data.enhancedSuggestions;
      } else if (!result.success && 'error' in result) {
        // console.error('❌ Failed to enhance suggestions:', result.error);
        // Keep original suggestions as fallback
        enhancedResults = currentSuggs;
      } else {
        // Fallback for unexpected result shape
        // console.error('❌ Failed to enhance suggestions: Unknown error or unexpected response');
        // console.error('📋 Current suggestions as fallback:', currentSuggs);
        enhancedResults = currentSuggs;
      }

      // Set enhanced suggestions and stop loading together
      setEnhancedSuggestions(enhancedResults);
      setEnhancingAllSuggestions(false);

      // console.log('🏁 Enhancement process completed');
      // console.log('📊 Setting enhanced suggestions:', enhancedResults);

    } catch (error) {
      // console.error('💥 Error enhancing suggestions:', error);
      // Keep original suggestions as fallback
      setEnhancedSuggestions(currentSuggs);
      setEnhancingAllSuggestions(false);
    }
  };

  const handleAcceptEnhancedSuggestions = (enhanced: string[]) => {
    if (onRestoreTopicSuggestions) {
      onRestoreTopicSuggestions(enhanced);
    }
    setShowEnhanceDialog(false);
    setEnhancedSuggestions([]);
    setOriginalSuggestionsForEnhancement([]);
  };

  const handleRejectEnhancedSuggestions = () => {
    setShowEnhanceDialog(false);
    setEnhancedSuggestions([]);
    setOriginalSuggestionsForEnhancement([]);
  };

  return (
    <>
      <Paper sx={{ p: 1.5 }} data-section="topic-details">
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 500, mb: 1 }}>
          Your Topic - Describe your topic, This will help generate relevant video content.
        </Typography>

        {/* Topic Suggestions */}
        <Box sx={{ mb: 2, opacity: USE_HARDCODED ? 0.6 : 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              💡 Suggested topics for "{selectedTopic.topic}":
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {topicSuggestions.length > 0 && onTopicSuggestionsChange && (
                <Button
                  size="small"
                  variant="text"
                  onClick={handleSelectAllTopicSuggestions}
                  sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', height: 28 }}
                >
                  {selectedTopicSuggestions.length === topicSuggestions.length ? '☑️ All' : '☐ All'}
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={handleEnhanceAllSuggestions}
                disabled={USE_HARDCODED || enhancingAllSuggestions || getSuggestionsToShow().length === 0}
                sx={{
                  minWidth: 'auto',
                  px: 1,
                  py: 0.25,
                  fontSize: '0.75rem',
                  height: 28,
                  bgcolor: enhancingAllSuggestions ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
                  borderColor: '#9c27b0',
                  color: '#9c27b0',
                  '&:hover': {
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                    borderColor: '#7b1fa2'
                  }
                }}
                startIcon={enhancingAllSuggestions ? <CircularProgress size={12} sx={{ color: '#9c27b0' }} /> : <MagicIcon sx={{ fontSize: 12 }} />}
              >
                {enhancingAllSuggestions ? 'Enhancing...' : 'Enhance All'}
              </Button>

            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {USE_HARDCODED ? (
              // Show hardcoded suggestions in hardcoded mode
              HelperFunctions.generateFallbackTopicSuggestions(selectedTopic.topic, selectedRegion).map((suggestion: string, index: number) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {onTopicSuggestionsChange && (
                    <Checkbox
                      checked={selectedTopicSuggestions.includes(suggestion)}
                      onChange={() => handleToggleTopicSuggestion(suggestion)}
                      size="medium"
                      sx={{ p: 0.25 }}
                    />
                  )}
                  <Box sx={{ position: 'relative' }}>
                    <Chip
                      label={suggestion}
                      size="medium"
                      variant="outlined"
                      onClick={() => {
                        // Also toggle the checkbox selection
                        if (onTopicSuggestionsChange) {
                          handleToggleTopicSuggestion(suggestion);
                        }
                        // Don't automatically scroll to hypothesis - let user stay in topic section
                      }}
                      sx={{
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        height: 32,
                        px: 2,
                        py: 1,
                        pr: 4, // Make room for enhance button
                        '& .MuiChip-label': {
                          fontSize: '0.8rem',
                          padding: '0 8px'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(29, 161, 242, 0.1)',
                          borderColor: '#1DA1F2',
                        }
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnhanceFromSuggestion(suggestion);
                      }}
                      size="medium"
                      disabled={enhancingDetails}
                      sx={{
                        position: 'absolute',
                        right: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 20,
                        height: 20,
                        bgcolor: '#9c27b0',
                        color: 'white',
                        '&:hover': { bgcolor: '#7b1fa2' },
                        '&:disabled': { bgcolor: '#e0e0e0', color: '#999' }
                      }}
                      title="Enhance this suggestion"
                    >
                      <MagicIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))
            ) : loadingTopicSuggestions && topicSuggestions.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={12} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Generating topic suggestions...
                </Typography>
              </Box>
            ) : topicSuggestions.length > 0 ? (
              topicSuggestions.map((suggestion: string, index: number) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {onTopicSuggestionsChange && (
                    <Checkbox
                      checked={selectedTopicSuggestions.includes(suggestion)}
                      onChange={() => handleToggleTopicSuggestion(suggestion)}
                      size="medium"
                      sx={{ p: 0.25 }}
                    />
                  )}
                  <Box sx={{ position: 'relative' }}>
                    <Chip
                      label={suggestion}
                      size="medium"
                      variant="outlined"
                      onClick={() => {
                        // Also toggle the checkbox selection
                        if (onTopicSuggestionsChange) {
                          handleToggleTopicSuggestion(suggestion);
                        }
                        // Don't automatically scroll to hypothesis - let user stay in topic section
                      }}
                      sx={{
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        height: 32,
                        px: 2,
                        py: 1,
                        pr: 4, // Make room for enhance button
                        '& .MuiChip-label': {
                          fontSize: '0.8rem',
                          padding: '0 8px'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(29, 161, 242, 0.1)',
                          borderColor: '#1DA1F2',
                        }
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnhanceFromSuggestion(suggestion);
                      }}
                      size="medium"
                      disabled={enhancingDetails}
                      sx={{
                        position: 'absolute',
                        right: 4,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 20,
                        height: 20,
                        bgcolor: '#9c27b0',
                        color: 'white',
                        '&:hover': { bgcolor: '#7b1fa2' },
                        '&:disabled': { bgcolor: '#e0e0e0', color: '#999' }
                      }}
                      title="Enhance this suggestion"
                    >
                      <MagicIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
          // sx={{ 
          //   mb: 1.5, 
          //   '& .MuiInputBase-input': { 
          //     fontSize: '0.8rem',
          //     ...getDirectionSx(language)
          //   },
          //   '& .MuiInputBase-root': {
          //     ...getDirectionSx(language)
          //   }
          // }}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ alignSelf: 'flex-end', mb: '10px' }}>
                <IconButton
                  onClick={(e) => {
                    e.preventDefault();
                    onEnhanceTopicDetails();
                  }}
                  disabled={enhancingDetails || !selectedTopicDetails.trim()}
                  size="small"
                  sx={{
                    bgcolor: '#9c27b0',
                    color: 'white',
                    '&:hover': { bgcolor: '#7b1fa2' },
                    '&:disabled': {
                      bgcolor: '#e0e0e0',
                      color: '#999'
                    },
                    width: 28,
                    height: 28
                  }}
                  title={enhancingDetails ? 'Enhancing...' : 'Enhance Topic Details'}
                >
                  {enhancingDetails ? (
                    <CircularProgress size={14} sx={{ color: 'white' }} />
                  ) : (
                    <MagicIcon sx={{ fontSize: 14 }} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Enhancement Dialog */}
      <TopicSuggestionsEnhanceDialog
        open={showEnhanceDialog}
        onClose={() => setShowEnhanceDialog(false)}
        onAccept={handleAcceptEnhancedSuggestions}
        onReject={handleRejectEnhancedSuggestions}
        originalSuggestions={originalSuggestionsForEnhancement}
        enhancedSuggestions={enhancedSuggestions}
        loading={enhancingAllSuggestions}
        topic={selectedTopic.topic}
        type="topic"
      />
    </>
  );
};

export default TopicDetailsSection; 