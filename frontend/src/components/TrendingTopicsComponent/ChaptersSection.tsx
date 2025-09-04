import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Switch,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Create as CreateIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  DragIndicator as DragIcon,
  AutoFixHigh as MagicIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Chapter } from '../../types/chapters';
import { HelperFunctions } from '../../utils/helperFunctions';
import { ImageViewModal } from '../ui/ImageViewer/ImageViewModal';
import { useImageViewer, formatChapterImages } from '../../hooks/useImageViewer';
import { PRIMARY, SUCCESS, WARNING, ERROR, INFO, PURPLE, NEUTRAL, TEXT, BORDER, HOVER, SPECIAL } from '../../styles/colors';
import ImageSearch from './ImageSearch';

interface ChaptersSectionProps {
  chapters: Chapter[];
  chaptersGenerated: boolean;
  generatingChapters: boolean;
  editingChapter: number | null;
  editHeading: string;
  editNarration: string;
  selectedChapterIndex: number;
  rightTabIndex: number;
  aiImagesEnabled: boolean;
  imagesLoading: boolean;
  generatedImages: string[];
  aiPrompt: string;
  pickerOpen: boolean;
  pickerChapterIndex: number | null;
  pickerNarrations: string[];
  pickerLoading: boolean;
  uploadedImages: string[];
  isDraggingUpload: boolean;
  chapterImagesMap: Record<number, string[]>;
  selectedText: { chapterIndex: number; text: string; startIndex: number; endIndex: number } | null;
  onAddChapterAfter: (index: number) => void;
  onDeleteChapter: (index: number) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  onEditHeadingChange: (heading: string) => void;
  onEditNarrationChange: (narration: string) => void;
  onStartEdit: (index: number, heading: string, narration: string) => void;
  onDragEnd: (result: DropResult) => void;
  onSelectChapter: (index: number) => void;
  onRightTabChange: (index: number) => void;
  onAIPromptChange: (prompt: string) => void;
  onUseAIChange: (enabled: boolean) => void;
  onGenerateImages: () => void;
  onImageSelect: (imageUrl: string) => void;
  onImageDeselect: (imageUrl: string) => void;
  onDownloadImage: (src: string, idx: number) => void;
  onTriggerFileUpload: () => void;
  onUploadFiles: (files: FileList | null) => void;
  onPickerOpen: (open: boolean) => void;
  onPickerChapterIndex: (index: number | null) => void;
  onPickerLoading: (loading: boolean) => void;
  onPickerNarrations: (narrations: string[]) => void;
  onChapterImagesMapChange: (map: Record<number, string[]>) => void;
  onGeneratedImagesChange: (images: string[]) => void;
  onRightTabIndexChange: (index: number) => void;
  mediaManagementOpen: boolean;
  mediaManagementChapterIndex: number | null;
  onMediaManagementOpen: (open: boolean) => void;
  onMediaManagementChapterIndex: (index: number | null) => void;
  onChaptersUpdate: (chapters: Chapter[]) => void;
  onTextSelection: (chapterIndex: number, event: React.MouseEvent) => void;
  onAddKeyword: () => void;
  onClearSelection: () => void;
  onToolbarInteraction: (interacting: boolean) => void;
  language: string;
  onGoogleImagePreview?: (imageUrl: string) => void;
}

// Component to render text with highlighted keywords that preserves text selection
const TextWithHighlights: React.FC<{ text: string; keywords: string[] }> = ({ text, keywords }) => {
  if (!keywords || keywords.length === 0) {
    return <>{text}</>;
  }

  // Simple approach: just render the text normally for now to fix selection issues
  // We'll add highlighting back later with a better approach
  return <>{text}</>;
};

