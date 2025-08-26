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
  Chip,
  Divider
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
import { HelperFunctions } from '@/utils/helperFunctions';

interface ScriptApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  script: string;
  topic: string;
  language?: string;
  onScriptChange?: (newScript: string) => void;
  intendedDuration?: string; // minutes from dropdown (e.g., "1")
}

interface ScriptData {
  title?: string;
  hook?: string;
  mainContent?: string;
  conclusion?: string;
  callToAction?: string;
  estimatedWords?: number;
  emotionalTone?: string;
  pacing?: string;
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
  intendedDuration,
}) => {
  // Script editing states
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState(script);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [scriptData, setScriptData] = useState<ScriptData>({});

  // Parse script data from localStorage if available
  useEffect(() => {
    try {
      const storedMetadata = localStorage.getItem('scriptMetadata');
      if (storedMetadata) {
        const metadata = JSON.parse(storedMetadata);
        setScriptData(metadata);
      }
    } catch (error) {
      console.warn('Error parsing script metadata:', error);
    }
  }, [script]);

  // Update edited script and duration when script prop changes
  useEffect(() => {
    setEditedScript(script);
    // Always compute based on current script content
    setEstimatedDuration(HelperFunctions.calculateDuration(script));
  }, [script]);

  // Script editing functions
  const handleStartEditingScript = () => {
    setIsEditingScript(true);
    setEditedScript(script);

    // Parse the current script to populate scriptData for editing
    const currentScript = editedScript || script;
    const lines = currentScript.split('\n');

    let currentSection = '';
    let currentContent = '';
    const newScriptData: ScriptData = { ...scriptData };

    for (const line of lines) {
      if (line.includes('📋 TITLE:')) {
        currentSection = 'title';
        currentContent = '';
      } else if (line.includes('🎯 HOOK:')) {
        if (currentSection && currentContent.trim()) {
          (newScriptData as any)[currentSection] = currentContent.trim();
        }
        currentSection = 'hook';
        currentContent = '';
      } else if (line.includes('📝 MAIN CONTENT:')) {
        if (currentSection && currentContent.trim()) {
          (newScriptData as any)[currentSection] = currentContent.trim();
        }
        currentSection = 'mainContent';
        currentContent = '';
      } else if (line.includes('🏁 CONCLUSION:')) {
        if (currentSection && currentContent.trim()) {
          (newScriptData as any)[currentSection] = currentContent.trim();
        }
        currentSection = 'conclusion';
        currentContent = '';
      } else if (line.includes('🚀 CALL TO ACTION:')) {
        if (currentSection && currentContent.trim()) {
          (newScriptData as any)[currentSection] = currentContent.trim();
        }
        currentSection = 'callToAction';
        currentContent = '';
      } else if (line.trim() && currentSection) {
        currentContent += line + '\n';
      }
    }

    // Save the last section
    if (currentSection && currentContent.trim()) {
      (newScriptData as any)[currentSection] = currentContent.trim();
    }

    setScriptData(newScriptData);
  };

  const handleSaveScript = () => {
    // Combine all sections into a single script
    const combinedScript = [
      scriptData.title && `📋 TITLE:\n${scriptData.title}`,
      scriptData.hook && `🎯 HOOK:\n${scriptData.hook}`,
      scriptData.mainContent && `📝 MAIN CONTENT:\n${scriptData.mainContent}`,
      scriptData.conclusion && `🏁 CONCLUSION:\n${scriptData.conclusion}`,
      scriptData.callToAction && `🚀 CALL TO ACTION:\n${scriptData.callToAction}`
    ].filter(Boolean).join('\n\n');

    // Update the edited script state
    setEditedScript(combinedScript);

    if (onScriptChange) {
      onScriptChange(combinedScript);
    }

    // Save script metadata to localStorage
    try {
      localStorage.setItem('scriptMetadata', JSON.stringify(combinedScript));
    } catch (error) {
      console.warn('Error saving script metadata:', error);
    }

    setIsEditingScript(false);
    toast.success('Script updated successfully!');
  };

  const handleCancelEditingScript = () => {
    setEditedScript(script);
    setIsEditingScript(false);
  };

  const handleApprove = () => {
    onApprove();
    onClose();
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  // Function to render script with embedded titles
  const renderScriptWithTitles = () => {
    const { title, hook, mainContent, conclusion, callToAction } = scriptData;

    // If we have script metadata, format it with sections
    if (title || hook || mainContent || conclusion || callToAction) {
      let formattedScript = '';

      if (title) {
        formattedScript += `📋 TITLE:\n${title}\n\n`;
      }

      if (hook) {
        formattedScript += `🎯 HOOK:\n${hook}\n\n`;
      }

      if (mainContent) {
        formattedScript += `📝 MAIN CONTENT:\n${mainContent}\n\n`;
      }

      if (conclusion) {
        formattedScript += `🏁 CONCLUSION:\n${conclusion}\n\n`;
      }

      if (callToAction) {
        formattedScript += `🚀 CALL TO ACTION:\n${callToAction}\n\n`;
      }

      return formattedScript.trim();
    }

    // Fallback to original script if no metadata
    return script;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="script-approval-dialog-title"
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '95vh',
          overflow: 'hidden'
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
          py: 1
        }}
      >
        <ScriptIcon />
        Generated Script for "{topic}"
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '1.05rem' }}>
              ✍️ Review & customize your script before final approval
            </Typography>

            {/* Duration Display */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.05rem' }}>
                Estimated Duration:
              </Typography>
              <Chip
                label={estimatedDuration}
                size="medium"
                color="success"
                sx={{ fontSize: '1rem', fontWeight: 500, height: 28, '& .MuiChip-label': { px: 1 } }}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {isEditingScript ? (
              <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Hook Section */}
                <Paper elevation={2} sx={{ p: 1, bgcolor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#1976d2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎯 HOOK
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    variant="outlined"
                    value={scriptData.hook || ''}
                    onChange={(e) => setScriptData(prev => ({ ...prev, hook: e.target.value }))}
                    placeholder="Enter your hook content..."
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                        fontSize: '1.1rem',
                        lineHeight: 1.8,
                        ...getDirectionSx(language)
                      }
                    }}
                  />
                </Paper>

                {/* Main Content Section */}
                <Paper elevation={2} sx={{ p: 1, bgcolor: '#f3e5f5', border: '1px solid #9c27b0', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#7b1fa2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 MAIN CONTENT
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    variant="outlined"
                    value={scriptData.mainContent || ''}
                    onChange={(e) => setScriptData(prev => ({ ...prev, mainContent: e.target.value }))}
                    placeholder="Enter your main content..."
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                        fontSize: '1.1rem',
                        lineHeight: 1.8,
                        ...getDirectionSx(language)
                      }
                    }}
                  />
                </Paper>

                {/* Conclusion Section */}
                <Paper elevation={2} sx={{ p: 1, bgcolor: '#e8f5e8', border: '1px solid #4caf50', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#388e3c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🏁 CONCLUSION
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    variant="outlined"
                    value={scriptData.conclusion || ''}
                    onChange={(e) => setScriptData(prev => ({ ...prev, conclusion: e.target.value }))}
                    placeholder="Enter your conclusion..."
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                        fontSize: '1.1rem',
                        lineHeight: 1.8,
                        ...getDirectionSx(language)
                      }
                    }}
                  />
                </Paper>

                {/* Call to Action Section */}
                <Paper elevation={2} sx={{ p: 1, bgcolor: '#fff8e1', border: '1px solid #ff9800', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#f57c00', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🚀 CALL TO ACTION
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    variant="outlined"
                    value={scriptData.callToAction || ''}
                    onChange={(e) => setScriptData(prev => ({ ...prev, callToAction: e.target.value }))}
                    placeholder="Enter your call to action..."
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                        fontSize: '1.1rem',
                        lineHeight: 1.8,
                        ...getDirectionSx(language)
                      }
                    }}
                  />
                </Paper>

                {/* Word Count and Duration */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, }}>
                  {/* Optional summary area can be re-enabled if needed */}
                </Box>
              </Box>
            ) : (
              <Paper
                elevation={2}
                sx={{
                  p: 1,
                  bgcolor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: 2,
                  flex: 1,
                  overflow: 'auto',
                  ...getDirectionSx(language)
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 2.05,
                    fontSize: '1.2rem',
                    fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                    ...getDirectionSx(language)
                  }}
                >
                  {renderScriptWithTitles()}
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>

      </DialogContent>

      <DialogActions sx={{ p: 1, bgcolor: '#f8f9fa', gap: 4, justifyContent: 'space-between' }}>
        {/* Left side - Edit Script button when not editing, Save/Cancel buttons when editing */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isEditingScript ? (
            <Button
              variant="outlined"
              size="large"
              startIcon={<EditIcon />}
              onClick={handleStartEditingScript}
              sx={{ textTransform: 'none', px: 2, py: 1 }}
            >
              Edit Script
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                size="large"
                startIcon={<CancelIcon />}
                onClick={handleCancelEditingScript}
                sx={{ textTransform: 'none', px: 2, py: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveScript}
                sx={{ textTransform: 'none', px: 2, py: 1 }}
              >
                Save Changes
              </Button>
            </>
          )}
        </Box>

        {/* Right side - Main action buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleReject}
            variant="outlined"
            color="secondary"
            size="large"
            sx={{
              minWidth: 160,
              py: 1,
              px: 2,
              fontSize: '1.05rem'
            }}
          >
            Reject & Try Again
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="primary"
            size="large"
            sx={{
              minWidth: 160,
              py: 1,
              px: 2,
              fontSize: '1.05rem',
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
