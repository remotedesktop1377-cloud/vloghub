import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  TextField,
  Chip
} from '@mui/material';
import { 
  AutoFixHigh as MagicIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Description as ScriptIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { getDirectionSx, isRTLLanguage } from '../../utils/languageUtils';
import { toast } from 'react-toastify';

interface ScriptApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  script: string;
  topic: string;
  language?: string;
  onScriptChange?: (newScript: string) => void;
}

const ScriptApprovalDialog: React.FC<ScriptApprovalDialogProps> = ({
  open,
  onClose,
  onApprove,
  onReject,
  script,
  topic,
  language = 'english',
  onScriptChange,
}) => {
  // Script editing states
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState(script);
  const [estimatedDuration, setEstimatedDuration] = useState('');

  // Calculate estimated duration based on script content
  const calculateDuration = (scriptContent: string): string => {
    if (!scriptContent.trim()) return '0';
    
    const words = scriptContent.trim().split(/\s+/).length;
    const averageWordsPerMinute = 155;
    const minutes = words / averageWordsPerMinute;
    
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    } else if (minutes < 60) {
      const wholeMinutes = Math.floor(minutes);
      const seconds = Math.round((minutes - wholeMinutes) * 60);
      return seconds > 0 ? `${wholeMinutes}m ${seconds}s` : `${wholeMinutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Update edited script and duration when script prop changes
  useEffect(() => {
    setEditedScript(script);
    setEstimatedDuration(calculateDuration(script));
  }, [script]);

  // Script editing functions
  const handleStartEditingScript = () => {
    setIsEditingScript(true);
    setEditedScript(script);
  };

  const handleSaveScript = () => {
    if (onScriptChange) {
      onScriptChange(editedScript);
    }
    setIsEditingScript(false);
    toast.success('Script updated successfully!');
  };

  const handleCancelEditingScript = () => {
    setEditedScript(script);
    setIsEditingScript(false);
  };

  const handleScriptContentChange = (newScript: string) => {
    setEditedScript(newScript);
    setEstimatedDuration(calculateDuration(newScript));
  };
  const handleApprove = () => {
    onApprove();
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
      aria-labelledby="script-approval-dialog-title"
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle 
        id="script-approval-dialog-title" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          bgcolor: 'primary.main',
          color: 'white',
          py: 2
        }}
      >
        <ScriptIcon />
        Generated Script for "{topic}"
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                         <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
               ✍️ Review & customize your script before final approval
             </Typography>
            
                         {/* Duration Display - moved to top right */}
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <TimeIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
               <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                 Estimated Duration:
               </Typography>
               <Chip 
                 label={estimatedDuration} 
                 size="small" 
                 color="success" 
                 sx={{ fontSize: '0.75rem', fontWeight: 600 }}
               />
             </Box>
          </Box>

          {isEditingScript ? (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={15}
                variant="outlined"
                value={editedScript}
                onChange={(e) => handleScriptContentChange(e.target.value)}
                placeholder="Edit your script content..."
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: isRTLLanguage(language) 
                      ? '"Noto Sans Arabic", "Noto Nastaliq Urdu", "Arial Unicode MS", sans-serif'
                      : '"Roboto", "Arial", sans-serif',
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    ...getDirectionSx(language)
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {editedScript.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon sx={{ fontSize: '0.9rem', color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                    Live: {estimatedDuration}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                bgcolor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: 2,
                maxHeight: '50vh',
                overflow: 'auto',
                ...getDirectionSx(language)
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  fontSize: '0.95rem',
                  fontFamily: isRTLLanguage(language) 
                    ? '"Noto Sans Arabic", "Noto Nastaliq Urdu", "Arial Unicode MS", sans-serif'
                    : '"Roboto", "Arial", sans-serif',
                  ...getDirectionSx(language)
                }}
              >
                {script}
              </Typography>
            </Paper>
          )}
        </Box>

      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', gap: 2, justifyContent: 'space-between' }}>
        {/* Left side - Edit Script button when not editing, Save/Cancel buttons when editing */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isEditingScript ? (
            <Button
              variant="outlined"
              size="medium"
              startIcon={<EditIcon />}
              onClick={handleStartEditingScript}
              sx={{ textTransform: 'none' }}
            >
              Edit Script
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<CancelIcon />}
                onClick={handleCancelEditingScript}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="medium"
                startIcon={<SaveIcon />}
                onClick={handleSaveScript}
                sx={{ textTransform: 'none' }}
              >
                Save Changes
              </Button>
            </>
          )}
        </Box>

        {/* Right side - Main action buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            onClick={handleReject} 
            variant="outlined"
            color="secondary"
            sx={{
              minWidth: 120,
              py: 1,
              fontSize: '0.9rem'
            }}
          >
            Reject & Try Again
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="primary"
            sx={{
              minWidth: 120,
              py: 1,
              fontSize: '0.9rem',
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#388e3c' }
            }}
            startIcon={<CheckIcon />}
          >
            Approve & Continue
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ScriptApprovalDialog;
