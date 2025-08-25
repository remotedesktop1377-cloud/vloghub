import React, { useState } from 'react';
import { Paper, Typography, Box, Button, TextField, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, InputAdornment, Checkbox, FormControlLabel } from '@mui/material';
import { AutoFixHigh as MagicIcon } from '@mui/icons-material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';
import { USE_HARDCODED } from '../../data/constants';
import TopicSuggestionsEnhanceDialog from './TopicSuggestionsEnhanceDialog';
import { apiService } from '../../utils/apiService';
import { getDirectionSx } from '../../utils/languageUtils';

interface HypothesisSectionProps {
  selectedTopic: TrendingTopic;
  selectedTopicDetails: string;
  hypothesis: string;
  hypothesisSuggestions: string[];
  loadingHypothesisSuggestions: boolean;
  enhancingHypothesis: boolean;
  selectedRegion: string;
  selectedHypothesisSuggestions?: string[];
  selectedTopicSuggestions?: string[];
  language?: string;
  onFetchHypothesisSuggestions: () => void;
  onHypothesisChange: (hypothesis: string) => void;
  onEnhanceHypothesis: (originalText?: string) => void;
  onHypothesisSuggestionsChange?: (suggestions: string[]) => void;
  onRestoreHypothesisSuggestions?: (suggestions: string[]) => void;
}

