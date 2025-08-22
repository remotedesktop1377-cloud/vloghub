import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { Chapter } from '../../types/chapters';

interface NarrationPickerDialogProps {
  open: boolean;
  onClose: () => void;
  pickerLoading: boolean;
  pickerNarrations: string[];
  chapters: Chapter[];
  pickerChapterIndex: number | null;
  editingChapter: number | null;
  onNarrationSelect: (chapterIndex: number, narration: string) => void;
  onEditNarrationChange?: (narration: string) => void;
}

const NarrationPickerDialog: React.FC<NarrationPickerDialogProps> = ({
  open,
  onClose,
  pickerLoading,
  pickerNarrations,
  chapters,
  pickerChapterIndex,
  editingChapter,
  onNarrationSelect,
  onEditNarrationChange
}) => {
  const handleNarrationSelect = (text: string) => {
    if (pickerChapterIndex === null) return;
    
    onNarrationSelect(pickerChapterIndex, text);
    
    // Update edit narration if currently editing this chapter
    if (editingChapter === pickerChapterIndex && onEditNarrationChange) {
      onEditNarrationChange(text);
    }
    
    onClose();
  };

  const narrationsToShow = pickerNarrations.length > 0 
    ? pickerNarrations 
    : [chapters[pickerChapterIndex ?? 0]?.narration].filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select a narration</DialogTitle>
      <DialogContent>
        {pickerLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {narrationsToShow.map((text, idx) => (
              <Box
                key={idx}
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
                onClick={() => handleNarrationSelect(text)}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {text}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NarrationPickerDialog; 