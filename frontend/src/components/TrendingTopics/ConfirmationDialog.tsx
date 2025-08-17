import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: (selectedOption: string) => void;
  onReject: () => void;
  pendingField: 'topicDetails' | 'hypothesis';
  originalText: string;
  enhancedOptions: string[];
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onAccept,
  onReject,
  pendingField,
  originalText,
  enhancedOptions,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');

  useEffect(() => {
    if (enhancedOptions.length > 0) {
      setSelectedOption(enhancedOptions[0]);
    }
  }, [enhancedOptions]);

  const handleAccept = () => {
    if (selectedOption) {
      // Update the parent component with the selected option
      if (pendingField === 'topicDetails') {
        // This will be handled by the parent's onAccept
        onAccept(selectedOption);
      } else if (pendingField === 'hypothesis') {
        onAccept(selectedOption);
      }
    }
    onClose();
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">Choose Enhanced Option</DialogTitle>
      <DialogContent>
        <Typography id="confirm-dialog-description">
          Select one of the enhanced options below:
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Original: "{originalText}"
        </Typography>
        <Box sx={{ mt: 2 }}>
          {enhancedOptions.map((option, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                backgroundColor: selectedOption === option ? 'rgba(29,161,242,0.1)' : 'transparent',
                borderColor: selectedOption === option ? '#1DA1F2' : '#e0e0e0',
                '&:hover': {
                  borderColor: '#1DA1F2',
                  backgroundColor: 'rgba(29,161,242,0.05)'
                }
              }}
              onClick={() => setSelectedOption(option)}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {option}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReject} color="primary">
          Reject
        </Button>
        <Button 
          onClick={handleAccept} 
          color="primary" 
          variant="contained"
          disabled={!selectedOption}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 