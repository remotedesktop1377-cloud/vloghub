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
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Create as CreateIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  DragIndicator as DragIcon,
  AutoFixHigh as MagicIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Chapter } from '../../data/mockChapters';
import { fallbackImages } from '../../data/mockImages';
import { HelperFunctions } from '../../utils/helperFunctions';

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
  onGenerateChapters: () => void;
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
  onGenerateChapters,
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
}) => {
  return (
    <Paper sx={{ p: 2, border: '2px dashed #e0e0e0', minHeight: '400px' }}>
      {chaptersGenerated && chapters.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* Left Side - Chapters List */}
          <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
            <Box sx={{ width: '100%' }}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="chapters">
                  {(provided) => (
                    <Box
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, alignItems: 'flex-start' }}
                    >
                      {chapters.map((chapter, index) => (
                        <Box key={chapter.id || index.toString()} sx={{ width: 'fit-content' }}>
                          <Draggable key={(chapter.id || index.toString()) + '-draggable'} draggableId={chapter.id || index.toString()} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                variant="elevation"
                                sx={{
                                  borderRadius: 2,
                                  transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                  boxShadow: snapshot.isDragging ? 8 : 0,
                                  '&:hover': { boxShadow: 0 }
                                }}
                              >
                                <CardContent sx={{ p: 0, height: 'auto', '&:last-child': { paddingBottom: 0 } }}>
                                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', bgcolor: selectedChapterIndex === index ? 'rgba(29,161,242,0.06)' : 'transparent' }} onClick={() => onSelectChapter(index)}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                                      <Box sx={{ width: '100%', maxWidth: 760, mx: 0 }}>
                                        <Box sx={{
                                          display: 'flex',
                                          alignItems: 'stretch',
                                          borderWidth: 1,
                                          borderStyle: 'solid',
                                          borderColor: selectedChapterIndex === index ? '#1DA1F2' : '#e9ecef',
                                          borderRadius: 1,
                                          overflow: 'hidden',
                                          bgcolor: '#fff',
                                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                                          '&:hover': {
                                            borderColor: '#1DA1F2',
                                            boxShadow: '0 0 0 3px rgba(29, 161, 242, 0.08)',
                                            backgroundColor: 'rgba(29, 161, 242, 0.02)'
                                          }
                                        }}>
                                          <Box sx={{
                                            width: 48,
                                            bgcolor: 'rgba(29,161,242,0.08)',
                                            color: '#1DA1F2',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            flexShrink: 0
                                          }}>
                                            {index + 1}
                                          </Box>
                                          <Box sx={{ flexGrow: 1 }}>
                                            {editingChapter === index ? (
                                              <TextField
                                                value={editNarration}
                                                onChange={(e) => onEditNarrationChange(e.target.value)}
                                                variant="standard"
                                                InputProps={{ disableUnderline: true }}
                                                multiline
                                                minRows={4}
                                                fullWidth
                                                sx={{ px: 1.5, py: 1.5 }}
                                              />
                                            ) : (
                                              <Box sx={{
                                                p: 1.5,
                                                maxHeight: '200px',
                                                overflow: 'auto',
                                                bgcolor: '#fff'
                                              }}>
                                                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#495057' }}>
                                                  {chapter.narration || 'Narration content will be generated here.'}
                                                </Typography>
                                              </Box>
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
                                              onClick={() => onStartEdit(index, chapter.heading || '', chapter.narration || '')}
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
                                  </Box>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        </Box>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
            </Box>
          </Box>

          {/* Right Side - Media Panel */}
          <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
            <Paper sx={{ p: 0, overflow: 'hidden' }}>
              <Tabs value={rightTabIndex} onChange={(_, v) => onRightTabChange(v)} variant="fullWidth" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                <Tab label="Stock Media" />
                <Tab label="AI Generation" />
                <Tab label="Upload Media" />
              </Tabs>
              {rightTabIndex === 0 && (
                <>
                  <Box sx={{ p: 1.5, borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">AI (Single Image)</Typography>
                      <Switch size="small" checked={aiImagesEnabled} onChange={(e) => {
                        const enabled = e.target.checked;
                        onUseAIChange(enabled);
                        // Update current panel instantly
                        if (!enabled) {
                          onGeneratedImagesChange([fallbackImages[selectedChapterIndex % fallbackImages.length]]);
                        } else {
                          const imgs = chapterImagesMap[selectedChapterIndex] || [];
                          onGeneratedImagesChange(imgs.length ? [imgs[0]] : [fallbackImages[selectedChapterIndex % fallbackImages.length]]);
                        }
                      }} />
                    </Box>
                    {!aiImagesEnabled ? null : (
                      <Button
                        startIcon={<MagicIcon />}
                        variant="contained"
                        size="small"
                        disabled={imagesLoading || chapters.length === 0}
                        onClick={async () => {
                          try {
                            const currentIdx = selectedChapterIndex;
                            const visuals = `${currentIdx + 1}. ${chapters[currentIdx]?.visuals || ''}`;
                            const res = await fetch('/api/generate-images', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ visuals })
                            });
                            const data = await res.json();
                            const newImgsAll: string[] = Array.isArray(data?.images) && data.images.length > 0 ? data.images : fallbackImages;
                            const newImgs = [newImgsAll[0]];
                            onChapterImagesMapChange({
                              ...chapterImagesMap,
                              [currentIdx]: [...newImgs, ...(chapterImagesMap[currentIdx] || [])]
                            });
                            onGeneratedImagesChange([...newImgs, ...generatedImages]);
                          } catch (e) {
                            console.error('Failed to fetch images', e);
                            const newImgs = [fallbackImages[selectedChapterIndex % fallbackImages.length]];
                            onChapterImagesMapChange({
                              ...chapterImagesMap,
                              [selectedChapterIndex]: [...newImgs, ...(chapterImagesMap[selectedChapterIndex] || [])]
                            });
                            onGeneratedImagesChange([...newImgs, ...generatedImages]);
                          }
                        }}
                      >
                        {imagesLoading ? 'Fetching...' : 'Magic'}
                      </Button>)}
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    {aiImagesEnabled ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {(generatedImages.length ? generatedImages.slice(0, 1) : ((chapterImagesMap[selectedChapterIndex] || []).slice(0, 1).length ? (chapterImagesMap[selectedChapterIndex] || []).slice(0, 1) : [fallbackImages[selectedChapterIndex % fallbackImages.length]])).map((src, idx) => (
                          <Box key={idx} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', width: '100%', maxWidth: 320, aspectRatio: '1 / 1' }}>
                            <Box component="img" src={src} alt={`generated-${idx}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <IconButton
                              sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' }, opacity: 0, transition: 'opacity 0.2s ease', '.MuiBox-root:hover &': { opacity: 1 } }}
                              onClick={() => onDownloadImage(src, idx)}
                              title="Download"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3v10m0 0l-4-4m4 4l4-4" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 21H4a2 2 0 01-2-2v0a2 2 0 012-2h16a2 2 0 012 2v0a2 2 0 01-2 2z" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </IconButton>
                          </Box>
                        ))}
                        {!imagesLoading && generatedImages.length === 0 && (!chapterImagesMap[selectedChapterIndex] || chapterImagesMap[selectedChapterIndex].length === 0) && (
                          <Typography variant="body2" color="text.secondary">
                            Generate images from the script to see results here.
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 160px)', justifyContent: 'center', gap: 1.5 }}>
                        {[...uploadedImages, ...fallbackImages].map((src, idx) => (
                          <Box key={idx} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', width: 160, aspectRatio: '1 / 1' }}>
                            <Box component="img" src={src} alt={`dummy-${idx}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </>
              )}
              {rightTabIndex === 1 && (
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      mx: 'auto',
                      mb: 2,
                      background: 'linear-gradient(135deg, #5b76ff, #9b8cff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg width="42" height="42" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M8 5h8a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3V8a3 3 0 013-3zm3 3v8l6-4-6-4z" /></svg>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>What do you want to create?</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type in what you'd like to generate and add it to your scene.
                    </Typography>
                  </Box>

                  <TextField
                    value={aiPrompt}
                    onChange={(e) => onAIPromptChange(e.target.value)}
                    multiline
                    minRows={3}
                    placeholder="Describe what you want to generate..."
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="text" fullWidth sx={{ flex: 1 }} onClick={() => onAIPromptChange('')}>Cancel</Button>
                    <Button
                      fullWidth
                      sx={{ flex: 1 }}
                      variant="contained"
                      onClick={onGenerateImages}
                      disabled={imagesLoading || !aiPrompt.trim()}
                    >
                      {imagesLoading ? 'Generating...' : 'Generate'}
                    </Button>
                  </Box>
                </Box>
              )}
              {rightTabIndex === 2 && (
                <Box sx={{ p: 2 }}>
                  <Box
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDragLeave={() => { }}
                    onDrop={(e) => { e.preventDefault(); onUploadFiles(e.dataTransfer.files); }}
                    onClick={() => onTriggerFileUpload()}
                    sx={{
                      border: '2px dashed #cbd5e1',
                      borderColor: isDraggingUpload ? '#5b76ff' : '#cbd5e1',
                      borderRadius: 2,
                      height: 360,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isDraggingUpload ? 'rgba(91,118,255,0.04)' : 'transparent'
                    }}
                  >
                    <Box>
                      <Box sx={{
                        width: 88,
                        height: 88,
                        borderRadius: '50%',
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(135deg, #5b76ff, #9b8cff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M12 16V8m0 0l-3 3m3-3l3 3M7 20h10a4 4 0 004-4 4 4 0 00-4-4h-.26A8 8 0 104 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.8rem' }}>Upload Asset</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click to browse or drag & drop your file here
                      </Typography>
                    </Box>
                  </Box>
                  <input id="upload-input" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => onUploadFiles(e.target.files)} />
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      ) : (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          py: 8
        }}>
          <Typography variant="subtitle1" sx={{ color: '#666', mb: 2, fontSize: '0.8rem' }}>
            📚 Generated Chapters
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 3, maxWidth: '300px' }}>
            Your video chapters will appear here once you generate them using the form on the left.
          </Typography>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#ccc',
            fontSize: '0.875rem'
          }}>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Enter your hypothesis and click "Generate Chapters" to get started
            </Typography>
          </Box>
        </Box>
      )}

      {/* Narration Variations Picker */}
      <Dialog open={pickerOpen} onClose={() => onPickerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select a narration</DialogTitle>
        <DialogContent>
          {pickerLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(pickerNarrations.length ? pickerNarrations : [chapters[pickerChapterIndex ?? 0]?.narration]).map((text, idx) => (
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
    </Paper>
  );
};

export default ChaptersSection; 