const ChaptersSection: React.FC<ChaptersSectionProps> = ({
  chapters,
  chaptersGenerated,
  generatingChapters,
  editingChapter,
  editNarration,
  selectedChapterIndex,
  chapterImagesMap,
  selectedText,
  onAddChapterAfter,
  onDeleteChapter,
  onSaveEdit,
  onCancelEdit,
  onEditNarrationChange,
  onStartEdit,
  onDragEnd,
  onSelectChapter,
  onPickerOpen,
  onPickerChapterIndex,
  onPickerLoading,
  onPickerNarrations,
  onChapterImagesMapChange,
  mediaManagementOpen,
  mediaManagementChapterIndex,
  onMediaManagementOpen,
  onMediaManagementChapterIndex,
  onChaptersUpdate,
  onTextSelection,
  onAddKeyword,
  onClearSelection,
  onToolbarInteraction,
  language,
  onGoogleImagePreview,
}) => {
  // Image viewer hook for enhanced image viewing
  const imageViewer = useImageViewer();

  // Handle opening image viewer for a chapter
  const handleImageClick = (chapterIndex: number, imageIndex: number = 0) => {
    const chapter = chapters[chapterIndex];
    const chapterImages = chapterImagesMap[chapterIndex] || [];

    const images = formatChapterImages(
      chapterImages,
      chapter.assets?.images?.[0] || undefined,
    );

    if (images.length > 0) {
      imageViewer.openViewer(images, imageIndex, 'preview');
    }
  };

  return (
    <Paper sx={{ minHeight: '400px' }}>
      {chaptersGenerated && chapters.length > 0 ? (
        <Box sx={{ width: '100%' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="chapters" isDropDisabled={true} isCombineEnabled={true} ignoreContainerClipping={true}>
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, alignItems: 'stretch', width: '100%' }}
                >
                  {chapters.map((chapter, index) => (
                    <Box key={chapter.id || index.toString()} sx={{ width: '100%' }}>
                      <Draggable key={(chapter.id || index.toString()) + '-draggable'} draggableId={chapter.id || index.toString()} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            variant="elevation"
                            sx={{
                              transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                              boxShadow: snapshot.isDragging ? 8 : 0,
                              width: '100%',
                              bgcolor: selectedChapterIndex === index ? 'rgba(29,161,242,0.06)' : 'transparent',
                              cursor: 'pointer',
                              // transition: 'background-color 0.2s ease',
                              overflow: 'hidden',
                              borderColor: selectedChapterIndex === index ? INFO.main : BORDER.dark,
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderRadius: 1,
                              transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                              '&:hover': {
                                borderColor: INFO.main,
                                boxShadow: '0 0 0 3px rgba(29, 161, 242, 0.08)',
                                backgroundColor: 'rgba(29, 161, 242, 0.02)'
                              }
                            }}
                            onClick={() => onSelectChapter(index)}
                          >
                            <CardContent sx={{ p: 0, width: '100%', height: 'auto', '&:last-child': { paddingBottom: 0 } }}>
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%',
                              }}>
                                {/* Drag Handle */}
                                <Box
                                  {...provided.dragHandleProps}
                                  sx={{
                                    mr: 2,
                                    cursor: 'grab',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: SPECIAL.purple,
                                    '&:active': { cursor: 'grabbing' }
                                  }}
                                >
                                  <DragIcon fontSize="small" />
                                </Box>

                                {/* Narration Content - centered with integrated left strip number */}
                                <Box sx={{ width: '100%', height: '100%', minHeight: '120px', }}>
                                                                              <Box 
                                              data-chapter-index={index}
                                              sx={{
                                                display: 'flex',
                                                height: '100%',
                                                bgcolor: 'rgba(29,161,242,0.08)',
                                              }}>
                                    <Box sx={{
                                      width: 48,
                                      color: INFO.main,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 'bold',
                                      flexShrink: 0
                                    }}>
                                      {index + 1}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '100%' }}>
                                      {editingChapter === index ? (
                                        <TextField
                                          value={editNarration}
                                          onChange={(e) => onEditNarrationChange(e.target.value)}
                                          variant="standard"
                                          InputProps={{ disableUnderline: true }}
                                          multiline
                                          minRows={4}
                                          fullWidth
                                          sx={{
                                            px: 1.5, py: 1.5, width: '100%', height: '100%', bgcolor: NEUTRAL.white, fontSize: '1rem',
                                            '& .MuiInputBase-input': {
                                              fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                              lineHeight: HelperFunctions.isRTLLanguage(language) ? 2.5 : 1.8,
                                              fontSize: '1.2rem'
                                            },
                                            ...HelperFunctions.getDirectionSx(language)
                                          }}
                                        />
                                      ) : (
                                        <>
                                          {/* Content Area - 50% Narration + 50% Media */}
                                          <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '100%', minHeight: '120px', bgcolor: 'background.paper', justifyContent: 'center', alignItems: 'center' }}>
                                            {/* Narration Content - 50% */}
                                            <Box sx={{
                                              flex: '0 0 70%',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              height: '100%',
                                              overflow: 'auto',
                                              justifyContent: 'flex-start',
                                              alignItems: 'flex-start'
                                            }}>
                                                                                            <Box
                                                sx={{
                                                  lineHeight: HelperFunctions.isRTLLanguage(language) ? 2.5 : 1.8,
                                                  fontSize: '1.2rem',
                                                  color: 'text.primary',
                                                  px: 1.5,
                                                  py: 1,
                                                  fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                                  userSelect: 'text',
                                                  cursor: 'text',
                                                  ...HelperFunctions.getDirectionSx(language)
                                                }}
                                                onMouseUp={(e) => {
                                                  console.log('Mouse up event triggered on chapter', index);
                                                  onTextSelection(index, e);
                                                }}
                                                onSelect={(e) => {
                                                  console.log('Select event triggered on chapter', index);
                                                  onTextSelection(index, e as any);
                                                }}
                                                onMouseDown={(e) => {
                                                  // Clear any existing selection when starting a new selection
                                                  window.getSelection()?.removeAllRanges();
                                                }}
                                              >
                                                {chapter.narration ? (
                                                  <TextWithHighlights 
                                                    text={chapter.narration} 
                                                    keywords={chapter.highlightedKeywords || []} 
                                                  />
                                                ) : (
                                                  'Narration content will be generated here.'
                                                )}
                                              </Box>

                                              {/* Highlighted Keywords Display */}
                                              {chapter.highlightedKeywords && chapter.highlightedKeywords.length > 0 && (
                                                <Box sx={{ px: 1.5, py: 0.5, width: '100%' }}>
                                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="caption" sx={{
                                                      color: 'text.secondary',
                                                      fontWeight: 600,
                                                      display: 'block'
                                                    }}>
                                                      Keywords ({chapter.highlightedKeywords.length}):
                                                    </Typography>
                                                    <Button
                                                      size="small"
                                                      variant="text"
                                                      color="error"
                                                      onClick={() => {
                                                        onChaptersUpdate(chapters.map((ch, idx) => 
                                                          idx === index 
                                                            ? { ...ch, highlightedKeywords: [] }
                                                            : ch
                                                        ));
                                                        if (typeof window !== 'undefined' && (window as any).toast) {
                                                          (window as any).toast.success('Cleared all keywords');
                                                        }
                                                      }}
                                                      sx={{
                                                        minWidth: 'auto',
                                                        px: 1,
                                                        py: 0.25,
                                                        fontSize: '0.7rem',
                                                        height: '20px',
                                                        textTransform: 'none'
                                                      }}
                                                    >
                                                      Clear All
                                                    </Button>
                                                  </Box>
                                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {chapter.highlightedKeywords.map((keyword, keywordIndex) => (
                                                      <Box
                                                        key={keywordIndex}
                                                        data-keyword-badge="true"
                                                        sx={{
                                                          bgcolor: SUCCESS.light,
                                                          color: SUCCESS.dark,
                                                          px: 1,
                                                          py: 0.25,
                                                          borderRadius: 0.5,
                                                          fontSize: '0.75rem',
                                                          fontWeight: 500,
                                                          border: `1px solid ${SUCCESS.main}`,
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: 0.5,
                                                          cursor: 'pointer',
                                                          '&:hover': {
                                                            bgcolor: SUCCESS.main,
                                                            color: SUCCESS.light,
                                                          }
                                                        }}
                                                        onClick={() => {
                                                          const updatedKeywords = chapter.highlightedKeywords?.filter((_, idx) => idx !== keywordIndex) || [];
                                                          onChaptersUpdate(chapters.map((ch, idx) => 
                                                            idx === index 
                                                              ? { ...ch, highlightedKeywords: updatedKeywords }
                                                              : ch
                                                          ));
                                                          // Show toast notification
                                                          if (typeof window !== 'undefined' && (window as any).toast) {
                                                            (window as any).toast.success(`Removed "${keyword}" from keywords`);
                                                          }
                                                        }}
                                                      >
                                                        <span>{keyword}</span>
                                                        <Box
                                                          sx={{
                                                            width: 18,
                                                            height: 18,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderRadius: '50%',
                                                            bgcolor: 'rgba(0,0,0,0.15)',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            color: 'inherit',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                              bgcolor: 'rgba(255,0,0,0.2)',
                                                              transform: 'scale(1.1)',
                                                            }
                                                          }}
                                                        >
                                                          ×
                                                        </Box>
                                                      </Box>
                                                    ))}
                                                  </Box>
                                                </Box>
                                              )}

                                              {/* Text Selection Toolbar */}
                                              {selectedText && selectedText.chapterIndex === index && (() => {
                                                const chapter = chapters[index];
                                                const currentKeywords = chapter.highlightedKeywords || [];
                                                const selectedTextLower = selectedText?.text.toLowerCase().trim() || '';
                                                
                                                // Check for conflicts
                                                const exactMatch = currentKeywords.some(keyword => keyword.toLowerCase().trim() === selectedTextLower);
                                                const containsExisting = currentKeywords.some(keyword => selectedTextLower.includes(keyword.toLowerCase().trim()));
                                                const isContainedInExisting = currentKeywords.some(keyword => keyword.toLowerCase().trim().includes(selectedTextLower));
                                                
                                                return (
                                                <Box 
                                                  data-toolbar="keyword-toolbar"
                                                  sx={{
                                                    position: 'fixed',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    bgcolor: 'background.paper',
                                                    border: `2px solid ${exactMatch || containsExisting || isContainedInExisting ? '#f44336' : SUCCESS.main}`,
                                                    borderRadius: 2,
                                                    p: 1.5,
                                                    boxShadow: 4,
                                                    zIndex: 10000,
                                                    display: 'flex',
                                                    gap: 1,
                                                    alignItems: 'center',
                                                    minWidth: '200px',
                                                    justifyContent: 'center'
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                  onMouseEnter={() => onToolbarInteraction(true)}
                                                  onMouseLeave={() => onToolbarInteraction(false)}
                                                >
                                                  <Typography variant="body2" sx={{ 
                                                    color: exactMatch || containsExisting || isContainedInExisting ? 'error.main' : 'text.primary', 
                                                    fontWeight: 500 
                                                  }}>
                                                    "{selectedText?.text}"
                                                  </Typography>
                                                  
                                                  {exactMatch ? (
                                                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                                                      Already exists
                                                    </Typography>
                                                  ) : containsExisting ? (
                                                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                                                      Contains existing keywords
                                                    </Typography>
                                                  ) : isContainedInExisting ? (
                                                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                                                      Part of existing keyword
                                                    </Typography>
                                                  ) : (
                                                    <Button
                                                      size="small"
                                                      variant="contained"
                                                      color="success"
                                                      onClick={onAddKeyword}
                                                      sx={{
                                                        minWidth: 'auto',
                                                        px: 2,
                                                        py: 0.5,
                                                        fontSize: '0.8rem',
                                                        height: '32px',
                                                        fontWeight: 600
                                                      }}
                                                    >
                                                      Add Keyword
                                                    </Button>
                                                  )}
                                                  
                                                  <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => {
                                                      onClearSelection();
                                                      window.getSelection()?.removeAllRanges();
                                                    }}
                                                    sx={{
                                                      minWidth: 'auto',
                                                      px: 2,
                                                      py: 0.5,
                                                      fontSize: '0.8rem',
                                                      height: '32px',
                                                      fontWeight: 600
                                                    }}
                                                  >
                                                    Cancel
                                                  </Button>
                                                </Box>
                                                );
                                              })()}

                                            </Box>

                                            {/* Media Section - 50% */}
                                            <Box sx={{
                                              flex: '0 0 30%',
                                              px: 1.5,
                                              py: 1,
                                              height: '100%',
                                              // maxHeight: '120px',
                                              // overflow: 'auto',
                                              // bgcolor: 'background.default',
                                              borderLeft: '1px solid',
                                              borderLeftColor: 'divider'
                                            }}>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '1.05rem' }}>
                                                  📎 Media ({(chapterImagesMap[index] || []).length + (chapter.assets?.images ? 1 : 0)})
                                                </Typography>
                                                <Button
                                                  size="small"
                                                  variant="outlined"
                                                  sx={{
                                                    fontSize: '1rem',
                                                    py: 0.4,
                                                    px: 0.9,
                                                    minHeight: 'auto',
                                                    borderColor: 'primary.main',
                                                    color: 'primary.main',
                                                    '&:hover': {
                                                      borderColor: 'primary.dark',
                                                      bgcolor: 'action.hover'
                                                    }
                                                  }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMediaManagementChapterIndex(index);
                                                    onMediaManagementOpen(true);
                                                  }}
                                                >
                                                  {((chapterImagesMap[index] || []).length > 0 || (chapter.assets && Array.isArray(chapter.assets.images) ? chapter.assets.images.length > 0 : false)) ? 'Manage' : 'Add'}
                                                </Button>
                                              </Box>

                                              {/* Media Display */}
                                              {((chapterImagesMap[index] || []).length > 0 || (chapter.assets && Array.isArray(chapter.assets.images) ? chapter.assets.images.length > 0 : false)) ? (
                                                <>
                                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                                                    {/* Show Generated Chapter Image First */}
                                                    {chapter.assets && Array.isArray(chapter.assets.images) && chapter.assets.images.length > 0 && (
                                                      <Box
                                                        sx={{
                                                          position: 'relative',
                                                          width: '75px',
                                                          height: '75px',
                                                          borderRadius: 0.5,
                                                          overflow: 'hidden',
                                                          border: `2px solid ${SUCCESS.main}`,
                                                          cursor: 'pointer',
                                                          transition: 'transform 0.2s',
                                                          '&:hover': {
                                                            transform: 'scale(1.02)',
                                                            borderColor: '#388e3c'
                                                          }
                                                        }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleImageClick(index, 0);
                                                        }}
                                                      >
                                                        <img
                                                          src={chapter.assets.images[0] || ''}
                                                          alt={`Generated chapter ${index + 1} Image`}
                                                          style={{
                                                            position: 'absolute',
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                          }}
                                                        />
                                                        {/* Delete Button */}
                                                        <IconButton
                                                          size="small"
                                                          sx={{
                                                            position: 'absolute',
                                                            top: 2,
                                                            right: 2,
                                                            bgcolor: 'background.paper',
                                                            width: 14,
                                                            height: 14,
                                                            minWidth: 14,
                                                            '&:hover': { bgcolor: 'background.paper' }
                                                          }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Remove the AI generated image from chapter
                                                            const updatedChapters = chapters.map((ch, chIndex) => {
                                                              if (chIndex === index) {
                                                                return {
                                                                  ...ch,
                                                                  assets: {
                                                                    ...ch.assets,
                                                                    images: ch.assets?.images?.slice(1) || null
                                                                  }
                                                                };
                                                              }
                                                              return ch;
                                                            });
                                                            onChaptersUpdate(updatedChapters);
                                                          }}
                                                        >
                                                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                          </svg>
                                                        </IconButton>
                                                      </Box>
                                                    )}

                                                    {/* Show Selected Images from Google Search */}
                                                    {chapter.assets && Array.isArray(chapter.assets.images) && chapter.assets.images.slice(1).map((imageUrl, imgIndex) => (
                                                      <Box
                                                        key={`selected-${imgIndex}`}
                                                        sx={{
                                                          position: 'relative',
                                                          width: '75px',
                                                          height: '75px',
                                                          borderRadius: 0.5,
                                                          overflow: 'hidden',
                                                          border: `2px solid ${PRIMARY.main}`,
                                                          cursor: 'pointer',
                                                          transition: 'transform 0.2s',
                                                          '&:hover': {
                                                            transform: 'scale(1.02)',
                                                            borderColor: PRIMARY.dark
                                                          }
                                                        }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const imageIndex = 1 + imgIndex; // +1 because index 0 is AI generated
                                                          handleImageClick(index, imageIndex);
                                                        }}
                                                      >
                                                        <img
                                                          src={imageUrl}
                                                          alt={`Selected Image ${imgIndex + 1}`}
                                                          style={{
                                                            position: 'absolute',
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                          }}
                                                        />
                                                        {/* Delete Button */}
                                                        <IconButton
                                                          size="small"
                                                          sx={{
                                                            position: 'absolute',
                                                            top: 2,
                                                            right: 2,
                                                            bgcolor: 'background.paper',
                                                            width: 14,
                                                            height: 14,
                                                            minWidth: 14,
                                                            '&:hover': { bgcolor: 'background.paper' }
                                                          }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Remove the selected image from chapter assets
                                                            const updatedChapters = chapters.map((ch, chIndex) => {
                                                              if (chIndex === index) {
                                                                const currentImages = ch.assets && Array.isArray(ch.assets.images) ? ch.assets.images : [];
                                                                const updatedImages = currentImages.filter((_, i) => i !== (imgIndex + 1)); // +1 because we're skipping AI image
                                                                return {
                                                                  ...ch,
                                                                  assets: {
                                                                    ...ch.assets,
                                                                    images: updatedImages.length > 0 ? updatedImages : null
                                                                  }
                                                                };
                                                              }
                                                              return ch;
                                                            });
                                                            onChaptersUpdate(updatedChapters);
                                                          }}
                                                        >
                                                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                          </svg>
                                                        </IconButton>
                                                      </Box>
                                                    ))}

                                                    {/* Show Additional Images */}
                                                    {(chapterImagesMap[index] || []).slice(0, 4).map((imageUrl, imgIndex) => (
                                                      <Box
                                                        key={imgIndex}
                                                        sx={{
                                                          position: 'relative',
                                                          width: '75px',
                                                          height: '75px',
                                                          borderRadius: 0.5,
                                                          overflow: 'hidden',
                                                          border: `1px solid ${BORDER.light}`,
                                                          cursor: 'pointer',
                                                          transition: 'transform 0.2s',
                                                          '&:hover': {
                                                            transform: 'scale(1.02)',
                                                            borderColor: PRIMARY.main
                                                          }
                                                        }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const imageIndex = chapter.assets?.images?.[imgIndex] ? imgIndex + 1 : imgIndex;
                                                          handleImageClick(index, imageIndex);
                                                        }}
                                                      >
                                                        <img
                                                          src={imageUrl}
                                                          alt={`Scene ${index + 1} Media ${imgIndex + 1}`}
                                                          style={{
                                                            position: 'absolute',
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                          }}
                                                        />
                                                        {/* Delete Button */}
                                                        <IconButton
                                                          size="small"
                                                          sx={{
                                                            position: 'absolute',
                                                            top: 2,
                                                            right: 2,
                                                            bgcolor: 'background.paper',
                                                            width: 14,
                                                            height: 14,
                                                            minWidth: 14,
                                                            '&:hover': { bgcolor: 'background.paper' }
                                                          }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const currentImages = chapterImagesMap[index] || [];
                                                            const updatedImages = currentImages.filter((_, i) => i !== imgIndex);
                                                            onChapterImagesMapChange({
                                                              ...chapterImagesMap,
                                                              [index]: updatedImages
                                                            });
                                                          }}
                                                        >
                                                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke={ERROR.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                          </svg>
                                                        </IconButton>
                                                      </Box>
                                                    ))}
                                                    {(chapterImagesMap[index] || []).length > 4 && (
                                                      <Box sx={{
                                                        position: 'relative',
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: 0.5,
                                                        border: `1px dashed ${BORDER.medium}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: SPECIAL.lightGray,
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        color: TEXT.dark
                                                      }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          onMediaManagementChapterIndex(index);
                                                          onMediaManagementOpen(true);
                                                        }}
                                                      >
                                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                          +{(chapterImagesMap[index] || []).length - 4}
                                                        </Box>
                                                      </Box>
                                                    )}
                                                  </Box>
                                                </>
                                              ) : (
                                                <Box sx={{
                                                  border: '1px dashed',
                                                  borderColor: 'divider',
                                                  borderRadius: 1,
                                                  p: 1,
                                                  textAlign: 'center',
                                                  bgcolor: 'background.default',
                                                  cursor: generatingChapters ? 'default' : 'pointer',
                                                  minHeight: '60px',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'center',
                                                  justifyContent: 'center'
                                                }}
                                                  onClick={(e) => {
                                                    if (!generatingChapters) {
                                                      e.stopPropagation();
                                                      onMediaManagementChapterIndex(index);
                                                      onMediaManagementOpen(true);
                                                    }
                                                  }}
                                                >
                                                  {generatingChapters ? (
                                                    <>
                                                      <CircularProgress size={16} sx={{ mb: 0.5 }} />
                                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
                                                        Generating AI image...
                                                      </Typography>
                                                    </>
                                                  ) : (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
                                                      Click to add media
                                                    </Typography>
                                                  )}
                                                </Box>
                                              )}
                                            </Box>
                                          </Box>
                                        </>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Chapter Actions */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2, alignSelf: 'center' }}>
                                  {editingChapter === index ? (
                                    <>
                                      {/* Save Button */}
                                      <IconButton
                                        size="small"
                                        onClick={() => onSaveEdit(index)}
                                        sx={{
                                          color: SUCCESS.main,
                                          '&:hover': {
                                            bgcolor: HOVER.success,
                                            color: SUCCESS.dark
                                          },
                                          width: 36,
                                          height: 36,
                                        }}
                                        title="Save changes"
                                      >
                                        <CheckIcon fontSize="small" />
                                      </IconButton>

                                      {/* Cancel Button */}
                                      <IconButton
                                        size="small"
                                        onClick={onCancelEdit}
                                        sx={{
                                          color: WARNING.main,
                                          '&:hover': {
                                            bgcolor: HOVER.warning,
                                            color: WARNING.dark
                                          },
                                          width: 36,
                                          height: 36,
                                        }}
                                        title="Cancel editing"
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </>
                                  ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, visibility: 'hidden' }}>
                                      {/* Magic variations for this chapter */}
                                      <IconButton
                                        className="chapter-actions"
                                        size="small"
                                        onClick={async () => {
                                          try {
                                            onPickerOpen(true);
                                            onPickerChapterIndex(index);
                                            onPickerLoading(true);
                                            const chapter = chapters[index];
                                            const res = await fetch('/api/get-narration-variations', {
                                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                narration: chapter.narration,
                                                noOfNarrations: 5
                                              })
                                            });
                                            const data = await res.json();
                                            const vars: string[] = Array.isArray(data?.variations) ? data.variations : [];
                                            onPickerNarrations(vars);
                                          } catch (e) {
                                            console.error('picker fetch failed', e);
                                            onPickerNarrations([chapters[index].narration]);
                                          } finally {
                                            onPickerLoading(false);
                                          }
                                        }}
                                        sx={{
                                          opacity: selectedChapterIndex === index ? 1 : 0,
                                          transition: 'opacity 0.2s ease',
                                          color: INFO.main,
                                          '&:hover': { bgcolor: HOVER.info, color: INFO.dark },
                                          width: 36, height: 36,
                                        }}
                                        title="Magic variations"
                                      >
                                        <MagicIcon fontSize="small" />
                                      </IconButton>
                                      {/* Edit Chapter Button */}
                                      <IconButton
                                        className="chapter-actions"
                                        size="small"
                                        onClick={() => onStartEdit(index, chapter.narration || '', chapter.narration || '')}
                                        sx={{
                                          opacity: selectedChapterIndex === index ? 1 : 0,
                                          transition: 'opacity 0.2s ease',
                                          color: WARNING.main,
                                          '&:hover': {
                                            bgcolor: HOVER.warning,
                                            color: WARNING.dark
                                          },
                                          width: 36,
                                          height: 36,
                                        }}
                                        title="Edit chapter"
                                      >
                                        <CreateIcon fontSize="small" />
                                      </IconButton>

                                      {/* Delete Icon */}
                                      <IconButton
                                        className="chapter-actions"
                                        size="small"
                                        onClick={() => onDeleteChapter(index)}
                                        sx={{
                                          opacity: selectedChapterIndex === index ? 1 : 0,
                                          transition: 'opacity 0.2s ease',
                                          color: ERROR.main,
                                          '&:hover': {
                                            bgcolor: HOVER.error,
                                            color: ERROR.dark
                                          },
                                          width: 36,
                                          height: 36,
                                        }}
                                        title="Delete chapter"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>

                                      {/* Add Chapter After This One Button */}
                                      <IconButton
                                        className="chapter-actions"
                                        size="small"
                                        onClick={() => onAddChapterAfter(index)}
                                        sx={{
                                          opacity: selectedChapterIndex === index ? 1 : 0,
                                          transition: 'opacity 0.2s ease',
                                          color: INFO.main,
                                          '&:hover': {
                                            bgcolor: HOVER.info,
                                            color: INFO.dark
                                          },
                                          width: 36,
                                          height: 36,
                                        }}
                                        title="Add scene after this one"
                                      >
                                        <AddIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>

                              </Box>
                            </CardContent>
                          </Card>

                        )}
                      </Draggable>
                    </Box>
                  ))}

                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      ) : null}

      {/* Media Management Dialog */}
      <Dialog
        open={mediaManagementOpen}
        onClose={() => onMediaManagementOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px', bgcolor: 'background.paper' }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div" sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
            Manage Media - Chapter {(mediaManagementChapterIndex || 0) + 1}
          </Typography>
          <IconButton
            onClick={() => onMediaManagementOpen(false)}
            sx={{
              ml: 1,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke={TEXT.dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '800px' }}>

            {/* Image Search with integrated tabs */}
            <Box sx={{ flex: 1 }}>
              <ImageSearch
                chapterNarration={chapters[mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex]?.narration || ''}
                onImageSelect={(imageUrl) => {
                  const currentIdx = mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex;
                  onChapterImagesMapChange({
                    ...chapterImagesMap,
                    [currentIdx]: [...(chapterImagesMap[currentIdx] || []), imageUrl]
                  });
                }}
                onImagePreview={(imageUrl) => {
                  if (onGoogleImagePreview) {
                    onGoogleImagePreview(imageUrl);
                  } else {
                    // Fallback to existing image viewer
                    imageViewer.openViewer([{ url: imageUrl }], 0, 'preview');
                  }
                }}
                chapterIndex={mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex}
                onChapterUpdate={(chapterIndex, updatedChapter) => {
                  // Update the chapter with new assets
                  const updatedChapters = chapters.map((chapter, index) => {
                    if (index === chapterIndex) {
                      return {
                        ...chapter,
                        assets: {
                          ...chapter.assets,
                          ...updatedChapter.assets
                        }
                      };
                    }
                    return chapter;
                  });
                  onChaptersUpdate(updatedChapters);
                }}
                onDone={() => {
                  onMediaManagementOpen(false);
                  onMediaManagementChapterIndex(null);
                }}
                existingImageUrls={[
                  ...(
                    chapters[mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex]?.assets?.imagesGoogle || []
                  ),
                  ...(
                    chapters[mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex]?.assets?.imagesEnvato || []
                  ),
                  ...(
                    chapters[mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex]?.assets?.images || []
                  )
                ]}
              />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Image View Modal */}
      <ImageViewModal
        open={imageViewer.isOpen}
        onClose={imageViewer.closeViewer}
        images={imageViewer.images}
        currentIndex={imageViewer.currentIndex}
        onIndexChange={imageViewer.setCurrentIndex}
        viewMode={imageViewer.viewMode}
        onViewModeChange={imageViewer.setViewMode}
        title={`Chapter ${chapters.findIndex(ch => {
          const chapterImages = chapterImagesMap[chapters.indexOf(ch)] || [];
          const images = formatChapterImages(
            chapterImages,
            ch.assets?.images?.[0] || undefined,
          );
          return images.some(img => img.url === imageViewer.currentImage?.url);
        }) + 1} Images`}
        showNavigation={true}
        showDownload={true}
        showViewModeSelector={true}
      />
    </Paper>
  );
};

export default ChaptersSection;
