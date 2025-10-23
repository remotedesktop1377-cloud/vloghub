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
  Tooltip,
  Select,
  MenuItem,
  Slider,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Create as CreateIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  DragIndicator as DragIcon,
  AutoFixHigh as MagicIcon,
  PlayArrow as PlayIcon,
  Image as ImageIcon,
  VolumeUp as VolumeIcon,
  AutoFixHigh as WandIcon,
  Visibility as PreviewIcon,
  AccessTime as TimeIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon
} from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Chapter } from '../../types/chapters';
import { HelperFunctions, SecureStorageHelpers } from '../../utils/helperFunctions';
import { ImageViewModal } from '../ui/ImageViewer/ImageViewModal';
import { MediaPlayer } from '../videoEffects/MediaPlayer';
import { useImageViewer, formatChapterImages } from '../../hooks/useImageViewer';
import { PRIMARY, SUCCESS, WARNING, ERROR, INFO, PURPLE, NEUTRAL, TEXT, BORDER, HOVER, SPECIAL } from '../../styles/colors';
import ImageSearch from './ImageSearch';
import { ChapterEditDialog } from './ChapterEditDialog';
import TextWithHighlights from '../scriptProductionComponents/TextWithHighlights';
import CustomAudioPlayer from '../scriptProductionComponents/CustomAudioPlayer';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

// Map effect ids to human-readable names for project-level effects display
const EFFECT_NAME_MAP: Record<string, string> = {
  // color & grading
  color_grade_blue: 'Blue Grade',
  sepia_tone: 'Sepia Tone',
  desaturate_50: 'Desaturate',
  contrast_boost: 'Contrast Boost',
  color_enhancement: 'Color Enhancement',
  // visual
  chroma_key: 'Chroma Key',
  background_blur: 'Background Blur',
  vignette: 'Vignette',
  lens_flare: 'Lens Flare',
  border_highlight: 'Border Highlight',
  // motion
  glow: 'Glow Effect',
  particle_trails: 'Particle Trails',
  slight_blur: 'Motion Blur',
  scaling_80_percent: 'Scale Down',
  center_focus: 'Center Focus',
  // audio
  echo: 'Echo',
  reverb: 'Reverb',
  quantum_resonance: 'Quantum Resonance',
  spatial_audio: 'Spatial Audio',
};

interface ChaptersSectionProps {
  jobId: string;
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
  // Optional: notify parent when opening media for a specific keyword
  onOpenMediaForKeyword?: (chapterIndex: number, keyword: string) => void;
  // Chapter editing dialog
  chapterEditDialogOpen: boolean;
  onChapterEditDialogOpen: (open: boolean) => void;
  onChapterEditDialogChapterIndex: (index: number | null) => void;
  // Drive library options
  driveBackgrounds?: Array<{ id: string; name: string; webViewLink?: string; webContentLink?: string }>;
  driveMusic?: Array<{ id: string; name: string; webContentLink?: string }>;
  driveTransitions?: Array<{ id: string; name: string; webViewLink?: string }>;
  projectSettings?: {
    transition?: string;
    musicId?: string;
    logo?: { name?: string; url: string; position?: string } | null;
    clip?: { name?: string; url: string } | null;
    transitionEffects?: string[];
  };
  // Open project settings dialog in scene context
  onOpenProjectSettingsDialog?: (sceneIndex: number) => void;
}

