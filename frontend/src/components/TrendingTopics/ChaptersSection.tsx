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
import { fallbackImages } from '../../data/mockImages';
import { HelperFunctions } from '../../utils/helperFunctions';
import { AudioPlayer } from '../AudioPlayer/AudioPlayer';
import { ImageViewModal, ImageViewMode } from '../ImageViewer/ImageViewModal';
import { useImageViewer, formatChapterImages } from '../../hooks/useImageViewer';

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
  language: string;
}

const ChaptersSection: React.FC<ChaptersSectionProps> = ({
  chapters,
  chaptersGenerated,
  generatingChapters,
  editingChapter,
  editHeading,
  editNarration,
  selectedChapterIndex,
  rightTabIndex,
  aiImagesEnabled,
  imagesLoading,
  generatedImages,
  aiPrompt,
  pickerOpen,
  pickerChapterIndex,
  pickerNarrations,
  pickerLoading,
  uploadedImages,
  isDraggingUpload,
  chapterImagesMap,
  onAddChapterAfter,
  onDeleteChapter,
  onSaveEdit,
  onCancelEdit,
  onEditHeadingChange,
  onEditNarrationChange,
  onStartEdit,
  onDragEnd,
  onSelectChapter,
  onRightTabChange,
  onAIPromptChange,
  onUseAIChange,
  onGenerateImages,
  onImageSelect,
  onImageDeselect,
  onDownloadImage,
  onTriggerFileUpload,
  onUploadFiles,
  onPickerOpen,
  onPickerChapterIndex,
  onPickerLoading,
  onPickerNarrations,
  onChapterImagesMapChange,
  onGeneratedImagesChange,
  onRightTabIndexChange,
  mediaManagementOpen,
  mediaManagementChapterIndex,
  onMediaManagementOpen,
  onMediaManagementChapterIndex,
  onChaptersUpdate,
  language,
}) => {
  // Image viewer hook for enhanced image viewing
  const imageViewer = useImageViewer();

  // Handle opening image viewer for a chapter
  const handleImageClick = (chapterIndex: number, imageIndex: number = 0) => {
    const chapter = chapters[chapterIndex];
    const chapterImages = chapterImagesMap[chapterIndex] || [];

    const images = formatChapterImages(
      chapterImages,
      chapter.assets?.image || undefined,
    );

    if (images.length > 0) {
      imageViewer.openViewer(images, imageIndex, 'preview');
    }
  };

  const getDirectionSx = (lang: string) => {
    if (lang === 'ar' || lang === 'he') {
      return {
        direction: 'rtl',
        textAlign: 'right',
      };
    }
    return {};
  };

  return (
    <Paper sx={{ p: 2, border: '2px dashed #e0e0e0', minHeight: '400px' }}>
      {chaptersGenerated && chapters.length > 0 ? (
        <Box sx={{ width: '100%' }}>
          {/* Full Width - Chapters List */}
          <Box sx={{ width: '100%' }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="chapters">
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
                                borderColor: selectedChapterIndex === index ? '#1DA1F2' : '#e9ecef',
                                borderWidth: 1,
                                borderStyle: 'solid',
                                borderRadius: 1,
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                                '&:hover': {
                                  borderColor: '#1DA1F2',
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
                                      color: '#9c27b0',
                                      '&:active': { cursor: 'grabbing' }
                                    }}
                                  >
                                    <DragIcon fontSize="small" />
                                  </Box>

                                  {/* Narration Content - centered with integrated left strip number */}
                                  <Box sx={{ width: '100%', height: '100%', minHeight: '120px', }}>
                                    <Box sx={{
                                      display: 'flex',
                                      height: '100%',
                                      bgcolor: 'rgba(29,161,242,0.08)',
                                    }}>
                                      <Box sx={{
                                        width: 48,
                                        color: '#1DA1F2',
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
                                            sx={{ px: 1.5, py: 1.5, width: '100%', height: '100%', bgcolor: '#fff', fontSize: '1rem',
                                              '& .MuiInputBase-input': {
                                                fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                                lineHeight: HelperFunctions.isRTLLanguage(language) ? 2.5 : 1.6,
                                              },
                                              ...HelperFunctions.getDirectionSx(language)
                                            }}
                                          />
                                        ) : (
                                          <>
                                            {/* Content Area - 50% Narration + 50% Media */}
                                            <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '100%', minHeight: '120px', bgcolor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                                              {/* Narration Content - 50% */}
                                              <Box sx={{
                                                flex: '1 1 50%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                overflow: 'auto',
                                                justifyContent: 'flex-start',
                                                alignItems: 'flex-start'
                                              }}>
                                                <Typography variant="body2" sx={{
                                                  lineHeight: HelperFunctions.isRTLLanguage(language) ? 2.5 : 1.6,
                                                  color: '#495057',
                                                  fontSize: '1rem',
                                                  px: 1.5,
                                                  py: 1,
                                                  fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                                  ...HelperFunctions.getDirectionSx(language)
                                                }}>
                                                  {chapter.text || 'Narration content will be generated here.'}
                                                </Typography>

                                                {/* Debug Info */}
                                                {/* <Box sx={{ px: 1.5, pb: 0.5 }}>
                                                  <Typography variant="caption" sx={{ 
                                                    fontSize: '0.6rem', 
                                                    color: '#666',
                                                    fontFamily: 'monospace',
                                                    bgcolor: '#f5f5f5',
                                                    px: 0.5,
                                                    py: 0.2,
                                                    borderRadius: 0.5
                                                  }}>
                                                    Audio: {chapter.assets?.audio ? 'EXISTS' : 'NULL'} | 
                                                    Style: {chapter.voiceover_style || 'NONE'} |
                                                    Generating: {generatingChapters ? 'YES' : 'NO'}
                                                  </Typography>
                                                </Box> */}

                                                {/* Audio Player */}
                                                {/* {chapter.assets?.audio && (
                                                  <Box sx={{ px: 1.5, pb: 1 }}>
                                                    <AudioPlayer
                                                      audioUrl={chapter.assets.audio}
                                                      title={`Chapter ${index + 1} Audio`}
                                                      voiceStyle={chapter.voiceover_style}
                                                    />
                                                  </Box>
                                                )} */}

                                                {/* Voice Generation Status */}
                                                {/* {!chapter.assets?.audio && generatingChapters && (
                                                  <Box sx={{ px: 1.5, pb: 1 }}>
                                                    <Box sx={{ 
                                                      display: 'flex', 
                                                      alignItems: 'center', 
                                                      gap: 1,
                                                      p: 1,
                                                      bgcolor: '#e3f2fd',
                                                      borderRadius: 1,
                                                      border: '1px solid #bbdefb'
                                                    }}>
                                                      <CircularProgress size={12} />
                                                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#1976d2' }}>
                                                        Generating voice: {chapter.voiceover_style || 'conversational'}
                                                      </Typography>
                                                    </Box>
                                                  </Box>
                                                )} */}

                                                {/* No Audio Message */}
                                                {/* {!chapter.assets?.audio && !generatingChapters && (
                                                  <Box sx={{ px: 1.5, pb: 1 }}>
                                                    <Typography variant="caption" sx={{ 
                                                      fontSize: '0.65rem', 
                                                      color: '#ff9800',
                                                      fontStyle: 'italic'
                                                    }}>
                                                      No audio generated. Style: {chapter.voiceover_style || 'None'}
                                                    </Typography>
                                                  </Box>
                                                )} */}
                                              </Box>

                                              {/* Media Section - 50% */}
                                              <Box sx={{
                                                flex: '1 1 50%',
                                                px: 1.5,
                                                py: 1,
                                                height: '100%',
                                                maxHeight: '120px',
                                                overflow: 'auto',
                                                bgcolor: '#fafafa',
                                                borderLeft: '1px solid #f0f0f0'
                                              }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#999', fontSize: '0.65rem' }}>
                                                    📎 Media ({(chapterImagesMap[index] || []).length + (chapter.assets?.image ? 1 : 0)})
                                                  </Typography>
                                                  <Button
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                      fontSize: '0.6rem',
                                                      py: 0.2,
                                                      px: 0.6,
                                                      minHeight: 'auto',
                                                      borderColor: '#1976d2',
                                                      color: '#1976d2',
                                                      '&:hover': {
                                                        borderColor: '#1565c0',
                                                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                                                      }
                                                    }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      onMediaManagementChapterIndex(index);
                                                      onMediaManagementOpen(true);
                                                    }}
                                                  >
                                                    {((chapterImagesMap[index] || []).length > 0 || chapter.assets?.image) ? 'Manage' : 'Add'}
                                                  </Button>
                                                </Box>

                                                {/* Media Display */}
                                                {((chapterImagesMap[index] || []).length > 0 || chapter.assets?.image) ? (
                                                  <>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                                                      {/* Show Generated Chapter Image First */}
                                                      {chapter.assets?.image && (
                                                        <Box
                                                          sx={{
                                                            position: 'relative',
                                                            width: '75px',
                                                            height: '75px',
                                                            borderRadius: 0.5,
                                                            overflow: 'hidden',
                                                            border: '2px solid #4caf50',
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
                                                            src={chapter.assets?.image || ''}
                                                            alt={`Generated Chapter ${index + 1} Image`}
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
                                                              bgcolor: 'rgba(255,255,255,0.9)',
                                                              width: 14,
                                                              height: 14,
                                                              minWidth: 14,
                                                              '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                                                            }}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              // Remove the AI generated image from chapter
                                                              const updatedChapters = chapters.map((ch, chIndex) => {
                                                                if (chIndex === index) {
                                                                  return {
                                                                    ...ch,
                                                                    media: {
                                                                      ...ch.assets,
                                                                      image: null
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
                                                          {/* Generated Badge */}
                                                          <Box
                                                            sx={{
                                                              position: 'absolute',
                                                              bottom: 2,
                                                              left: 2,
                                                              bgcolor: '#4caf50',
                                                              color: 'white',
                                                              fontSize: '0.6rem',
                                                              px: 0.5,
                                                              py: 0.1,
                                                              borderRadius: 0.5,
                                                              fontWeight: 'bold'
                                                            }}
                                                          >
                                                            AI
                                                          </Box>
                                                        </Box>
                                                      )}
                                                      {/* Show Additional Images */}
                                                      {(chapterImagesMap[index] || []).slice(0, chapter.assets?.image ? 3 : 4).map((imageUrl, imgIndex) => (
                                                        <Box
                                                          key={imgIndex}
                                                          sx={{
                                                            position: 'relative',
                                                            width: '75px',
                                                            height: '75px',
                                                            borderRadius: 0.5,
                                                            overflow: 'hidden',
                                                            border: '1px solid #e0e0e0',
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.2s',
                                                            '&:hover': {
                                                              transform: 'scale(1.02)',
                                                              borderColor: '#1976d2'
                                                            }
                                                          }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const imageIndex = chapter.assets?.image ? imgIndex + 1 : imgIndex;
                                                            handleImageClick(index, imageIndex);
                                                          }}
                                                        >
                                                          <img
                                                            src={imageUrl}
                                                            alt={`Chapter ${index + 1} Media ${imgIndex + 1}`}
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
                                                              bgcolor: 'rgba(255,255,255,0.9)',
                                                              width: 14,
                                                              height: 14,
                                                              minWidth: 14,
                                                              '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
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
                                                              <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                                                          border: '1px dashed #ccc',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          bgcolor: '#f9f9f9',
                                                          cursor: 'pointer',
                                                          fontSize: '0.5rem',
                                                          color: '#666'
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
                                                    border: '1px dashed #ddd',
                                                    borderRadius: 1,
                                                    p: 1,
                                                    textAlign: 'center',
                                                    bgcolor: '#f9f9f9',
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
                                                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.6rem' }}>
                                                          Generating AI image...
                                                        </Typography>
                                                      </>
                                                    ) : (
                                                      <Typography variant="caption" sx={{ color: '#999', fontSize: '0.6rem' }}>
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
                                            color: '#4caf50',
                                            '&:hover': {
                                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                                              color: '#388e3c'
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
                                            color: '#ff9800',
                                            '&:hover': {
                                              bgcolor: 'rgba(255, 152, 0, 0.1)',
                                              color: '#f57c00'
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
                                      <>
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
                                                  narration: chapter.text,
                                                  noOfNarrations: 5
                                                })
                                              });
                                              const data = await res.json();
                                              const vars: string[] = Array.isArray(data?.variations) ? data.variations : [];
                                              onPickerNarrations(vars);
                                            } catch (e) {
                                              console.error('picker fetch failed', e);
                                              onPickerNarrations([chapters[index].text]);
                                            } finally {
                                              onPickerLoading(false);
                                            }
                                          }}
                                          sx={{
                                            opacity: selectedChapterIndex === index ? 1 : 0,
                                            transition: 'opacity 0.2s ease',
                                            color: '#1DA1F2',
                                            '&:hover': { bgcolor: 'rgba(29,161,242,0.1)', color: '#0d8bd9' },
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
                                          onClick={() => onStartEdit(index, chapter.text || '', chapter.text || '')}
                                          sx={{
                                            opacity: selectedChapterIndex === index ? 1 : 0,
                                            transition: 'opacity 0.2s ease',
                                            color: '#ff9800',
                                            '&:hover': {
                                              bgcolor: 'rgba(255, 152, 0, 0.1)',
                                              color: '#f57c00'
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
                                            color: '#ff4444',
                                            '&:hover': {
                                              bgcolor: 'rgba(255,68,68,0.1)',
                                              color: '#cc0000'
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
                                            color: '#1DA1F2',
                                            '&:hover': {
                                              bgcolor: 'rgba(29, 161, 242, 0.1)',
                                              color: '#0d8bd9'
                                            },
                                            width: 36,
                                            height: 36,
                                          }}
                                          title="Add chapter after this one"
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                      </>
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
        </Box>
      ) : null}

      {/* Media Management Dialog */}
      <Dialog
        open={mediaManagementOpen}
        onClose={() => onMediaManagementOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Manage Media - Chapter {(mediaManagementChapterIndex || 0) + 1}
          </Typography>
          <IconButton
            onClick={() => onMediaManagementOpen(false)}
            sx={{
              ml: 1,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '500px' }}>

            {/* Media Management Tabs */}
            <Box sx={{ flex: 1 }}>
              <Tabs value={rightTabIndex} onChange={(_, v) => onRightTabChange(v)} variant="fullWidth" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                <Tab label="Stock Media" />
                <Tab label="AI Generation" />
              </Tabs>

              <Box sx={{ height: 'calc(100% - 48px)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {rightTabIndex === 0 && (
                  <Box sx={{ p: 1.5, height: '100%' }}>
                    {/* Check if current chapter has any media */}
                    {(chapterImagesMap[mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex] || []).length === 0 ? (
                      // No media - Show centered information message
                      <Box
                        onClick={() => {
                          // Create a temporary file input for this specific upload
                          const tempFileInput = document.createElement('input');
                          tempFileInput.type = 'file';
                          tempFileInput.accept = 'image/*';
                          tempFileInput.multiple = true;
                          tempFileInput.style.display = 'none';
                          tempFileInput.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files && target.files.length > 0) {
                              // Create object URLs for the files
                              const imgs: string[] = [];
                              Array.from(target.files).forEach((file) => {
                                if (file.type.startsWith('image/')) {
                                  const url = URL.createObjectURL(file);
                                  imgs.push(url);
                                }
                              });

                              if (imgs.length > 0) {
                                // Add images to the current chapter
                                const currentIdx = mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex;
                                onChapterImagesMapChange({
                                  ...chapterImagesMap,
                                  [currentIdx]: [...(chapterImagesMap[currentIdx] || []), ...imgs]
                                });
                              }
                            }
                            // Clean up the temporary input
                            document.body.removeChild(tempFileInput);
                          };
                          document.body.appendChild(tempFileInput);
                          tempFileInput.click();
                        }}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          textAlign: 'center',
                          border: '2px dashed #e0e0e0',
                          borderRadius: 2,
                          backgroundColor: 'rgba(249, 250, 251, 1)',
                          '&:hover': {
                            borderColor: '#5b76ff',
                            backgroundColor: 'rgba(91,118,255,0.04)'
                          },
                          transition: 'all 0.2s ease',
                          py: 6
                        }}
                      >
                        <Box sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          mx: 'auto',
                          mb: 2,
                          background: 'linear-gradient(135deg, #5b76ff, #9b8cff)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5v14m-7-7h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, fontSize: '0.9rem', color: '#374151' }}>
                          No Media Added Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, lineHeight: 1.5 }}>
                          Click here to add images for Chapter {(mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex) + 1}. You can select multiple images at once.
                        </Typography>
                      </Box>
                    ) : (
                      // Has media - Show grid with Add Media box + uploaded images
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 80px)', justifyContent: 'flex-start', gap: 1 }}>
                        {/* Add Media Box - First Position */}
                        <Box
                          onClick={() => {
                            // Create a temporary file input for this specific upload
                            const tempFileInput = document.createElement('input');
                            tempFileInput.type = 'file';
                            tempFileInput.accept = 'image/*';
                            tempFileInput.multiple = true;
                            tempFileInput.style.display = 'none';
                            tempFileInput.onchange = (e) => {
                              const target = e.target as HTMLInputElement;
                              if (target.files && target.files.length > 0) {
                                // Create object URLs for the files
                                const imgs: string[] = [];
                                Array.from(target.files).forEach((file) => {
                                  if (file.type.startsWith('image/')) {
                                    const url = URL.createObjectURL(file);
                                    imgs.push(url);
                                  }
                                });

                                if (imgs.length > 0) {
                                  // Add images to the current chapter
                                  const currentIdx = mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex;
                                  onChapterImagesMapChange({
                                    ...chapterImagesMap,
                                    [currentIdx]: [...(chapterImagesMap[currentIdx] || []), ...imgs]
                                  });
                                }
                              }
                              // Clean up the temporary input
                              document.body.removeChild(tempFileInput);
                            };
                            document.body.appendChild(tempFileInput);
                            tempFileInput.click();
                          }}
                          sx={{
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            width: 80,
                            aspectRatio: '1 / 1',
                            border: '2px dashed #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(249, 250, 251, 1)',
                            '&:hover': {
                              borderColor: '#5b76ff',
                              backgroundColor: 'rgba(91,118,255,0.04)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              mx: 'auto',
                              mb: 0.5,
                              background: 'linear-gradient(135deg, #5b76ff, #9b8cff)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5v14m-7-7h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.6rem' }}>
                              Add
                            </Typography>
                          </Box>
                        </Box>

                        {/* Chapter-specific Media with Delete Icons */}
                        {(chapterImagesMap[mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex] || []).map((src, idx) => (
                          <Box key={`chapter-${idx}`} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', width: 80, aspectRatio: '1 / 1' }}>
                            <Box component="img" src={src} alt={`chapter-media-${idx}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            {/* Delete Icon */}
                            <IconButton
                              onClick={() => {
                                const currentIdx = mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex;
                                const currentImages = chapterImagesMap[currentIdx] || [];
                                const updatedImages = currentImages.filter((_, imgIdx) => imgIdx !== idx);
                                onChapterImagesMapChange({
                                  ...chapterImagesMap,
                                  [currentIdx]: updatedImages
                                });
                              }}
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                width: 18,
                                height: 18,
                                '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                                transition: 'all 0.2s ease'
                              }}
                              size="small"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
                {rightTabIndex === 1 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                    {/* Header Section */}
                    <Box sx={{ textAlign: 'center', p: 2.5, pb: 1 }}>
                      <Box sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 24px rgba(102, 126, 234, 0.3)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          filter: 'blur(6px)',
                          opacity: 0.5,
                          zIndex: -1
                        }
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor" />
                        </svg>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1rem', color: '#2d3748' }}>
                        AI Image Generator
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#718096', fontSize: '0.9rem' }}>
                        Describe your vision and watch AI bring it to life
                      </Typography>
                    </Box>

                    {/* Input Section - Takes available space */}
                    <Box sx={{ flex: 1, px: 2.5, display: 'flex', flexDirection: 'column' }}>
                      <TextField
                        value={aiPrompt}
                        onChange={(e) => onAIPromptChange(e.target.value)}
                        multiline
                        minRows={3}
                        maxRows={4}
                        placeholder="E.g., A majestic mountain landscape at sunset with golden clouds..."
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: '#f7fafc',
                            '& fieldset': {
                              border: '2px solid #e2e8f0',
                            },
                            '&:hover fieldset': {
                              border: '2px solid #cbd5e0',
                            },
                            '&.Mui-focused fieldset': {
                              border: '2px solid #667eea',
                              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                            }
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '14px',
                            fontSize: '0.9rem',
                            lineHeight: 1.4
                          }
                        }}
                      />
                    </Box>

                    {/* Action Buttons - Sticky at absolute bottom */}
                    <Box sx={{ p: 2.5, pt: 2, mt: 'auto' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => onAIPromptChange('')}
                          sx={{
                            flex: 1,
                            borderRadius: 3,
                            py: 1.4,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: '#e2e8f0',
                            color: '#4a5568',
                            '&:hover': {
                              borderColor: '#cbd5e0',
                              backgroundColor: '#f7fafc'
                            }
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={onGenerateImages}
                          disabled={imagesLoading || !aiPrompt.trim()}
                          sx={{
                            flex: 2,
                            borderRadius: 3,
                            py: 1.4,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 3px 12px rgba(102, 126, 234, 0.4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.5)',
                              transform: 'translateY(-1px)'
                            },
                            '&:disabled': {
                              background: '#e2e8f0',
                              color: '#a0aec0',
                              boxShadow: 'none'
                            },
                            transition: 'all 0.2s ease'
                          }}
                          startIcon={imagesLoading ? (
                            <CircularProgress size={16} sx={{ color: '#fff' }} />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
                            </svg>
                          )}
                        >
                          {imagesLoading ? 'Creating Magic...' : 'Generate Image'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                )}

              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Narration Variations Picker */}
      <Dialog open={pickerOpen} onClose={() => onPickerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select a narration</DialogTitle>
        <DialogContent>
          {pickerLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(pickerNarrations.length ? pickerNarrations : [chapters[pickerChapterIndex ?? 0]?.text]).map((text, idx) => (
                <Box key={idx} sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, cursor: 'pointer', '&:hover': { borderColor: '#1DA1F2', backgroundColor: 'rgba(29,161,242,0.02)' } }}
                  onClick={() => {
                    if (pickerChapterIndex === null) return;
                    const updated = [...chapters];
                    updated[pickerChapterIndex] = { ...updated[pickerChapterIndex], narration: text } as any;
                    // Note: This would need to be handled by the parent component
                    onPickerOpen(false);
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onPickerOpen(false)}>Close</Button>
        </DialogActions>
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
            ch.assets?.image || undefined,
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