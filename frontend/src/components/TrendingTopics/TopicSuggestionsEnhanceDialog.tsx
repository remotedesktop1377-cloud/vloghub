import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { AutoFixHigh as MagicIcon } from '@mui/icons-material';

interface TopicSuggestionsEnhanceDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: (enhancedSuggestions: string[]) => void;
  onReject: () => void;
  originalSuggestions: string[];
  enhancedSuggestions: string[];
  loading: boolean;
  topic: string;
  type?: 'topic' | 'hypothesis';
}

const TopicSuggestionsEnhanceDialog: React.FC<TopicSuggestionsEnhanceDialogProps> = ({
  open,
  onClose,
  onAccept,
  onReject,
  originalSuggestions,
  enhancedSuggestions,
  loading,
  topic,
  type = 'topic',
}) => {
  const handleAccept = () => {
    onAccept(enhancedSuggestions);
    onClose();
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  const getTitle = () => {
    return type === 'hypothesis' 
      ? `Enhanced Hypothesis Suggestions for "${topic}"`
      : `Enhanced Topic Suggestions for "${topic}"`;
  };

  const getLoadingText = () => {
    return type === 'hypothesis' 
      ? 'Enhancing hypothesis suggestions...'
      : 'Enhancing topic suggestions...';
  };

  const getDescriptionText = () => {
    return type === 'hypothesis'
      ? 'Review the enhanced hypothesis suggestions below. The AI has improved them to be more engaging and specific.'
      : 'Review the enhanced topic suggestions below. The AI has improved them to be more engaging and specific.';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="enhance-dialog-title"
      aria-describedby="enhance-dialog-description"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="enhance-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MagicIcon sx={{ color: '#9c27b0' }} />
        {getTitle()}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            gap: 2,
            minHeight: '200px'
          }}>
            <CircularProgress size={40} sx={{ color: '#9c27b0' }} />
            <Typography variant="body2" color="text.secondary">
              {getLoadingText()}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {getDescriptionText()}
            </Typography>

            {/* Debug Info */}
            {/* {console.log('🎨 Dialog - Original suggestions:', originalSuggestions)}
            {console.log('🎨 Dialog - Enhanced suggestions:', enhancedSuggestions)}
            {console.log('🎨 Dialog - Enhanced suggestions length:', enhancedSuggestions.length)}
            {console.log('🎨 Dialog - Loading state:', loading)} */}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {enhancedSuggestions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No enhanced suggestions available. Please try again.
                  <br />
                  <small>Debug: Enhanced array length = {enhancedSuggestions.length}, Loading = {loading ? 'true' : 'false'}</small>
                </Typography>
              ) : enhancedSuggestions.map((enhanced, index) => (
                <Box key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                  {/* Original Suggestion */}
                  <Box sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5, display: 'block' }}>
                      Original:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#666' }}>
                      {originalSuggestions[index] || `Original suggestion ${index + 1} not available`}
                    </Typography>
                  </Box>

                  {/* Enhanced Suggestion */}
                  <Box sx={{
                    p: 2,
                    backgroundColor: 'rgba(156, 39, 176, 0.02)',
                    borderLeft: '3px solid #9c27b0'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <MagicIcon sx={{ fontSize: 14, color: '#9c27b0' }} />
                      <Typography variant="caption" color="#9c27b0" sx={{ fontWeight: 500 }}>
                        Enhanced:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#333' }}>
                      {enhanced}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!loading && (
          <>
            <Button onClick={handleReject} color="primary">
              Reject Enhanced Versions
            </Button>
            <Button
              onClick={handleAccept}
              color="primary"
              variant="contained"
              sx={{
                bgcolor: '#9c27b0',
                '&:hover': { bgcolor: '#7b1fa2' }
              }}
              startIcon={<MagicIcon />}
            >
              Accept Enhanced Suggestions
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TopicSuggestionsEnhanceDialog;