const HypothesisSection: React.FC<HypothesisSectionProps> = ({
  selectedTopic,
  selectedTopicDetails,
  hypothesis,
  hypothesisSuggestions,
  loadingHypothesisSuggestions,
  enhancingHypothesis,
  selectedRegion,
  selectedHypothesisSuggestions = [],
  selectedTopicSuggestions = [],
  language = 'english',
  onFetchHypothesisSuggestions,
  onHypothesisChange,
  onEnhanceHypothesis,
  onHypothesisSuggestionsChange,
  onRestoreHypothesisSuggestions,
}) => {
  const [showSuggestionsPopup, setShowSuggestionsPopup] = useState(false);
  const [preservedSuggestions, setPreservedSuggestions] = useState<string[]>([]);
  const [newSuggestions, setNewSuggestions] = useState<string[]>([]);

  // Enhancement dialog state
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [enhancedHypothesisSuggestions, setEnhancedHypothesisSuggestions] = useState<string[]>([]);
  const [enhancingAllHypothesisSuggestions, setEnhancingAllHypothesisSuggestions] = useState(false);
  const [originalHypothesisSuggestionsForEnhancement, setOriginalHypothesisSuggestionsForEnhancement] = useState<string[]>([]);


  const handleEnhanceFromSuggestion = (suggestion: string) => {
    // Call enhance directly with the suggestion text without modifying the text field
    onEnhanceHypothesis(suggestion);
  };

  const handleToggleHypothesisSuggestion = (suggestion: string) => {
    if (!onHypothesisSuggestionsChange) return;

    const isSelected = selectedHypothesisSuggestions.includes(suggestion);
    if (isSelected) {
      onHypothesisSuggestionsChange(selectedHypothesisSuggestions.filter(s => s !== suggestion));
    } else {
      onHypothesisSuggestionsChange([...selectedHypothesisSuggestions, suggestion]);
    }
  };

  const handleSelectAllHypothesisSuggestions = () => {
    if (!onHypothesisSuggestionsChange) return;

    if (selectedHypothesisSuggestions.length === hypothesisSuggestions.length) {
      // Deselect all
      onHypothesisSuggestionsChange([]);
    } else {
      // Select all
      onHypothesisSuggestionsChange([...hypothesisSuggestions]);
    }
  };

  const getSuggestionsToShow = () => {
    if (USE_HARDCODED) {
      return HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic?.topic || '', selectedRegion);
    }
    return hypothesisSuggestions.length > 0 ? hypothesisSuggestions : [];
  };

  const handleEnhanceAllHypothesisSuggestions = async () => {
    if (USE_HARDCODED) {
      console.log('❌ Skipping due to USE_HARDCODED mode');
      return;
    }

    const currentSuggs = getSuggestionsToShow();
    if (currentSuggs.length === 0) {
      console.log('❌ No hypothesis suggestions to enhance');
      return;
    }

    try {
      setEnhancingAllHypothesisSuggestions(true);
      setOriginalHypothesisSuggestionsForEnhancement(currentSuggs);
      setShowEnhanceDialog(true);

      const result = await apiService.enhanceHypothesis({
        topic: selectedTopic.topic,
        hypothesis: currentSuggs.join('\n'),
        details: selectedTopicDetails,
        region: selectedRegion,
        currentSuggestions: hypothesisSuggestions // Pass existing hypothesis suggestions to avoid duplicates
      });

      let enhancedResults: string[] = [];

      if (result.success && 'data' in result && result.data?.enhancedSuggestions) {
        enhancedResults = result.data.enhancedSuggestions;
      } else if (!result.success && 'error' in result) {
        enhancedResults = currentSuggs;
      } else {
        enhancedResults = currentSuggs;
      }

      setEnhancedHypothesisSuggestions(enhancedResults);
      setEnhancingAllHypothesisSuggestions(false);

    } catch (error) {
      console.error('💥 Error enhancing hypothesis suggestions:', error);
      setEnhancedHypothesisSuggestions(currentSuggs);
      setEnhancingAllHypothesisSuggestions(false);
    }
  };

  const handleAcceptEnhancedHypothesisSuggestions = (enhanced: string[]) => {
    if (onRestoreHypothesisSuggestions) {
      onRestoreHypothesisSuggestions(enhanced);
    }
    setShowEnhanceDialog(false);
    setEnhancedHypothesisSuggestions([]);
    setOriginalHypothesisSuggestionsForEnhancement([]);
  };

  const handleRejectEnhancedHypothesisSuggestions = () => {
    setShowEnhanceDialog(false);
    setEnhancedHypothesisSuggestions([]);
    setOriginalHypothesisSuggestionsForEnhancement([]);
  };

  // Update new suggestions when hypothesisSuggestions change (API call completes)
  React.useEffect(() => {
    if (!loadingHypothesisSuggestions && hypothesisSuggestions.length > 0 && showSuggestionsPopup) {
      setNewSuggestions(hypothesisSuggestions);
    }
  }, [loadingHypothesisSuggestions, hypothesisSuggestions, showSuggestionsPopup]);

  const getDialogSuggestionsToShow = () => {
    if (USE_HARDCODED) {
      return HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic?.topic || '', selectedRegion);
    }

    // While loading, show preserved suggestions. After loading, show new suggestions
    if (loadingHypothesisSuggestions && preservedSuggestions.length > 0) {
      return preservedSuggestions;
    }

    // If we have new suggestions from API, show them. Otherwise show preserved.
    return newSuggestions.length > 0 ? newSuggestions : preservedSuggestions;
  };

  const handleAcceptSuggestions = () => {
    // Accept new suggestions - keep them as they are already in hypothesisSuggestions
    // No need to do anything as the new suggestions are already applied in the parent state
    setShowSuggestionsPopup(false);
    setPreservedSuggestions([]);
    setNewSuggestions([]);
  };

  const handleRejectSuggestions = () => {
    // Reject new suggestions and restore old ones
    if (preservedSuggestions.length > 0 && onRestoreHypothesisSuggestions) {
      onRestoreHypothesisSuggestions(preservedSuggestions);
    }
    setShowSuggestionsPopup(false);
    setPreservedSuggestions([]);
    setNewSuggestions([]);
  };

  const hasNewSuggestions = !loadingHypothesisSuggestions && newSuggestions.length > 0;

  return (
    <>
      <Paper sx={{ p: 1.5, opacity: selectedTopic ? 1 : 0.6 }} data-section="hypothesis">
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 500, mb: 1 }}>
          Your Hypothesis - Describe your hypothesis, angle, or unique perspective on this topic.
        </Typography>

        {/* Hypothesis Suggestions */}
        <Box sx={{ mb: 2, opacity: USE_HARDCODED ? 0.6 : 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              💡 Suggested hypotheses for "{selectedTopic?.topic}":
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {hypothesisSuggestions.length > 0 && onHypothesisSuggestionsChange && (
                <Button
                  size="small"
                  variant="text"
                  onClick={handleSelectAllHypothesisSuggestions}
                  sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', height: 28 }}
                >
                  {selectedHypothesisSuggestions.length === hypothesisSuggestions.length ? '☑️ All' : '☐ All'}
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={handleEnhanceAllHypothesisSuggestions}
                disabled={USE_HARDCODED || enhancingAllHypothesisSuggestions || getSuggestionsToShow().length === 0}
                sx={{
                  minWidth: 'auto',
                  px: 1,
                  py: 0.25,
                  fontSize: '0.75rem',
                  height: 28,
                  bgcolor: enhancingAllHypothesisSuggestions ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
                  borderColor: '#9c27b0',
                  color: '#9c27b0',
                  '&:hover': {
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                    borderColor: '#7b1fa2'
                  }
                }}
                startIcon={enhancingAllHypothesisSuggestions ? <CircularProgress size={12} sx={{ color: '#9c27b0' }} /> : <MagicIcon sx={{ fontSize: 12 }} />}
              >
                {enhancingAllHypothesisSuggestions ? 'Enhancing...' : 'Enhance All'}
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {USE_HARDCODED ? (
              // Show hardcoded hypothesis suggestions in hardcoded mode
              HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic?.topic || '', selectedRegion).map((suggestion: string, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {onHypothesisSuggestionsChange && (
                    <Checkbox
                      checked={selectedHypothesisSuggestions.includes(suggestion)}
                      onChange={() => handleToggleHypothesisSuggestion(suggestion)}
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
                        // Don't populate the hypothesis field, just toggle the checkbox selection
                        if (onHypothesisSuggestionsChange) {
                          handleToggleHypothesisSuggestion(suggestion);
                        }
                        // Don't automatically scroll anywhere - let user stay where they are
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
                          borderColor: '#1DA1F2'
                        }
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnhanceFromSuggestion(suggestion);
                      }}
                      size="medium"
                      disabled={enhancingHypothesis}
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
            ) : loadingHypothesisSuggestions ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={12} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {selectedTopicSuggestions.length > 0 ? '🔄 Generating hypothesis suggestions based on your selected topic suggestions...' : 'Generating hypothesis suggestions...'}
                </Typography>
              </Box>
            ) : (
              (hypothesisSuggestions || []).map((suggestion: string, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {onHypothesisSuggestionsChange && (
                    <Checkbox
                      checked={selectedHypothesisSuggestions.includes(suggestion)}
                      onChange={() => handleToggleHypothesisSuggestion(suggestion)}
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
                        // Don't populate the hypothesis field, just toggle the checkbox selection
                        if (onHypothesisSuggestionsChange) {
                          handleToggleHypothesisSuggestion(suggestion);
                        }
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
                          borderColor: '#1DA1F2'
                        }
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnhanceFromSuggestion(suggestion);
                      }}
                      size="medium"
                      disabled={enhancingHypothesis}
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
          sx={{
            mb: 1.5,
            // '& .MuiInputBase-input': {
            //   fontSize: '0.8rem',
            //   ...getDirectionSx(language)
            // },
            // '& .MuiInputBase-root': {
            //   ...getDirectionSx(language)
            // }
          }}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ alignSelf: 'flex-end', mb: '10px' }}>
                <IconButton
                  onClick={(e) => {
                    e.preventDefault();
                    onEnhanceHypothesis();
                  }}
                  disabled={USE_HARDCODED || !selectedTopic || !hypothesis.trim() || enhancingHypothesis}
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
                  title={enhancingHypothesis ? 'Enhancing...' : 'Enhance Hypothesis'}
                >
                  {enhancingHypothesis ? (
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
        <DialogContent>
          {loadingHypothesisSuggestions ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              gap: 2,
              minHeight: '200px'
            }}>
              <CircularProgress size={40} sx={{ color: '#1976d2' }} />
              <Typography variant="body2" color="text.secondary">
                Generating hypothesis suggestions...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography>
                {hasNewSuggestions
                  ? 'Review the new hypothesis suggestions below. Accept to replace all current suggestions with these new ones:'
                  : 'Current hypothesis suggestions:'
                }
              </Typography>
              {preservedSuggestions.length > 0 && hasNewSuggestions && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Previous suggestions: {preservedSuggestions.length} items → New suggestions: {newSuggestions.length} items
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                {getDialogSuggestionsToShow().map((suggestion: string, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: 'rgba(29,161,242,0.02)',
                      borderColor: '#1DA1F2',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {suggestion}
                    </Typography>
                  </Box>
                ))}
                {getDialogSuggestionsToShow().length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No suggestions available. Generate new suggestions using the refresh button.
                  </Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {hasNewSuggestions ? (
            <>
              <Button onClick={handleRejectSuggestions} color="primary">
                Reject
              </Button>
              <Button
                onClick={handleAcceptSuggestions}
                color="primary"
                variant="contained"
              >
                Accept All New Suggestions
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowSuggestionsPopup(false)} color="primary">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Hypothesis Enhancement Dialog */}
      <TopicSuggestionsEnhanceDialog
        open={showEnhanceDialog}
        onClose={() => setShowEnhanceDialog(false)}
        onAccept={handleAcceptEnhancedHypothesisSuggestions}
        onReject={handleRejectEnhancedHypothesisSuggestions}
        originalSuggestions={originalHypothesisSuggestionsForEnhancement}
        enhancedSuggestions={enhancedHypothesisSuggestions}
        loading={enhancingAllHypothesisSuggestions}
        topic={selectedTopic?.topic || ''}
        type="hypothesis"
      />
    </>
  );
};

export default HypothesisSection; 