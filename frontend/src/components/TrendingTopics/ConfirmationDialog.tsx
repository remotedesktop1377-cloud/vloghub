import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  pendingField: 'topicDetails' | 'hypothesis';
  originalText: string;
  enhancedText: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onAccept,
  onReject,
  pendingField,
  originalText,
  enhancedText
}) => {
  const handleAccept = () => {
    onAccept();
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
    >
      <DialogTitle id="confirm-dialog-title">Confirm Enhance</DialogTitle>
      <DialogContent>
        <Typography id="confirm-dialog-description">
          The enhanced text is ready. Would you like to accept the changes?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Original: "{originalText}"
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Enhanced: "{enhancedText}"
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReject} color="primary">
          Reject
        </Button>
        <Button onClick={handleAccept} color="primary" variant="contained">
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 