const ChaptersSection: React.FC<ChaptersSectionProps> = ({
  jobId,
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
  chapterEditDialogOpen,
  onChapterEditDialogOpen,
  onChapterEditDialogChapterIndex,
  driveBackgrounds,
  driveMusic,
  driveTransitions,
  projectSettings,
  onOpenProjectSettingsDialog,
}) => {
  const [expandedChapterIndex, setExpandedChapterIndex] = React.useState<number | null>(null);
  // Volume popover open state per chapter (inline editor)
  const [volumeOpenIndex, setVolumeOpenIndex] = React.useState<number | null>(null);
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

  // Calculate total duration
  const calculateTotalDuration = () => {
    const totalSeconds = chapters.reduce((total, chapter) => {
      const duration = chapter.duration || '0s';
      const seconds = parseDurationToSeconds(duration);
      return total + seconds;
    }, 0);
    return formatSecondsToDuration(totalSeconds);
  };

  const parseDurationToSeconds = (duration: string): number => {
    if (!duration) return 0;

    // Handle formats like "30s", "1m 30s", "2m", "1h 30m", etc.
    const timeRegex = /(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/;
    const match = duration.match(timeRegex);

    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatSecondsToDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
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
                                <Box sx={{ width: '100%', height: '100%', minHeight: '120px' }}>
                                  <Box
                                    data-chapter-index={index}
                                    sx={{
                                      display: 'flex',
                                      height: '100%',
                                      bgcolor: 'rgba(29,161,242,0.08)',
                                    }}>

                                    <Box sx={{
                                      width: 100,
                                      color: INFO.main,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      alignSelf: 'center',
                                      fontWeight: '500',
                                      flexShrink: 0
                                    }}>
                                      {typeof onOpenProjectSettingsDialog === 'function' && (
                                        <Button sx={{ marginBottom: 10 }} onClick={(e) => { e.stopPropagation(); onOpenProjectSettingsDialog(index); }}><SettingsIcon /></Button>
                                      )}
                                      <Box sx={{ fontSize: '1.2rem', fontWeight: '500' }}>
                                        {index + 1}
                                      </Box>
                                      <Box sx={{
                                        fontSize: '1.2rem',
                                        color: 'text.secondary',
                                        display: 'flex',
                                        alignItems: 'center',
                                        alignSelf: 'center',
                                        textAlign: 'center',
                                        // gap: 0.25,
                                        mt: 0.25
                                      }}>
                                        {/* <TimeIcon sx={{ fontSize: 10 }} /> */}
                                        {chapter.duration || '0s'}
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '100%' }}>
                                      {editingChapter === index ? (
                                        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                          <TextField
                                            value={editNarration}
                                            onChange={(e) => onEditNarrationChange(e.target.value)}
                                            variant="standard"
                                            InputProps={{ disableUnderline: true }}
                                            multiline
                                            minRows={4}
                                            fullWidth
                                            sx={{
                                              px: 1.5, py: 1.5, width: '100%', flex: 1, bgcolor: NEUTRAL.white, fontSize: '1.2rem',
                                              '& .MuiInputBase-input': {
                                                fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                                lineHeight: HelperFunctions.isRTLLanguage(language) ? 2.5 : 1.8,
                                                fontSize: '1.2rem',
                                                textAlign: HelperFunctions.isRTLLanguage(language || 'english') ? 'right' : 'left',
                                              },
                                              ...HelperFunctions.getDirectionSx(language)
                                            }}
                                          />
                                          <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                Duration:
                                              </Typography>
                                              <TextField
                                                size="small"
                                                value={chapter.duration || ''}
                                                onChange={(e) => {
                                                  const updatedChapters = chapters.map((ch, idx) =>
                                                    idx === index ? { ...ch, duration: e.target.value } : ch
                                                  );
                                                  onChaptersUpdate(updatedChapters);
                                                  SecureStorageHelpers.setScriptMetadata({ ...SecureStorageHelpers.getScriptMetadata(), chapters: updatedChapters });
                                                }}
                                                placeholder="e.g., 30s, 1m 30s, 2m"
                                                sx={{
                                                  width: 120,
                                                  '& .MuiInputBase-input': { fontSize: '0.9rem' }
                                                }}
                                              />
                                            </Box>
                                          </Box>
                                        </Box>
                                      ) : (
                                        <>
                                          {/* Content Area - narration and media */}
                                          <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '100%', minHeight: '120px', bgcolor: 'background.paper', justifyContent: 'center', alignItems: 'center' }}>
                                            {/* Narration Content */}
                                            <Box sx={{
                                              flex: expandedChapterIndex === index ? '1 1 100%' : '0 0 70%',
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
                                                  fontSize: '1.5rem',
                                                  color: 'text.primary',
                                                  px: 1.5,
                                                  py: 1,
                                                  fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                                  userSelect: 'text',
                                                  cursor: 'text',
                                                  ...HelperFunctions.getDirectionSx(language),
                                                  textAlign: HelperFunctions.isRTLLanguage(language || 'english') ? 'right' : 'left',
                                                }}
                                                onMouseUp={(e) => {
                                                  onTextSelection(index, e);
                                                }}
                                                onSelect={(e) => {
                                                  onTextSelection(index, e as any);
                                                }}
                                                onMouseDown={(e) => {
                                                  // Clear any existing selection when starting a new selection
                                                  window.getSelection()?.removeAllRanges();
                                                }}
                                              >
                                                {expandedChapterIndex !== index && (
                                                  <>
                                                    {chapter.narration ? (
                                                      <TextWithHighlights
                                                        text={chapter.narration}
                                                        keywords={chapter.highlightedKeywords || []}
                                                      />
                                                    ) : (
                                                      'Narration content will be generated here.'
                                                    )}
                                                  </>
                                                )}
                                              </Box>

                                              {/* Inline Editor (expanded view) */}
                                              {expandedChapterIndex === index && (
                                                <Box sx={{
                                                  mt: 1,
                                                  p: 2,
                                                  borderRadius: 1,
                                                  width: '100%',
                                                  fontSize: '1.6rem'
                                                }}>

                                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>

                                                    <TextField
                                                      label="Narration"
                                                      value={chapters[index].narration}
                                                      onChange={(e) => {
                                                        onEditNarrationChange(e.target.value);
                                                        // Recompute duration from narration length (simple heuristic: ~150 wpm)
                                                        const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
                                                        const seconds = Math.ceil((words / 150) * 60);
                                                        const updated = chapters.map((ch, i) => i === index ? { ...ch, narration: e.target.value, words, durationInSeconds: seconds } : ch);
                                                        onChaptersUpdate(updated);
                                                      }}
                                                      multiline
                                                      minRows={3}
                                                      fullWidth
                                                      sx={{
                                                        '& .MuiInputBase-input': {
                                                          fontSize: '1.4rem',
                                                          lineHeight: HelperFunctions.isRTLLanguage(language) ? 2.4 : 1.9,
                                                          fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                                          textAlign: HelperFunctions.isRTLLanguage(language || 'english') ? 'right' : 'left',
                                                        }
                                                      }}
                                                    />
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        Duration: {Math.max(0, Math.round(chapters[index].durationInSeconds))} seconds
                                                      </Typography>
                                                    </Box>

                                                    {Array.isArray(((chapters[index] as any).videoEffects?.backgroundMusic)) && ((chapters[index] as any).videoEffects.backgroundMusic as any[]).length > 0 && (
                                                      <Box sx={{ width: '100%' }}>
                                                        {(((chapters[index] as any).videoEffects.backgroundMusic) as any[]).map((bm: any, bmIdx: number) => {
                                                          const getDriveIdFromLink = (link: string): string => {
                                                            if (!link) return '';
                                                            if (/^https?:\/\//i.test(link)) {
                                                              const idParam = /[?&]id=([\w-]+)/.exec(link);
                                                              if (idParam && idParam[1]) return idParam[1];
                                                              const pathMatch = /\/d\/([\w-]+)/.exec(link);
                                                              if (pathMatch && pathMatch[1]) return pathMatch[1];
                                                              return '';
                                                            }
                                                            return link; // already an id
                                                          };
                                                          const currentId = getDriveIdFromLink(bm?.selectedMusic || '');
                                                          return (
                                                            <Box key={bm.id || bmIdx} sx={{
                                                              display: 'flex',
                                                              flexDirection: 'row',
                                                              alignItems: 'center',
                                                              justifyContent: 'space-between',
                                                              borderRadius: 1,
                                                              border: '1px solid',
                                                              borderColor: 'divider',
                                                              mb: 1
                                                            }}>
                                                              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', pl: 1.25 }}>
                                                                <Select
                                                                  size="small"
                                                                  value={currentId || ''}
                                                                  onChange={(e) => {
                                                                    const updated = chapters.map((ch, i) => {
                                                                      if (i !== index) return ch;
                                                                      const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                      const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                      const selId = String(e.target.value);
                                                                      // Always store as Drive view link
                                                                      nextItem.selectedMusic = selId ? `https://drive.google.com/file/d/${selId}/view?usp=drive_link` : '';
                                                                      // nextItem.selectedMusic = selId ? `https://drive.google.com/file/d/1_m1xNAfRIFzY0f8ixSgiRAVL0Js0njZH/view?usp=drive_link` : '';
                                                                      list[bmIdx] = nextItem;
                                                                      return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                    });
                                                                    onChaptersUpdate(updated);
                                                                    setVolumeOpenIndex(null);
                                                                    HelperFunctions.persistSceneUpdate(jobId, updated, index, 'Music changed');
                                                                  }}
                                                                  disabled={false}
                                                                  sx={{
                                                                    minWidth: 280,
                                                                    maxWidth: 320,
                                                                    '& .MuiSelect-select': {
                                                                      display: 'inline-block',
                                                                      maxWidth: 280,
                                                                      overflow: 'hidden',
                                                                      textOverflow: 'ellipsis',
                                                                      whiteSpace: 'nowrap'
                                                                    }
                                                                  }}
                                                                  renderValue={(value) => {
                                                                    const id = String(value || '');
                                                                    const option = ((driveMusic as Array<{ id: string; name: string }>) || []).find(m => m.id === id);
                                                                    const text = option?.name || 'Select background music...';
                                                                    return text;
                                                                  }}
                                                                >
                                                                  <MenuItem value="">Select background music...</MenuItem>
                                                                  {((driveMusic as Array<{ id: string; name: string }>) || []).map((m) => (
                                                                    <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                                                  ))}
                                                                </Select>

                                                                {/* Music Preview */}
                                                                {(() => {
                                                                  const id = currentId;
                                                                  const track = ((driveMusic as Array<{ id: string; webContentLink?: string; name: string }>) || []).find((m) => m.id === id);
                                                                  return (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                                                      <CustomAudioPlayer
                                                                        key={`audio-${index}-${bmIdx}-${id}`}
                                                                        src={id ? `${API_ENDPOINTS.GOOGLE_DRIVE_MEDIA}${id}` : ''}
                                                                        title={''}
                                                                      />
                                                                    </Box>
                                                                  );
                                                                })()}

                                                                <Tooltip title={`Volume (${Math.round(((bm?.volume || 0.3) * 100))}%)`}>
                                                                  <span><IconButton size="small" onClick={() => setVolumeOpenIndex((volumeOpenIndex as any) === `${index}-${bmIdx}` ? null : (`${index}-${bmIdx}` as any))} disabled={false}>
                                                                    <VolumeIcon sx={{ color: WARNING.main }} fontSize="small" />
                                                                  </IconButton></span>
                                                                </Tooltip>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 34, textAlign: 'center' }}>
                                                                  {Math.round(((bm?.volume || 0.3) * 100))}%
                                                                </Typography>
                                                                {((volumeOpenIndex as any) === `${index}-${bmIdx}`) && (
                                                                  <Box sx={{ position: 'relative' }}>
                                                                    <Box sx={{ position: 'absolute', top: -8, left: 0, bgcolor: 'background.paper', p: 1, borderRadius: 1, boxShadow: 2 }}>
                                                                      <Slider
                                                                        orientation="vertical"
                                                                        min={0}
                                                                        max={1}
                                                                        step={0.05}
                                                                        value={bm?.volume || 0.3}
                                                                        onChange={(_, value) => {
                                                                          const vol = Array.isArray(value) ? value[0] : value;
                                                                          const updated = chapters.map((ch, i) => {
                                                                            if (i !== index) return ch;
                                                                            const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                            const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                            nextItem.volume = Number(vol ?? 0.3);
                                                                            list[bmIdx] = nextItem;
                                                                            return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                          });
                                                                          onChaptersUpdate(updated);
                                                                          HelperFunctions.persistSceneUpdate(jobId, updated, index, 'Music volume updated');
                                                                        }}
                                                                        sx={{ height: 120, ml: 1 }}
                                                                      />
                                                                    </Box>
                                                                  </Box>
                                                                )}
                                                              </Box>

                                                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                <Tooltip title={(bm?.autoAdjust !== false ? 'Auto Adjust: On' : 'Auto Adjust: Off')}>
                                                                  <span><Button
                                                                    size="small"
                                                                    disabled={false}
                                                                    variant={(bm?.autoAdjust !== false ? 'contained' : 'outlined')}
                                                                    onClick={() => {
                                                                      const updated = chapters.map((ch, i) => {
                                                                        if (i !== index) return ch;
                                                                        const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                        const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                        nextItem.autoAdjust = !(nextItem.autoAdjust === true);
                                                                        list[bmIdx] = nextItem;
                                                                        return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                      });
                                                                      onChaptersUpdate(updated);
                                                                      HelperFunctions.persistSceneUpdate(jobId, updated, index, 'Music auto-adjust toggled');
                                                                    }}
                                                                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                                                  >Auto Adjust</Button></span>
                                                                </Tooltip>
                                                                <Tooltip title={(bm?.fadeIn !== false ? 'Fade In: On' : 'Fade In: Off')}>
                                                                  <span><Button
                                                                    size="small"
                                                                    disabled={false}
                                                                    variant={(bm?.fadeIn !== false ? 'contained' : 'outlined')}
                                                                    onClick={() => {
                                                                      const updated = chapters.map((ch, i) => {
                                                                        if (i !== index) return ch;
                                                                        const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                        const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                        nextItem.fadeIn = !(nextItem.fadeIn === true);
                                                                        list[bmIdx] = nextItem;
                                                                        return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                      });
                                                                      onChaptersUpdate(updated);
                                                                      HelperFunctions.persistSceneUpdate(jobId, updated, index, 'Music fade-in toggled');
                                                                    }}
                                                                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                                                  >Fade In</Button></span>
                                                                </Tooltip>
                                                                <Tooltip title={(bm?.fadeOut !== false ? 'Fade Out: On' : 'Fade Out: Off')}>
                                                                  <span><Button
                                                                    size="small"
                                                                    variant={(bm?.fadeOut !== false ? 'contained' : 'outlined')}
                                                                    onClick={() => {
                                                                      const updated = chapters.map((ch, i) => {
                                                                        if (i !== index) return ch;
                                                                        const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                        const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                        nextItem.fadeOut = !(nextItem.fadeOut === true);
                                                                        list[bmIdx] = nextItem;
                                                                        return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                      });
                                                                      onChaptersUpdate(updated);
                                                                      HelperFunctions.persistSceneUpdate(jobId, updated, index, 'Music fade-out toggled');
                                                                    }}
                                                                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                                                  >Fade Out</Button></span>
                                                                </Tooltip>

                                                                <Button
                                                                  size="small"
                                                                  variant="contained"
                                                                  color="success"
                                                                  disabled={!currentId}
                                                                  sx={{ textTransform: 'none', fontSize: '1rem', width: 120, height: 40 }}
                                                                  onClick={() => {
                                                                    const id = currentId;
                                                                    const current = Array.isArray((chapters[index] as any).videoEffects?.backgroundMusic) ? (chapters[index] as any).videoEffects.backgroundMusic : [];
                                                                    // already saved link on change; here we just ensure item exists
                                                                    const applied = current.map((item: any, idx: number) => idx === bmIdx ? { ...item } : item);
                                                                    const updated = chapters.map((ch, i) => {
                                                                      if (i !== index) return ch;
                                                                      return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: applied } } as any;
                                                                    });
                                                                    onChaptersUpdate(updated);
                                                                    HelperFunctions.persistSceneUpdate(jobId, updated, index, 'Music applied');
                                                                  }}
                                                                >Apply Music</Button>

                                                                <Button
                                                                  size="small"
                                                                  variant="outlined"
                                                                  color="error"
                                                                  sx={{ textTransform: 'none', fontSize: '1rem', width: 100, height: 40 }}
                                                                  onClick={() => {
                                                                    const updated = chapters.map((ch, i) => {
                                                                      if (i !== index) return ch;
                                                                      const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                      const pruned = list.filter((_: any, idx: number) => idx !== bmIdx);
                                                                      return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: pruned } } as any;
                                                                    });
                                                                    onChaptersUpdate(updated);
                                                                    HelperFunctions.persistSceneUpdate(jobId, updated, index, 'Music removed');
                                                                  }}
                                                                >Remove</Button>
                                                              </Box>
                                                            </Box>
                                                          )
                                                        })}
                                                      </Box>
                                                    )}
                                                  </Box>
                                                </Box>
                                              )}

                                              {/* Highlighted Keywords Display */}
                                              {chapter.highlightedKeywords && chapter.highlightedKeywords.length > 0 && (
                                                <Box sx={{ px: 1.5, py: 0.5, width: '100%' }}>
                                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="caption" sx={{
                                                      color: 'text.secondary',
                                                      fontSize: '1.3rem',
                                                      fontWeight: 500,
                                                      display: 'block'
                                                    }}>
                                                      Keywords ({chapter.highlightedKeywords.length}):
                                                    </Typography>
                                                    <Button
                                                      size="large"
                                                      variant="text"
                                                      color="error"
                                                      onClick={() => {
                                                        onChaptersUpdate(chapters.map((ch, idx) =>
                                                          idx === index
                                                            ? { ...ch, highlightedKeywords: [] }
                                                            : ch
                                                        ));
                                                        HelperFunctions.persistSceneUpdate(jobId, chapters, index, 'All keywords cleared');
                                                        if (typeof window !== 'undefined' && (window as any).toast) {
                                                          HelperFunctions.showSuccess('Cleared all keywords');
                                                        }
                                                      }}
                                                      sx={{
                                                        minWidth: 'auto',
                                                        px: 1,
                                                        py: 0.25,
                                                        fontSize: '1rem',
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
                                                          color: 'text.white',
                                                          px: 1,
                                                          py: 0.25,
                                                          borderRadius: 0.5,
                                                          fontSize: '1.3rem',
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
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (typeof window !== 'undefined') {
                                                            (window as any).__keywordSuggestions = { keyword, keywords: [keyword] };
                                                          }
                                                          onMediaManagementChapterIndex(index);
                                                          onMediaManagementOpen(true);
                                                          // if (typeof onOpenMediaForKeyword === 'function') {
                                                          //   onOpenMediaForKeyword(index, keyword);
                                                          // }
                                                        }}
                                                      >
                                                        <Typography variant="body1" sx={{ fontSize: '1.3rem', fontWeight: 400 }}>{keyword}</Typography>
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
                                                          onClick={(e) => {
                                                            // Remove this keyword and its associated images from all arrays
                                                            e.stopPropagation();
                                                            const updatedChapters = chapters.map((ch, idx) => {
                                                              if (idx !== index) return ch;
                                                              // Build list of URLs tied to this keyword based on new array format (fallback to legacy map)
                                                              let urlsToRemove: string[] = [];
                                                              if (Array.isArray(ch.keywordsSelected)) {
                                                                const arr = ch.keywordsSelected as import('@/types/chapters').ChapterKeywordSelection[];
                                                                const entry = arr.find(e => e.suggestedKeyword === keyword);
                                                                if (entry && entry.media) {
                                                                  const low = entry.media.lowResMedia;
                                                                  const high = entry.media.highResMedia;
                                                                  urlsToRemove = [low, high].filter((u): u is string => typeof u === 'string' && !!u);
                                                                }
                                                              } else {
                                                                const map = (ch.keywordsSelected || {}) as Record<string, string[]>;
                                                                urlsToRemove = map[keyword] || [];
                                                              }
                                                              const images = Array.isArray(ch.assets?.images) ? ch.assets!.images! : [];
                                                              const imagesGoogle = Array.isArray(ch.assets?.imagesGoogle) ? ch.assets!.imagesGoogle! : [];
                                                              const imagesEnvato = Array.isArray(ch.assets?.imagesEnvato) ? ch.assets!.imagesEnvato! : [];
                                                              const filteredImages = images.filter(u => !urlsToRemove.includes(u));
                                                              const filteredGoogle = imagesGoogle.filter(u => !urlsToRemove.includes(u));
                                                              const filteredEnvato = imagesEnvato.filter(u => !urlsToRemove.includes(u));
                                                              // Remove keyword from keywordsSelected
                                                              let nextKeywordsSelected: import('@/types/chapters').ChapterKeywordSelection[] | Record<string, string[]> | undefined = ch.keywordsSelected;
                                                              if (Array.isArray(ch.keywordsSelected)) {
                                                                const arr = ch.keywordsSelected as import('@/types/chapters').ChapterKeywordSelection[];
                                                                nextKeywordsSelected = arr.filter(e => e.suggestedKeyword !== keyword);
                                                              } else {
                                                                const map = (ch.keywordsSelected || {}) as Record<string, string[]>;
                                                                const { [keyword]: _removed, ...restMap } = map;
                                                                nextKeywordsSelected = restMap;
                                                              }
                                                              return {
                                                                ...ch,
                                                                highlightedKeywords: (ch.highlightedKeywords || []).filter(k => k !== keyword),
                                                                keywordsSelected: nextKeywordsSelected as any,
                                                                assets: {
                                                                  ...ch.assets,
                                                                  images: filteredImages.length > 0 ? filteredImages : null,
                                                                  imagesGoogle: filteredGoogle.length > 0 ? filteredGoogle : null,
                                                                  imagesEnvato: filteredEnvato.length > 0 ? filteredEnvato : null,
                                                                }
                                                              };
                                                            });
                                                            onChaptersUpdate(updatedChapters);
                                                            HelperFunctions.persistSceneUpdate(jobId, updatedChapters, index, `Keyword removed`);
                                                            if (typeof window !== 'undefined' && (window as any).toast) {
                                                              HelperFunctions.showSuccess(`Removed "${keyword}" and its images`);
                                                            }
                                                          }}
                                                        >
                                                          ×
                                                        </Box>
                                                      </Box>
                                                    ))}
                                                  </Box>
                                                  {/* Media Selected (prefer scene-level videoEffects, fallback to project-level) */}
                                                  {projectSettings && (() => {
                                                    const ve: any = (chapters[index] as any)?.videoEffects || {};
                                                    const driveIdFromLink = (link: string): string => {
                                                      if (!link) return '';
                                                      const idParam = /[?&]id=([\w-]+)/.exec(link);
                                                      if (idParam && idParam[1]) return idParam[1];
                                                      const pathMatch = /\/d\/([\w-]+)/.exec(link);
                                                      if (pathMatch && pathMatch[1]) return pathMatch[1];
                                                      return '';
                                                    };
                                                    const effective = {
                                                      transition: ve.transition || projectSettings.transition,
                                                      musicId: ve.backgroundMusic?.selectedMusic ? driveIdFromLink(ve.backgroundMusic.selectedMusic) : projectSettings.musicId,
                                                      logo: ve.logo || projectSettings.logo,
                                                      clip: ve.clip || projectSettings.clip,
                                                      transitionEffects: Array.isArray(ve.transitionEffects) && ve.transitionEffects.length > 0 ? ve.transitionEffects : (projectSettings.transitionEffects || []),
                                                    } as typeof projectSettings;
                                                    return (
                                                      <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                          {effective.transition || effective.musicId || effective.logo?.url || effective.clip?.url
                                                            || (Array.isArray(effective.transitionEffects) && effective.transitionEffects.length > 0) && <span>Selected Media:</span>}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                          {effective.transition && (
                                                            <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: INFO.light, color: 'text.white', border: `1px solid ${INFO.main}` }}>Transition: {String(effective.transition).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Box>
                                                          )}
                                                          {effective.musicId && (
                                                            <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: SUCCESS.light, color: 'text.white', border: `1px solid ${SUCCESS.main}` }}>
                                                              Music: {((driveMusic as Array<{ id: string; name: string }> | undefined) || []).find(m => m.id === effective.musicId)?.name || effective.musicId}
                                                            </Box>
                                                          )}
                                                          {effective.logo?.url && (
                                                            <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: PRIMARY.light, color: 'text.white', border: `1px solid ${PRIMARY.main}` }}>Logo: {effective.logo.name || 'Selected'}</Box>
                                                          )}
                                                          {effective.clip?.url && (
                                                            <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: WARNING.light, color: 'text.white', border: `1px solid ${WARNING.main}` }}>Clip: {effective.clip.name || 'Selected'}</Box>
                                                          )}
                                                          {Array.isArray(effective.transitionEffects) && effective.transitionEffects.length > 0 && (
                                                            <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: PURPLE.light, color: 'text.white', border: `1px solid ${PURPLE.main}` }}>
                                                              Effects: {effective.transitionEffects.map((id) => EFFECT_NAME_MAP[id] || id).join(', ')}
                                                            </Box>
                                                          )}
                                                        </Box>
                                                      </Box>
                                                    );
                                                  })()}
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

                                            {/* Media Section */}
                                            {expandedChapterIndex !== index && (
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
                                                  {/* <Button
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
                                                      if (typeof window !== 'undefined') {
                                                        (window as any).__keywordSuggestions = undefined;
                                                      }
                                                      onMediaManagementChapterIndex(index);
                                                      onMediaManagementOpen(true);
                                                    }}
                                                  >
                                                    {((chapterImagesMap[index] || []).length > 0 || (chapter.assets && Array.isArray(chapter.assets.images) ? chapter.assets.images.length > 0 : false)) ? 'Manage' : 'Add'}
                                                  </Button> */}
                                                </Box>

                                                {/* Media Display */}
                                                {((chapterImagesMap[index] || []).length > 0 || (chapter.assets && Array.isArray(chapter.assets.images) ? chapter.assets.images.length > 0 : false)) ? (
                                                  <>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                                                      {/* Determine if first image is AI (not from Google/Envato) */}
                                                      {(() => {
                                                        const allImages = (chapter.assets && Array.isArray(chapter.assets.images)) ? chapter.assets.images : [];
                                                        const googleSet = new Set(chapter.assets?.imagesGoogle || []);
                                                        const envatoSet = new Set(chapter.assets?.imagesEnvato || []);
                                                        const hasAIAtFirst = allImages.length > 0 && !googleSet.has(allImages[0]) && !envatoSet.has(allImages[0]);
                                                        return hasAIAtFirst;
                                                      })() && (
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
                                                              src={chapter.assets?.images?.[0] || ''}
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
                                                                // Remove the AI generated image from chapter and related keyword selections
                                                                const updatedChapters = chapters.map((ch, chIndex) => {
                                                                  if (chIndex === index) {
                                                                    const aiUrl = ch.assets?.images?.[0] || '';
                                                                    // Update keywordsSelected
                                                                    let nextKeywordsSelected: any = ch.keywordsSelected;
                                                                    if (Array.isArray(ch.keywordsSelected)) {
                                                                      const arr = ch.keywordsSelected as import('@/types/chapters').ChapterKeywordSelection[];
                                                                      nextKeywordsSelected = arr.filter(entry => {
                                                                        const low = entry.media?.lowResMedia;
                                                                        const high = entry.media?.highResMedia;
                                                                        return low !== aiUrl && high !== aiUrl;
                                                                      });
                                                                    } else if (ch.keywordsSelected && typeof ch.keywordsSelected === 'object') {
                                                                      const map = ch.keywordsSelected as Record<string, string[]>;
                                                                      const newMap: Record<string, string[]> = {};
                                                                      Object.entries(map).forEach(([k, list]) => {
                                                                        const filtered = (list || []).filter(u => u !== aiUrl);
                                                                        if (filtered.length > 0) newMap[k] = filtered;
                                                                      });
                                                                      nextKeywordsSelected = newMap;
                                                                    }
                                                                    return {
                                                                      ...ch,
                                                                      assets: {
                                                                        ...ch.assets,
                                                                        images: ch.assets?.images?.slice(1) || null,
                                                                        imagesGoogle: (ch.assets?.imagesGoogle || []).filter(u => u !== aiUrl) || null,
                                                                        imagesEnvato: (ch.assets?.imagesEnvato || []).filter(u => u !== aiUrl) || null
                                                                      },
                                                                      ...(nextKeywordsSelected !== undefined ? { keywordsSelected: nextKeywordsSelected } : {})
                                                                    };
                                                                  }
                                                                  return ch;
                                                                });
                                                                onChaptersUpdate(updatedChapters);
                                                                HelperFunctions.persistSceneUpdate(jobId, updatedChapters, index, 'Media deleted');
                                                              }}
                                                            >
                                                              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                              </svg>
                                                            </IconButton>
                                                          </Box>
                                                        )}

                                                      {/* Show Selected Images (Google/Envato) */}
                                                      {(() => {
                                                        const allImages = (chapter.assets && Array.isArray(chapter.assets.images)) ? chapter.assets.images : [];
                                                        const googleSet = new Set(chapter.assets?.imagesGoogle || []);
                                                        const envatoSet = new Set(chapter.assets?.imagesEnvato || []);
                                                        const hasAIAtFirst = allImages.length > 0 && !googleSet.has(allImages[0]) && !envatoSet.has(allImages[0]);
                                                        const list = hasAIAtFirst ? allImages.slice(1) : allImages;
                                                        return list.map((imageUrl, imgIndex) => (
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
                                                              const imageIndex = (hasAIAtFirst ? 1 : 0) + imgIndex;
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
                                                                // Remove the selected image from chapter assets and related keyword selections
                                                                const updatedChapters = chapters.map((ch, chIndex) => {
                                                                  if (chIndex === index) {
                                                                    const currentImages = ch.assets && Array.isArray(ch.assets.images) ? ch.assets.images : [];
                                                                    const googleSetInner = new Set(ch.assets?.imagesGoogle || []);
                                                                    const envatoSetInner = new Set(ch.assets?.imagesEnvato || []);
                                                                    const hasAIAtFirstInner = currentImages.length > 0 && !googleSetInner.has(currentImages[0]) && !envatoSetInner.has(currentImages[0]);
                                                                    const absoluteIndex = (hasAIAtFirstInner ? 1 : 0) + imgIndex;
                                                                    const targetUrl = currentImages[absoluteIndex];
                                                                    const updatedImages = currentImages.filter((_, i) => i !== absoluteIndex);
                                                                    const currentGoogle = ch.assets?.imagesGoogle || [];
                                                                    const currentEnvato = ch.assets?.imagesEnvato || [];
                                                                    const updatedGoogle = currentGoogle.filter((u) => u !== targetUrl);
                                                                    const updatedEnvato = currentEnvato.filter((u) => u !== targetUrl);
                                                                    // Update keywordsSelected
                                                                    let nextKeywordsSelected: any = ch.keywordsSelected;
                                                                    if (Array.isArray(ch.keywordsSelected)) {
                                                                      const arr = ch.keywordsSelected as import('@/types/chapters').ChapterKeywordSelection[];
                                                                      nextKeywordsSelected = arr.filter(entry => {
                                                                        const low = entry.media?.lowResMedia;
                                                                        const high = entry.media?.highResMedia;
                                                                        return low !== targetUrl && high !== targetUrl;
                                                                      });
                                                                    } else if (ch.keywordsSelected && typeof ch.keywordsSelected === 'object') {
                                                                      const map = ch.keywordsSelected as Record<string, string[]>;
                                                                      const newMap: Record<string, string[]> = {};
                                                                      Object.entries(map).forEach(([k, list]) => {
                                                                        const filtered = (list || []).filter(u => u !== targetUrl);
                                                                        if (filtered.length > 0) newMap[k] = filtered;
                                                                      });
                                                                      nextKeywordsSelected = newMap;
                                                                    }
                                                                    return {
                                                                      ...ch,
                                                                      assets: {
                                                                        ...ch.assets,
                                                                        images: updatedImages.length > 0 ? updatedImages : null,
                                                                        imagesGoogle: updatedGoogle.length > 0 ? updatedGoogle : null,
                                                                        imagesEnvato: updatedEnvato.length > 0 ? updatedEnvato : null
                                                                      },
                                                                      ...(nextKeywordsSelected !== undefined ? { keywordsSelected: nextKeywordsSelected } : {})
                                                                    };
                                                                  }
                                                                  return ch;
                                                                });
                                                                onChaptersUpdate(updatedChapters);
                                                                HelperFunctions.persistSceneUpdate(jobId, updatedChapters, index, 'Media deleted');
                                                              }}
                                                            >
                                                              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                              </svg>
                                                            </IconButton>
                                                          </Box>
                                                        ));
                                                      })()}

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

                                                              // Also remove from chapter assets and keywordsSelected if this URL was associated
                                                              const imageUrlToRemove = imageUrl;
                                                              const updatedChapters = chapters.map((ch, chIndex) => {
                                                                if (chIndex !== index) return ch;
                                                                // Remove from assets.images lists if present
                                                                const imagesList = Array.isArray(ch.assets?.images) ? (ch.assets!.images as string[]) : [];
                                                                const newImagesList = imagesList.filter(u => u !== imageUrlToRemove);
                                                                const newImagesGoogle = (ch.assets?.imagesGoogle || []).filter(u => u !== imageUrlToRemove) || null;
                                                                const newImagesEnvato = (ch.assets?.imagesEnvato || []).filter(u => u !== imageUrlToRemove) || null;

                                                                // Remove keyword selection entries referencing this URL
                                                                let nextKeywordsSelected: any = ch.keywordsSelected;
                                                                if (Array.isArray(ch.keywordsSelected)) {
                                                                  const arr = ch.keywordsSelected as import('@/types/chapters').ChapterKeywordSelection[];
                                                                  nextKeywordsSelected = arr.filter(entry => {
                                                                    const low = entry.media?.lowResMedia;
                                                                    const high = entry.media?.highResMedia;
                                                                    return low !== imageUrlToRemove && high !== imageUrlToRemove;
                                                                  });
                                                                } else if (ch.keywordsSelected && typeof ch.keywordsSelected === 'object') {
                                                                  const map = ch.keywordsSelected as Record<string, string[]>;
                                                                  const newMap: Record<string, string[]> = {};
                                                                  Object.entries(map).forEach(([k, list]) => {
                                                                    const filtered = (list || []).filter(u => u !== imageUrlToRemove);
                                                                    if (filtered.length > 0) newMap[k] = filtered;
                                                                  });
                                                                  nextKeywordsSelected = newMap;
                                                                }

                                                                return {
                                                                  ...ch,
                                                                  assets: {
                                                                    ...ch.assets,
                                                                    images: newImagesList.length > 0 ? newImagesList : null,
                                                                    imagesGoogle: newImagesGoogle,
                                                                    imagesEnvato: newImagesEnvato
                                                                  },
                                                                  ...(nextKeywordsSelected !== undefined ? { keywordsSelected: nextKeywordsSelected } : {})
                                                                };
                                                              });
                                                              onChaptersUpdate(updatedChapters);
                                                              HelperFunctions.persistSceneUpdate(jobId, updatedChapters, index, 'Media deleted');
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
                                                            if (typeof window !== 'undefined') {
                                                              (window as any).__keywordSuggestions = undefined;
                                                            }
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
                                                      // if (!generatingChapters) {
                                                      //   e.stopPropagation();
                                                      //   if (typeof window !== 'undefined') {
                                                      //     (window as any).__keywordSuggestions = undefined;
                                                      //   }
                                                      //   onMediaManagementChapterIndex(index);
                                                      //   onMediaManagementOpen(true);
                                                      // }
                                                    }}
                                                  >
                                                    {generatingChapters ? (
                                                      <>
                                                        <CircularProgress size={16} sx={{ mb: 0.5 }} />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '1rem' }}>
                                                          Generating AI image...
                                                        </Typography>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '1rem', mb: 0.5 }}>
                                                          No Media added
                                                        </Typography>
                                                        <Button
                                                          size="small"
                                                          variant="outlined"
                                                          sx={{ fontSize: '0.9rem', py: 0.3, px: 1, minHeight: 'auto' }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const ch = chapters[index];
                                                            const highlighted = Array.isArray((ch as any).highlightedKeywords)
                                                              ? ((ch as any).highlightedKeywords as string[]).filter(k => typeof k === 'string' && k.trim())
                                                              : [];
                                                            const selected = Array.isArray((ch as any).keywordsSelected)
                                                              ? ((ch as any).keywordsSelected as any[]).map(entry => (entry?.modifiedKeyword || entry?.suggestedKeyword)).filter((k: any) => typeof k === 'string' && k.trim())
                                                              : [];
                                                            const keywords = Array.from(new Set([...(highlighted || []), ...(selected || [])]));
                                                            if (typeof window !== 'undefined') {
                                                              (window as any).__keywordSuggestions = { keyword: keywords[0] || '', keywords };
                                                            }
                                                            onMediaManagementChapterIndex(index);
                                                            onMediaManagementOpen(true);
                                                          }}
                                                        >
                                                          Find Images
                                                        </Button>
                                                      </>
                                                    )}
                                                  </Box>
                                                )}
                                              </Box>
                                            )}
                                          </Box>
                                        </>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Chapter Actions */}
                                {/* <Box sx={{ display: expandedChapterIndex === index ? 'none' : 'flex', flexDirection: 'column', gap: 1, ml: 2, alignSelf: 'center' }}>
                                  {editingChapter === index ? (
                                    <>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const cleaned = chapters.map((ch, i) => (
                                            i === index
                                              ? { ...(ch as any), assets: { ...(ch as any).assets, video: undefined } as any } as any
                                              : ch
                                          ));
                                          onChaptersUpdate(cleaned);
                                          onSaveEdit(index);
                                        }}
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
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                                      
                                      <IconButton
                                        className="chapter-actions"
                                        size="small"
                                        onClick={() => {
                                          onSelectChapter(index);
                                          setExpandedChapterIndex(expandedChapterIndex === index ? null : index);
                                        }}
                                        sx={{
                                          opacity: 1,
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
                                     
                                      <IconButton
                                        className="chapter-actions"
                                        size="small"
                                        onClick={() => onDeleteChapter(index)}
                                        sx={{
                                          opacity: 1,
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

                                      <IconButton
                                        className="chapter-actions"
                                        size="small"
                                        onClick={() => onAddChapterAfter(index)}
                                        sx={{
                                          opacity: 1,
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
                                </Box> */}

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
        onClose={() => {
          if (typeof window !== 'undefined') {
            (window as any).__keywordSuggestions = undefined;
          }
          onMediaManagementOpen(false);
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px', bgcolor: 'background.paper' }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div" sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
            Manage Media - Chapter {(mediaManagementChapterIndex || 0) + 1}
          </Typography>
          <IconButton
            onClick={() => {
              if (typeof window !== 'undefined') {
                (window as any).__keywordSuggestions = undefined;
              }
              onMediaManagementOpen(false);
            }}
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
                onClearSelection={() => onClearSelection()}
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
                      // Transform any legacy merge payload (map) into array entries
                      let nextKeywordsSelected: import('@/types/chapters').ChapterKeywordSelection[] = Array.isArray(chapter.keywordsSelected) ? (chapter.keywordsSelected as import('@/types/chapters').ChapterKeywordSelection[]) : [];
                      if (updatedChapter.keywordsSelectedMerge && typeof updatedChapter.keywordsSelectedMerge === 'object') {
                        const mergeMap = updatedChapter.keywordsSelectedMerge as Record<string, string[]>;
                        const entries = Object.entries(mergeMap);
                        if (entries.length > 0) {
                          const [kw, urls] = entries[0];
                          const low = urls?.[0] || undefined;
                          const high = urls?.[1] || urls?.[0] || undefined;
                          const idx = nextKeywordsSelected.findIndex(e => e && e.suggestedKeyword === kw);
                          const newEntry: import('@/types/chapters').ChapterKeywordSelection = {
                            suggestedKeyword: kw,
                            ...(updatedChapter.modifiedKeywordForMapping && typeof updatedChapter.modifiedKeywordForMapping === 'string' ? { modifiedKeyword: updatedChapter.modifiedKeywordForMapping } : {}),
                            media: {
                              ...(low ? { lowResMedia: low } : {}),
                              ...(high ? { highResMedia: high } : {})
                            },
                            // Add transitionsEffects to chapter and log
                            ...(updatedChapter.keywordsSelected && Array.isArray(updatedChapter.keywordsSelected) && updatedChapter.keywordsSelected.length > 0 && updatedChapter.keywordsSelected[0].transitionsEffects
                              ? { transitionsEffects: updatedChapter.keywordsSelected[0].transitionsEffects }
                              : {}),
                          };
                          if (idx >= 0) {
                            const existing = nextKeywordsSelected[idx];
                            nextKeywordsSelected = nextKeywordsSelected.slice();
                            nextKeywordsSelected[idx] = {
                              ...existing,
                              ...(updatedChapter.modifiedKeywordForMapping && typeof updatedChapter.modifiedKeywordForMapping === 'string' ? { modifiedKeyword: updatedChapter.modifiedKeywordForMapping } : {}),
                              media: {
                                ...(existing.media || {}),
                                ...(low ? { lowResMedia: low } : {}),
                                ...(high ? { highResMedia: high } : {})
                              }
                            };
                          } else {
                            nextKeywordsSelected = [...nextKeywordsSelected, newEntry];
                          }
                        }
                      }
                      // Merge direct keywordsSelected array payload (carry transitionsEffects)
                      if (updatedChapter.keywordsSelected && Array.isArray(updatedChapter.keywordsSelected) && updatedChapter.keywordsSelected.length > 0) {
                        const entry = updatedChapter.keywordsSelected[0] as any;
                        const kw = String(entry?.suggestedKeyword || '').trim();
                        if (kw) {
                          const idx = nextKeywordsSelected.findIndex(e => e && e.suggestedKeyword === kw);
                          const low = entry?.media?.lowResMedia as string | undefined;
                          const high = entry?.media?.highResMedia as string | undefined;
                          const transitionsEffects = Array.isArray(entry?.transitionsEffects) ? entry.transitionsEffects as string[] : undefined;
                          if (idx >= 0) {
                            const existing = nextKeywordsSelected[idx];
                            nextKeywordsSelected = nextKeywordsSelected.slice();
                            nextKeywordsSelected[idx] = {
                              ...existing,
                              media: {
                                ...(existing.media || {}),
                                ...(low ? { lowResMedia: low } : {}),
                                ...(high ? { highResMedia: high } : {})
                              },
                              ...(transitionsEffects ? { transitionsEffects } : {})
                            } as any;
                          } else {
                            nextKeywordsSelected = [
                              ...nextKeywordsSelected,
                              {
                                suggestedKeyword: kw,
                                media: {
                                  ...(low ? { lowResMedia: low } : {}),
                                  ...(high ? { highResMedia: high } : {})
                                },
                                ...(transitionsEffects ? { transitionsEffects } : {})
                              } as any
                            ];
                          }
                        }
                      }
                      return {
                        ...chapter,
                        ...(nextKeywordsSelected.length > 0 ? { keywordsSelected: nextKeywordsSelected } : {}),
                        assets: {
                          ...chapter.assets,
                          ...updatedChapter.assets
                        }
                      };
                    }
                    return chapter;
                  });
                  try {
                    // console.log('Chapter modified (onChapterUpdate):', JSON.stringify(updatedChapters[chapterIndex]));
                    const sceneId = updatedChapters[chapterIndex].id || '';
                    const jobId = updatedChapters[chapterIndex].jobId || '';
                    if (jobId && sceneId) {
                      const modifiedChapter = updatedChapters[chapterIndex];
                      HelperFunctions.updateChapterSceneOnDrive(jobId || '', jobId || '', sceneId, modifiedChapter).then((ok) => {
                        if (!ok) {
                          console.error('Failed to update scene on Drive');
                          try { (window as any).toast?.error('Failed to update scene on Drive'); } catch { }
                        } else {
                          try { (window as any).toast?.success('Scene updated on Drive'); } catch { }
                        }
                      });
                    }
                  } catch { }
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
                suggestionKeywords={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords || []}
                autoSearchOnMount={!!(typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords?.length)}
                currentKeywordForMapping={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword}
                onDoneWithSelected={(selectedUrls, modifiedKeyword) => {
                  const chapterIdx = mediaManagementChapterIndex !== null ? mediaManagementChapterIndex : selectedChapterIndex;
                  const kw = typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword;
                  if (kw) {
                    // add selected urls to the images array and keywordsSelected
                    const updated = chapters.map((ch, idx) => {
                      if (idx !== chapterIdx) return ch;
                      const existingArray: import('@/types/chapters').ChapterKeywordSelection[] = Array.isArray(ch.keywordsSelected) ? (ch.keywordsSelected as import('@/types/chapters').ChapterKeywordSelection[]) : [];
                      const low = selectedUrls?.[0] || undefined;
                      const high = selectedUrls?.[1] || selectedUrls?.[0] || undefined;
                      const existingIdx = existingArray.findIndex(e => e && e.suggestedKeyword === kw);
                      let nextArray: import('@/types/chapters').ChapterKeywordSelection[];
                      if (existingIdx >= 0) {
                        nextArray = existingArray.slice();
                        const existing = nextArray[existingIdx] || {} as import('@/types/chapters').ChapterKeywordSelection;
                        nextArray[existingIdx] = {
                          ...existing,
                          ...(modifiedKeyword && modifiedKeyword.trim() ? { modifiedKeyword: modifiedKeyword.trim() } : {}),
                          media: {
                            ...(existing.media || {}),
                            ...(low ? { lowResMedia: low } : {}),
                            ...(high ? { highResMedia: high } : {})
                          }
                        };
                      } else {
                        nextArray = [
                          ...existingArray,
                          {
                            suggestedKeyword: kw,
                            ...(modifiedKeyword && modifiedKeyword.trim() ? { modifiedKeyword: modifiedKeyword.trim() } : {}),
                            media: {
                              ...(low ? { lowResMedia: low } : {}),
                              ...(high ? { highResMedia: high } : {})
                            }
                          }
                        ];
                      }
                      return {
                        ...ch,
                        keywordsSelected: nextArray,
                        assets: {
                          ...ch.assets,
                          images: [...(ch.assets?.images || []), ...selectedUrls],
                        }
                      };
                    });
                    // try {
                    //   console.log('Media added to chapter:', JSON.stringify(updated[chapterIdx]));
                    // } catch {}
                    onChaptersUpdate(updated);
                    HelperFunctions.persistSceneUpdate(jobId, updated, chapterIdx, 'Media added');
                    if (typeof window !== 'undefined') {
                      (window as any).__keywordSuggestions = undefined;
                    }
                  }
                }}
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

      {/* Chapter Edit Dialog */}
      <ChapterEditDialog
        open={chapterEditDialogOpen}
        chapter={chapters[selectedChapterIndex] || null}
        chapterIndex={selectedChapterIndex}
        language={language}
        onClose={() => onChapterEditDialogOpen(false)}
        onSave={(chapterIndex, updatedChapter) => {
          const updatedChapters = chapters.map((ch, idx) =>
            idx === chapterIndex ? updatedChapter : ch
          );
          onChaptersUpdate(updatedChapters);
          onChapterEditDialogOpen(false);
        }}
      />
    </Paper>
  );
};

export default ChaptersSection;
