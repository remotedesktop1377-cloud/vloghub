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
  FormControlLabel,
  Grid
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
  SkipPrevious as SkipPreviousIcon,
  AddCircle as AddCircleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HighlightAlt as HighlightAltIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { SceneData, SceneKeywordSelection } from '../../types/sceneData';
import { HelperFunctions, SecureStorageHelpers } from '../../utils/helperFunctions';
import { ImageViewModal } from '../ui/ImageViewer/ImageViewModal';
import { useImageViewer, formatSceneDataImages } from '../../hooks/useImageViewer';
import { PRIMARY, SUCCESS, WARNING, ERROR, INFO, PURPLE, NEUTRAL, TEXT, BORDER, HOVER, SPECIAL } from '../../styles/colors';
import { SceneDataEditDialog } from './SceneDataEditDialog';
import TextWithHighlights from '../scriptProductionComponents/TextWithHighlights';
import MediaManagementDialog from '../../dialogs/MediaManagementDialog';
import CustomAudioPlayer from '../scriptProductionComponents/CustomAudioPlayer';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { Settings } from '@/types/scriptData';

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

interface SceneDataSectionProps {
  jobId: string;
  scenesData: SceneData[];
  SceneDataGenerated: boolean;
  generatingSceneData: boolean;
  editingSceneData: number | null;
  editHeading: string;
  editNarration: string;
  selectedSceneDataIndex: number;
  rightTabIndex: number;
  aiImagesEnabled: boolean;
  imagesLoading: boolean;
  generatedImages: string[];
  aiPrompt: string;
  pickerOpen: boolean;
  pickerSceneDataIndex: number | null;
  pickerNarrations: string[];
  pickerLoading: boolean;
  uploadedImages: string[];
  isDraggingUpload: boolean;
  SceneDataImagesMap: Record<number, string[]>;
  selectedText: { SceneDataIndex: number; text: string; startIndex: number; endIndex: number } | null;
  onAddSceneDataAfter: (index: number) => void;
  onDeleteSceneData: (index: number) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  onEditHeadingChange: (heading: string) => void;
  onEditNarrationChange: (narration: string) => void;
  onStartEdit: (index: number, heading: string, narration: string) => void;
  onDragEnd: (result: DropResult) => void;
  onSelectSceneData: (index: number) => void;
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
  onPickerSceneDataIndex: (index: number | null) => void;
  onPickerLoading: (loading: boolean) => void;
  onPickerNarrations: (narrations: string[]) => void;
  onSceneDataImagesMapChange: (map: Record<number, string[]>) => void;
  onGeneratedImagesChange: (images: string[]) => void;
  onRightTabIndexChange: (index: number) => void;
  mediaManagementOpen: boolean;
  mediaManagementSceneDataIndex: number | null;
  onMediaManagementOpen: (open: boolean) => void;
  onMediaManagementSceneDataIndex: (index: number | null) => void;
  onSceneDataUpdate: (sceneData: SceneData[]) => void;
  onTextSelection: (sceneDataIndex: number, event: React.MouseEvent) => void;
  onAddKeyword: () => void;
  onClearSelection: () => void;
  onToolbarInteraction: (interacting: boolean) => void;
  language: string;
  onGoogleImagePreview?: (imageUrl: string) => void;
  // Optional: notify parent when opening media for a specific keyword
  onOpenMediaForKeyword?: (SceneDataIndex: number, keyword: string) => void;
  // SceneData editing dialog
  SceneDataEditDialogOpen: boolean;
  onSceneDataEditDialogOpen: (open: boolean) => void;
  onSceneDataEditDialogSceneDataIndex: (index: number | null) => void;
  // Drive library options
  driveBackgrounds?: Array<{ id: string; name: string; webViewLink?: string; webContentLink?: string }>;
  driveMusic?: Array<{ id: string; name: string; webContentLink?: string }>;
  driveTransitions?: Array<{ id: string; name: string; webViewLink?: string }>;
  projectSettings: Settings | null;

  // Open project settings dialog in scene context
  onOpenProjectSettingsDialog?: (sceneIndex: number) => void;
  // Context for refining image search queries
  scriptTitle?: string;
  trendingTopic?: string;
  location?: string;
}

const SceneDataSection: React.FC<SceneDataSectionProps> = ({
  jobId,
  scenesData,
  SceneDataGenerated,
  editingSceneData,
  editNarration,
  selectedSceneDataIndex,
  SceneDataImagesMap,
  selectedText,
  onAddSceneDataAfter,
  onDeleteSceneData,
  onSaveEdit,
  onCancelEdit,
  onEditNarrationChange,
  onStartEdit,
  onDragEnd,
  onSelectSceneData,
  onPickerOpen,
  onPickerSceneDataIndex,
  onPickerLoading,
  onPickerNarrations,
  onSceneDataImagesMapChange,
  mediaManagementOpen,
  mediaManagementSceneDataIndex,
  onMediaManagementOpen,
  onMediaManagementSceneDataIndex,
  onSceneDataUpdate,
  onTextSelection,
  onAddKeyword,
  onClearSelection,
  onToolbarInteraction,
  language,
  onGoogleImagePreview,
  SceneDataEditDialogOpen,
  onSceneDataEditDialogOpen,
  onSceneDataEditDialogSceneDataIndex,
  driveMusic,
  projectSettings,
  onOpenProjectSettingsDialog,
  scriptTitle,
  trendingTopic,
  location,
}) => {
  const [expandedSceneDataIndex, setExpandedSceneDataIndex] = React.useState<number | null>(null);
  // Volume popover open state per SceneData (inline editor)
  const [volumeOpenIndex, setVolumeOpenIndex] = React.useState<number | null>(null);
  // Image viewer hook for enhanced image viewing
  const imageViewer = useImageViewer();

  // Handle opening image viewer for a SceneData
  const handleImageClick = (SceneDataIndex: number, imageIndex: number = 0, isPreview: boolean) => {
    const sceneData = scenesData[SceneDataIndex];
    const SceneDataImages = SceneDataImagesMap[SceneDataIndex] || [];

    let images: Array<{ url: string; name?: string; type?: 'generated' | 'uploaded' }> = [];

    if (isPreview) {
      // When clicking preview image, use formatSceneDataImages
      images = formatSceneDataImages(
        SceneDataImages,
        sceneData.gammaPreviewImage || '',
      );
    } else {
      // When clicking on selected images, get all images from sceneData.assets.images
      const allImages = (sceneData.assets && Array.isArray(sceneData.assets.images))
        ? sceneData.assets.images
        : [];

      // Convert all images to ImageData format
      allImages.forEach((url, idx) => {
        images.push({
          url,
          name: `Image ${idx + 1}`,
          type: 'uploaded'
        });
      });
    }

    if (images.length > 0) {
      imageViewer.openViewer(images, imageIndex, 'preview');
    }
  };

  return (
    <Paper sx={{ minHeight: '400px' }}>
      {SceneDataGenerated && scenesData.length > 0 ? (
        <Box sx={{ width: '100%' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="SceneData" isDropDisabled={true} isCombineEnabled={true} ignoreContainerClipping={true}>
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, alignItems: 'stretch', width: '100%' }}
                >
                  {scenesData.map((sceneData: SceneData, index: number) => (
                    <Box key={sceneData.id || index.toString()} sx={{ width: '100%' }}>
                      <Draggable key={(sceneData.id || index.toString()) + '-draggable'} draggableId={sceneData.id || index.toString()} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            variant="elevation"
                            sx={{
                              transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                              boxShadow: snapshot.isDragging ? 8 : 0,
                              width: '100%',
                              bgcolor: selectedSceneDataIndex === index ? 'rgba(29,161,242,0.06)' : 'transparent',
                              cursor: 'pointer',
                              // transition: 'background-color 0.2s ease',
                              overflow: 'hidden',
                              borderColor: selectedSceneDataIndex === index ? INFO.main : BORDER.dark,
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
                            onClick={() => onSelectSceneData(index)}
                          >
                            <CardContent sx={{ p: 0, width: '100%', height: 'auto', '&:last-child': { paddingBottom: 0 } }}>
                              <Box sx={{
                                display: 'flex',
                                height: '100%',
                                width: '100%',
                                bgcolor: 'rgba(29,161,242,0.08)'
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

                                {/* Scene information */}
                                <Box data-scenedata-index={index}>

                                  <Box sx={{
                                    width: '150px',
                                    height: '100%',
                                    color: INFO.main,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    py: 3,
                                  }}>
                                    <Box sx={{ fontSize: '2rem', fontWeight: '700' }}>
                                      {index + 1}
                                    </Box>
                                    <Box sx={{
                                      fontSize: '1.5rem',
                                      color: 'text.secondary',
                                      display: 'flex',
                                      alignItems: 'center',
                                      alignSelf: 'center',
                                      textAlign: 'center',
                                    }}>
                                      {/* <TimeIcon sx={{ fontSize: 10 }} /> */}
                                      {sceneData.duration || '0s'}
                                    </Box>
                                    {typeof onOpenProjectSettingsDialog === 'function' && (
                                      <Button onClick={(e) => { e.stopPropagation(); onOpenProjectSettingsDialog(index); }}><SettingsIcon /></Button>
                                    )}
                                  </Box>

                                </Box>

                                <Box sx={{
                                  display: 'flex',
                                  width: '100%',
                                  height: '100%',
                                  // bgcolor: 'yellow' - parent container
                                }}>
                                  {editingSceneData === index ? (
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
                                            fontFamily: HelperFunctions.getFontFamilyForLanguage(HelperFunctions.detectLanguage(sceneData.narration)),
                                            lineHeight: HelperFunctions.isRTLLanguage(HelperFunctions.detectLanguage(sceneData.narration)) ? 2.5 : 1.8,
                                            fontSize: '1.2rem',
                                            textAlign: HelperFunctions.isRTLLanguage(HelperFunctions.detectLanguage(sceneData.narration)) ? 'right' : 'left',
                                          },
                                          ...HelperFunctions.getDirectionSx(HelperFunctions.detectLanguage(sceneData.narration)),
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
                                            value={sceneData.duration || ''}
                                            onChange={(e) => {
                                              const updatedSceneData = scenesData.map((ch, idx) =>
                                                idx === index ? { ...ch, duration: e.target.value } : ch
                                              );
                                              onSceneDataUpdate(updatedSceneData);
                                              SecureStorageHelpers.setScriptMetadata({ ...SecureStorageHelpers.getScriptMetadata(), scenesData: updatedSceneData });
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
                                    /* Narration Content */
                                    <Grid container sx={{
                                      display: 'flex', width: '100%', height: '100%',
                                      // bgcolor: 'orange' - parent 1st container
                                    }}>
                                      <Grid item xs={9} sx={{
                                        flex: expandedSceneDataIndex === index ? '1 1 100%' : '0 0 70%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        // height: '100%',
                                        overflow: 'auto',
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-start',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        // bgcolor: 'pink', child 1st container
                                      }}>
                                        <Box
                                          sx={{
                                            fontSize: '1.5rem',
                                            color: 'text.primary',
                                            px: 1.5,
                                            py: 1,
                                            fontFamily: HelperFunctions.getFontFamilyForLanguage(HelperFunctions.detectLanguage(sceneData.narration)),
                                            lineHeight: HelperFunctions.isRTLLanguage(HelperFunctions.detectLanguage(sceneData.narration)) ? 2.5 : 1.8,
                                            userSelect: 'text',
                                            cursor: 'text',
                                            ...HelperFunctions.getDirectionSx(HelperFunctions.detectLanguage(sceneData.narration)),
                                            // textAlign: HelperFunctions.isRTLLanguage(language || 'english') ? 'right' : 'left',
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
                                          {expandedSceneDataIndex !== index && (
                                            <>
                                              {sceneData.narration ? (
                                                <TextWithHighlights
                                                  text={sceneData.narration}
                                                  keywords={sceneData.highlightedKeywords || []}
                                                />
                                              ) : (
                                                'Narration content will be generated here.'
                                              )}
                                            </>
                                          )}
                                        </Box>

                                        {/* Inline Editor (expanded view) */}
                                        {expandedSceneDataIndex === index && (
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
                                                value={scenesData[index].narration}
                                                onChange={(e) => {
                                                  onEditNarrationChange(e.target.value);
                                                  // Recompute duration from narration length (simple heuristic: ~150 wpm)
                                                  const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
                                                  const seconds = Math.ceil((words / 150) * 60);
                                                  const updated = scenesData.map((ch, i) => i === index ? { ...ch, narration: e.target.value, words, durationInSeconds: seconds } : ch);
                                                  onSceneDataUpdate(updated);
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
                                                  Duration: {Math.max(0, Math.round(scenesData[index].durationInSeconds))} seconds
                                                </Typography>
                                              </Box>

                                              {Array.isArray(((scenesData[index] as any).videoEffects?.backgroundMusic)) && ((scenesData[index] as any).videoEffects.backgroundMusic as any[]).length > 0 && (
                                                <Box sx={{ width: '100%' }}>
                                                  {(((scenesData[index] as any).videoEffects.backgroundMusic) as any[]).map((bm: any, bmIdx: number) => {
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
                                                              const updated: SceneData[] = scenesData.map((ch, i) => {
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
                                                              onSceneDataUpdate(updated);
                                                              setVolumeOpenIndex(null);
                                                              GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[index], 'Music changed');
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
                                                                  src={id ? `${API_ENDPOINTS.API_GOOGLE_DRIVE_MEDIA}${id}` : ''}
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
                                                                    const updated: SceneData[] = scenesData.map((ch, i) => {
                                                                      if (i !== index) return ch;
                                                                      const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                      const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                      nextItem.volume = Number(vol ?? 0.3);
                                                                      list[bmIdx] = nextItem;
                                                                      return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                    });
                                                                    onSceneDataUpdate(updated);
                                                                    GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[index], 'Music volume updated');
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
                                                                const updated: SceneData[] = scenesData.map((ch, i) => {
                                                                  if (i !== index) return ch;
                                                                  const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                  const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                  nextItem.autoAdjust = !(nextItem.autoAdjust === true);
                                                                  list[bmIdx] = nextItem;
                                                                  return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                });
                                                                onSceneDataUpdate(updated);
                                                                GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[index], 'Music auto-adjust toggled');
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
                                                                const updated: SceneData[] = scenesData.map((ch, i) => {
                                                                  if (i !== index) return ch;
                                                                  const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                  const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                  nextItem.fadeIn = !(nextItem.fadeIn === true);
                                                                  list[bmIdx] = nextItem;
                                                                  return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                });
                                                                onSceneDataUpdate(updated);
                                                                GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[index], 'Music fade-in toggled');
                                                              }}
                                                              sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                                            >Fade In</Button></span>
                                                          </Tooltip>
                                                          <Tooltip title={(bm?.fadeOut !== false ? 'Fade Out: On' : 'Fade Out: Off')}>
                                                            <span><Button
                                                              size="small"
                                                              variant={(bm?.fadeOut !== false ? 'contained' : 'outlined')}
                                                              onClick={() => {
                                                                const updated: SceneData[] = scenesData.map((ch, i) => {
                                                                  if (i !== index) return ch;
                                                                  const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                  const nextItem = { ...(list[bmIdx] || { id: Date.now().toString(), selectedMusic: '', volume: 0.3, autoAdjust: true, fadeIn: true, fadeOut: true }) };
                                                                  nextItem.fadeOut = !(nextItem.fadeOut === true);
                                                                  list[bmIdx] = nextItem;
                                                                  return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: list } } as any;
                                                                });
                                                                onSceneDataUpdate(updated);
                                                                GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[index], 'Music fade-out toggled');
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
                                                              const current = Array.isArray((scenesData[index] as any).videoEffects?.backgroundMusic) ? (scenesData[index] as any).videoEffects.backgroundMusic : [];
                                                              // already saved link on change; here we just ensure item exists
                                                              const applied = current.map((item: any, idx: number) => idx === bmIdx ? { ...item } : item);
                                                              const updated: SceneData[] = scenesData.map((ch, i) => {
                                                                if (i !== index) return ch;
                                                                return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: applied } } as any;
                                                              });
                                                              onSceneDataUpdate(updated);
                                                              GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[index], 'Music applied');
                                                            }}
                                                          >Apply Music</Button>

                                                          <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            sx={{ textTransform: 'none', fontSize: '1rem', width: 100, height: 40 }}
                                                            onClick={() => {
                                                              const updated: SceneData[] = scenesData.map((ch, i) => {
                                                                if (i !== index) return ch;
                                                                const list = Array.isArray((ch as any).videoEffects?.backgroundMusic) ? ([...(ch as any).videoEffects.backgroundMusic] as any[]) : ([] as any[]);
                                                                const pruned = list.filter((_: any, idx: number) => idx !== bmIdx);
                                                                return { ...(ch as any), videoEffects: { ...(ch as any).videoEffects, backgroundMusic: pruned } } as any;
                                                              });
                                                              onSceneDataUpdate(updated);
                                                              GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[index], 'Music removed');
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
                                        {sceneData.highlightedKeywords && sceneData.highlightedKeywords.length > 0 && (
                                          <Box sx={{ px: 1.5, py: 0.5, width: '100%' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                              <Typography variant="caption" sx={{
                                                color: 'text.secondary',
                                                fontSize: '1.3rem',
                                                fontWeight: 500,
                                                display: 'block'
                                              }}>
                                                Keywords ({sceneData.highlightedKeywords.length}):
                                              </Typography>
                                              <Button
                                                size="large"
                                                variant="text"
                                                color="error"
                                                onClick={() => {
                                                  onSceneDataUpdate(scenesData.map((ch, idx) =>
                                                    idx === index
                                                      ? { ...ch, highlightedKeywords: [] }
                                                      : ch
                                                  ));
                                                  GoogleDriveServiceFunctions.persistSceneUpdate(jobId, scenesData[index], 'All keywords cleared');
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
                                              {sceneData.highlightedKeywords.map((keyword, keywordIndex) => {
                                                // Check if this keyword has media or text overlay attached
                                                const hasMedia = (() => {
                                                  if (Array.isArray(sceneData.keywordsSelected)) {
                                                    const arr = sceneData.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[];
                                                    const entry = arr.find(e => 
                                                      (e.suggestedKeyword === keyword || e.modifiedKeyword === keyword)
                                                    );
                                                    return !!(entry?.media?.lowResMedia || entry?.media?.highResMedia || entry?.textOverlay);
                                                  } else if (sceneData.keywordsSelected && typeof sceneData.keywordsSelected === 'object') {
                                                    const map = sceneData.keywordsSelected as Record<string, string[]>;
                                                    const mediaUrls = map[keyword] || [];
                                                    return mediaUrls.length > 0;
                                                  }
                                                  return false;
                                                })();

                                                return (
                                                  <Box
                                                    key={keywordIndex}
                                                    data-keyword-badge="true"
                                                    sx={{
                                                      bgcolor: hasMedia ? PRIMARY.main : SUCCESS.light,
                                                      color: hasMedia ? 'white' : 'text.white',
                                                      px: 1,
                                                      py: 0.25,
                                                      borderRadius: 0.5,
                                                      fontSize: '1.3rem',
                                                      fontWeight: 500,
                                                      border: `2px solid ${hasMedia ? PRIMARY.dark : SUCCESS.main}`,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 0.5,
                                                      cursor: 'pointer',
                                                      position: 'relative',
                                                      '&:hover': {
                                                        bgcolor: hasMedia ? PRIMARY.dark : SUCCESS.main,
                                                        color: hasMedia ? 'white' : SUCCESS.light,
                                                      }
                                                    }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (typeof window !== 'undefined') {
                                                        (window as any).__keywordSuggestions = { keyword, keywords: [keyword] };
                                                      }
                                                      onMediaManagementSceneDataIndex(index);
                                                      onMediaManagementOpen(true);
                                                      // if (typeof onOpenMediaForKeyword === 'function') {
                                                      //   onOpenMediaForKeyword(index, keyword);
                                                      // }
                                                    }}
                                                  >
                                                    {hasMedia && (
                                                      <CheckIcon sx={{ fontSize: '1.2rem', color: 'white' }} />
                                                    )}
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
                                                      const updatedSceneData: SceneData[] = scenesData.map((ch, idx) => {
                                                        if (idx !== index) return ch;
                                                        // Build list of URLs tied to this keyword based on new array format (fallback to legacy map)
                                                        let urlsToRemove: string[] = [];
                                                        if (Array.isArray(ch.keywordsSelected)) {
                                                          const arr = ch.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[];
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
                                                        const clips = Array.isArray(ch.assets?.clips) ? ch.assets!.clips! : [];
                                                        const filteredImages = images.filter(u => !urlsToRemove.includes(u));
                                                        const filteredClips = clips.filter(c => !urlsToRemove.includes(c.url));
                                                        // Remove keyword from keywordsSelected
                                                        let nextKeywordsSelected: import('@/types/sceneData').SceneKeywordSelection[] | Record<string, string[]> | undefined = ch.keywordsSelected;
                                                        if (Array.isArray(ch.keywordsSelected)) {
                                                          const arr = ch.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[];
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
                                                            clips: filteredClips.length > 0 ? filteredClips : null,
                                                          }
                                                        };
                                                      });
                                                      onSceneDataUpdate(updatedSceneData);
                                                      GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updatedSceneData[index], `Keyword removed`);
                                                      if (typeof window !== 'undefined' && (window as any).toast) {
                                                        HelperFunctions.showSuccess(`Removed "${keyword}" and its images`);
                                                      }
                                                    }}
                                                  >
                                                    ×
                                                  </Box>
                                                </Box>
                                              );
                                              })}
                                            </Box>
                                            {/* Media Selected (prefer scene-level videoEffects, fallback to project-level) */}
                                            {(sceneData.sceneSettings || projectSettings) && (() => {
                                              const settings: Settings = sceneData.sceneSettings || projectSettings as Settings;

                                              const effective = {
                                                videoLogo: settings.videoLogo?.name ? settings.videoLogo?.name : projectSettings?.videoLogo?.name,
                                                videoTransitionEffect: settings.videoTransitionEffect?.name ? settings.videoTransitionEffect?.name : projectSettings?.videoTransitionEffect?.name,
                                                videoBackgroundMusic: settings.videoBackgroundMusic?.name ? settings.videoBackgroundMusic?.name : projectSettings?.videoBackgroundMusic?.name,
                                                videoBackgroundVideo: settings.videoBackgroundVideo?.name ? settings.videoBackgroundVideo?.name : projectSettings?.videoBackgroundVideo?.name,
                                                videoBackgroundImage: settings.videoBackgroundImage?.name ? settings.videoBackgroundImage?.name : projectSettings?.videoBackgroundImage?.name,
                                                backgroundType: settings.backgroundType || projectSettings?.backgroundType || (settings.videoBackgroundImage || projectSettings?.videoBackgroundImage ? 'image' : 'video'),
                                              };

                                              return (
                                                <Box sx={{ mt: 1 }}>
                                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {effective.videoLogo && (
                                                      <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: PRIMARY.light, color: 'text.white', border: `1px solid ${PRIMARY.main}` }}>
                                                        Logo: {effective.videoLogo}</Box>
                                                    )}
                                                    {effective.videoTransitionEffect && (
                                                      <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: INFO.light, color: 'text.white', border: `1px solid ${INFO.main}` }}>
                                                        Transition: {String(effective.videoTransitionEffect).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Box>
                                                    )}
                                                    {effective.videoBackgroundMusic && (
                                                      <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: SUCCESS.light, color: 'text.white', border: `1px solid ${SUCCESS.main}` }}>
                                                        Background Music: {effective.videoBackgroundMusic}
                                                      </Box>
                                                    )}
                                                    {effective.backgroundType === 'video' && effective.videoBackgroundVideo && (
                                                      <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: PURPLE.light, color: 'text.white', border: `1px solid ${PURPLE.main}` }}>
                                                        Background Video: {effective.videoBackgroundVideo}
                                                      </Box>
                                                    )}
                                                    {effective.backgroundType === 'image' && effective.videoBackgroundImage && (
                                                      <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, fontSize: '1.1rem', bgcolor: PURPLE.light, color: 'text.white', border: `1px solid ${PURPLE.main}` }}>
                                                        Background Image: {effective.videoBackgroundImage}
                                                      </Box>
                                                    )}
                                                  </Box>
                                                </Box>
                                              );
                                            })()}
                                          </Box>
                                        )}

                                        {/* Text Selection Toolbar */}
                                        {selectedText && selectedText.SceneDataIndex === index && (() => {
                                          const SceneData = scenesData[index];
                                          const currentKeywords = sceneData.highlightedKeywords || [];
                                          const selectedTextLower = selectedText?.text.toLowerCase().trim() || '';

                                          // Check for conflicts
                                          const exactMatch = currentKeywords.some(keyword => keyword.toLowerCase().trim() === selectedTextLower);
                                          const containsExisting = currentKeywords.some(keyword => selectedTextLower.includes(keyword.toLowerCase().trim()));
                                          const isContainedInExisting = currentKeywords.some(keyword => keyword.toLowerCase().trim().includes(selectedTextLower));
                                          const hasError = exactMatch || containsExisting || isContainedInExisting;
                                          const isRTL = language && ['urdu', 'arabic', 'persian', 'sindhi', 'pashto', 'balochi', 'hebrew'].includes(language.toLowerCase());

                                          return (
                                            <Box
                                              data-toolbar="keyword-toolbar"
                                              sx={{
                                                position: 'fixed',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                bgcolor: 'rgba(20, 20, 20, 0.95)',
                                                background: hasError
                                                  ? 'linear-gradient(135deg, rgba(30, 15, 15, 0.98) 0%, rgba(25, 20, 20, 0.98) 50%, rgba(20, 20, 20, 0.98) 100%)'
                                                  : 'linear-gradient(135deg, rgba(15, 30, 20, 0.98) 0%, rgba(20, 25, 20, 0.98) 50%, rgba(20, 20, 20, 0.98) 100%)',
                                                border: hasError 
                                                  ? `2px solid ${ERROR.main}` 
                                                  : `2px solid ${SUCCESS.main}`,
                                                borderRadius: '16px',
                                                p: 0,
                                                boxShadow: hasError
                                                  ? `0 20px 60px rgba(239, 68, 68, 0.35), 0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                                                  : `0 20px 60px rgba(76, 175, 80, 0.35), 0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                                                zIndex: 10000,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                minWidth: '320px',
                                                maxWidth: '650px',
                                                backdropFilter: 'blur(20px) saturate(180%)',
                                                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                animation: 'fadeInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                                                overflow: 'hidden',
                                                '&::before': {
                                                  content: '""',
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  right: 0,
                                                  height: '3px',
                                                  background: hasError
                                                    ? `linear-gradient(90deg, ${ERROR.main} 0%, ${ERROR.light} 50%, ${ERROR.main} 100%)`
                                                    : `linear-gradient(90deg, ${SUCCESS.main} 0%, ${SUCCESS.light} 50%, ${SUCCESS.main} 100%)`,
                                                  opacity: 0.8,
                                                },
                                                ...(isRTL ? { direction: 'rtl' } : { direction: 'ltr' }),
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                              onMouseEnter={() => onToolbarInteraction(true)}
                                              onMouseLeave={() => onToolbarInteraction(false)}
                                            >
                                              {/* Header Section with Icon */}
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 1.5,
                                                  px: 3,
                                                  pt: 3,
                                                  pb: 2,
                                                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: hasError 
                                                      ? 'rgba(239, 68, 68, 0.15)' 
                                                      : 'rgba(76, 175, 80, 0.15)',
                                                    border: `1px solid ${hasError ? ERROR.main : SUCCESS.main}`,
                                                    boxShadow: hasError
                                                      ? `0 4px 12px rgba(239, 68, 68, 0.2)`
                                                      : `0 4px 12px rgba(76, 175, 80, 0.2)`,
                                                  }}
                                                >
                                                  {hasError ? (
                                                    <ErrorOutlineIcon 
                                                      sx={{ 
                                                        fontSize: 20, 
                                                        color: ERROR.light,
                                                        animation: 'pulse 2s ease-in-out infinite',
                                                      }} 
                                                    />
                                                  ) : (
                                                    <HighlightAltIcon 
                                                      sx={{ 
                                                        fontSize: 20, 
                                                        color: SUCCESS.light,
                                                      }} 
                                                    />
                                                  )}
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      color: 'rgba(255, 255, 255, 0.6)',
                                                      fontSize: '11px',
                                                      fontWeight: 600,
                                                      fontFamily: 'var(--font-plus-jakarta-sans)',
                                                      textTransform: 'uppercase',
                                                      letterSpacing: '0.08em',
                                                      mb: 0.5,
                                                    }}
                                                  >
                                                    {hasError ? 'Keyword Conflict' : 'Selected Text'}
                                                  </Typography>
                                                  <Typography 
                                                    variant="body1" 
                                                    sx={{
                                                      color: hasError ? ERROR.light : TEXT.primary,
                                                      fontWeight: 600,
                                                      fontSize: '20px',
                                                      fontFamily: 'var(--font-playfair-display), Georgia, serif',
                                                      letterSpacing: '0.02em',
                                                      lineHeight: 1.4,
                                                      textAlign: isRTL ? 'right' : 'left',
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap',
                                                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                                    }}
                                                  >
                                                    {selectedText?.text}
                                                  </Typography>
                                                </Box>
                                              </Box>

                                              {/* Content Section */}
                                              <Box
                                                sx={{
                                                  px: 3,
                                                  py: 2.5,
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: 2,
                                                }}
                                              >
                                                {exactMatch ? (
                                                  <Box
                                                    sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 1.5,
                                                      p: 2,
                                                      borderRadius: '10px',
                                                      bgcolor: 'rgba(239, 68, 68, 0.12)',
                                                      border: `1px solid rgba(239, 68, 68, 0.3)`,
                                                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                                                    }}
                                                  >
                                                    <ErrorOutlineIcon sx={{ color: ERROR.light, fontSize: 20 }} />
                                                    <Typography 
                                                      variant="body2" 
                                                      sx={{ 
                                                        color: ERROR.light, 
                                                        fontWeight: 500,
                                                        fontSize: '13px',
                                                        fontFamily: 'var(--font-plus-jakarta-sans)',
                                                        flex: 1,
                                                      }}
                                                    >
                                                      This keyword already exists in your list
                                                    </Typography>
                                                  </Box>
                                                ) : containsExisting ? (
                                                  <Box
                                                    sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 1.5,
                                                      p: 2,
                                                      borderRadius: '10px',
                                                      bgcolor: 'rgba(255, 152, 0, 0.12)',
                                                      border: `1px solid rgba(255, 152, 0, 0.3)`,
                                                      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                                                    }}
                                                  >
                                                    <WarningAmberIcon sx={{ color: WARNING.light, fontSize: 20 }} />
                                                    <Typography 
                                                      variant="body2" 
                                                      sx={{ 
                                                        color: WARNING.light, 
                                                        fontWeight: 500,
                                                        fontSize: '13px',
                                                        fontFamily: 'var(--font-plus-jakarta-sans)',
                                                        flex: 1,
                                                      }}
                                                    >
                                                      Selection contains existing keywords
                                                    </Typography>
                                                  </Box>
                                                ) : isContainedInExisting ? (
                                                  <Box
                                                    sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 1.5,
                                                      p: 2,
                                                      borderRadius: '10px',
                                                      bgcolor: 'rgba(255, 152, 0, 0.12)',
                                                      border: `1px solid rgba(255, 152, 0, 0.3)`,
                                                      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                                                    }}
                                                  >
                                                    <WarningAmberIcon sx={{ color: WARNING.light, fontSize: 20 }} />
                                                    <Typography 
                                                      variant="body2" 
                                                      sx={{ 
                                                        color: WARNING.light, 
                                                        fontWeight: 500,
                                                        fontSize: '13px',
                                                        fontFamily: 'var(--font-plus-jakarta-sans)',
                                                        flex: 1,
                                                      }}
                                                    >
                                                      This text is part of an existing keyword
                                                    </Typography>
                                                  </Box>
                                                ) : null}

                                                {/* Action Buttons */}
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    gap: 1.5,
                                                    alignItems: 'stretch',
                                                  }}
                                                >
                                                  {!hasError && (
                                                    <Button
                                                      variant="contained"
                                                      onClick={onAddKeyword}
                                                      sx={{
                                                        flex: 1,
                                                        px: 3,
                                                        py: 1.5,
                                                        fontSize: '15px',
                                                        height: '48px',
                                                        fontWeight: 600,
                                                        fontFamily: 'var(--font-plus-jakarta-sans)',
                                                        bgcolor: SUCCESS.main,
                                                        color: TEXT.primary,
                                                        borderRadius: '10px',
                                                        border: `1px solid ${SUCCESS.dark}`,
                                                        textTransform: 'none',
                                                        letterSpacing: '0.02em',
                                                        boxShadow: `0 6px 20px rgba(76, 175, 80, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        '&::before': {
                                                          content: '""',
                                                          position: 'absolute',
                                                          top: 0,
                                                          left: '-100%',
                                                          width: '100%',
                                                          height: '100%',
                                                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                                                          transition: 'left 0.5s',
                                                        },
                                                        '&:hover': {
                                                          bgcolor: SUCCESS.dark,
                                                          boxShadow: `0 8px 24px rgba(76, 175, 80, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
                                                          transform: 'translateY(-2px) scale(1.02)',
                                                          '&::before': {
                                                            left: '100%',
                                                          },
                                                        },
                                                        '&:active': {
                                                          transform: 'translateY(0px) scale(1)',
                                                          boxShadow: `0 4px 12px rgba(76, 175, 80, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)`,
                                                        },
                                                      }}
                                                    >
                                                      <AddCircleIcon sx={{ fontSize: 18, flexShrink: 0 }} />
                                                      Add Keyword
                                                    </Button>
                                                  )}

                                                  <Button
                                                    variant="outlined"
                                                    onClick={() => {
                                                      onClearSelection();
                                                      window.getSelection()?.removeAllRanges();
                                                    }}
                                                    sx={{
                                                      flex: hasError ? 1 : '0 0 auto',
                                                      px: 3,
                                                      py: 1.5,
                                                      fontSize: '15px',
                                                      height: '48px',
                                                      minWidth: hasError ? 'auto' : '140px',
                                                      fontWeight: 600,
                                                      fontFamily: 'var(--font-plus-jakarta-sans)',
                                                      color: ERROR.main,
                                                      borderColor: ERROR.main,
                                                      borderRadius: '10px',
                                                      borderWidth: '1.5px',
                                                      textTransform: 'none',
                                                      letterSpacing: '0.02em',
                                                      bgcolor: 'transparent',
                                                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 1,
                                                      '&:hover': {
                                                        borderColor: ERROR.dark,
                                                        color: ERROR.dark,
                                                        bgcolor: 'rgba(239, 68, 68, 0.12)',
                                                        borderWidth: '1.5px',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 6px 20px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3)`,
                                                      },
                                                      '&:active': {
                                                        transform: 'translateY(0px)',
                                                        boxShadow: `0 2px 8px rgba(239, 68, 68, 0.2)`,
                                                      },
                                                    }}
                                                  >
                                                    <CancelIcon sx={{ fontSize: 18, flexShrink: 0 }} />
                                                    Cancel
                                                  </Button>
                                                </Box>
                                              </Box>
                                            </Box>
                                          );
                                        })()}

                                      </Grid>

                                      {/* Media Section */}
                                      {expandedSceneDataIndex !== index && (
                                        <Grid item xs={3} sx={{
                                          // flex: '0 0 30%',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          // alignItems: 'stretch',
                                          justifyContent: 'space-between',
                                          // bgcolor: 'red', // child 2nd container
                                        }}>
                                          {/* Fixed Header */}
                                          <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            mb: 1,
                                            // flexShrink: 0,
                                            // bgcolor: 'blue',
                                          }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '1.25rem' }}>
                                              📎 Media ({(SceneDataImagesMap[index] || []).length + (sceneData.assets?.images ? 1 : 0)})
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                              <Button
                                                size="small"
                                                variant="text"
                                                sx={{ fontSize: '1.25rem', py: 0.3, px: 1, minHeight: 'auto', textTransform: 'none' }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const ch = scenesData[index];
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
                                                  onMediaManagementSceneDataIndex(index);
                                                  onMediaManagementOpen(true);
                                                }}
                                              >
                                                Add Media
                                              </Button>
                                            </Box>
                                          </Box>

                                          {/* Media Display Content - Flexible Container */}
                                          <Box sx={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: 0,
                                            position: 'relative'
                                          }}>
                                            {/* Preview - Centered */}
                                            <Box sx={{
                                              flex: 1,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              minHeight: 0,
                                              mb: 1
                                            }}>
                                              {(() => {
                                                const previewUrl = sceneData.gammaPreviewImage || '';
                                                const previewClip = sceneData.previewClip || '';

                                                const clipUrl = HelperFunctions.getClipUrl(previewClip);

                                                const handlePreviewClick = (e: any) => {
                                                  e.stopPropagation();
                                                  handleImageClick(index, 0, true);
                                                };

                                                return (
                                                  <Box sx={{
                                                    position: 'relative',
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: 1,
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: '#000'
                                                  }} onClick={handlePreviewClick}>
                                                    {clipUrl ? (
                                                      <video
                                                        src={clipUrl}
                                                        controls
                                                        style={{
                                                          width: '100%',
                                                          height: '100%',
                                                          objectFit: 'contain',
                                                          cursor: 'pointer'
                                                        }}
                                                        onError={(e) => {
                                                          console.log('Video load error for clip:', previewClip, e);
                                                        }}
                                                      />
                                                    ) : previewUrl ? (
                                                      <img
                                                        src={HelperFunctions.normalizeGoogleDriveUrl(previewUrl)}
                                                        alt={`Preview media ${index + 1}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                      />
                                                    ) : (
                                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                        <CircularProgress size={24} />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '1.25rem', mb: 0.5, mr: 1 }}>
                                                          Generating Preview...
                                                        </Typography>
                                                      </Box>
                                                    )}
                                                  </Box>
                                                );
                                              })()}
                                            </Box>

                                            {/* Horizontal selected images and videos - Fixed at bottom */}
                                            <Box sx={{
                                              flexShrink: 0,
                                              mt: 'auto'
                                            }}>
                                              {(() => {
                                                const allImages = (sceneData.assets && Array.isArray(sceneData.assets.images)) ? sceneData.assets.images : [];
                                                const allClips = (sceneData.assets && Array.isArray(sceneData.assets.clips)) ? sceneData.assets.clips : [];
                                                
                                                // Extract videos from keywordsSelected
                                                const videosFromKeywords: string[] = [];
                                                if (Array.isArray(sceneData.keywordsSelected)) {
                                                  const arr = sceneData.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[];
                                                  arr.forEach(entry => {
                                                    if (entry.media?.lowResMedia && HelperFunctions.isVideoUrl(entry.media.lowResMedia)) {
                                                      videosFromKeywords.push(entry.media.lowResMedia);
                                                    }
                                                    if (entry.media?.highResMedia && HelperFunctions.isVideoUrl(entry.media.highResMedia)) {
                                                      videosFromKeywords.push(entry.media.highResMedia);
                                                    }
                                                  });
                                                } else if (sceneData.keywordsSelected && typeof sceneData.keywordsSelected === 'object') {
                                                  const map = sceneData.keywordsSelected as Record<string, string[]>;
                                                  Object.values(map).forEach(list => {
                                                    list.forEach(url => {
                                                      if (HelperFunctions.isVideoUrl(url)) {
                                                        videosFromKeywords.push(url);
                                                      }
                                                    });
                                                  });
                                                }
                                                
                                                // Get unique video URLs from clips
                                                const clipVideoUrls = allClips.map(clip => clip.url);
                                                
                                                // Combine all videos (from clips and keywords) and remove duplicates
                                                const allVideos = [...new Set([...clipVideoUrls, ...videosFromKeywords])];
                                                
                                                return (
                                                  <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5 }}>
                                                    {/* Images */}
                                                    {allImages.map((imageUrl, imgIndex) => (
                                                      <Box
                                                        key={`selected-img-${imgIndex}`}
                                                        sx={{ position: 'relative', flex: '0 0 auto', width: '96px', height: '72px', borderRadius: 0.5, overflow: 'hidden', border: `2px solid ${PRIMARY.main}`, cursor: 'pointer' }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleImageClick(index, imgIndex, false);
                                                        }}
                                                      >
                                                        <img src={imageUrl} alt={`Selected Image ${imgIndex + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <IconButton
                                                          size="small"
                                                          sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper', width: 14, height: 14, minWidth: 14, '&:hover': { bgcolor: 'background.paper' } }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const targetUrl = imageUrl;
                                                            const updatedSceneData: SceneData[] = scenesData.map((ch, chIndex) => {
                                                              if (chIndex === index) {
                                                                const currentImages = ch.assets && Array.isArray(ch.assets.images) ? ch.assets.images : [];
                                                                const updatedImages = currentImages.filter((url) => url !== targetUrl);
                                                                const currentClips = ch.assets?.clips || [];
                                                                const updatedClips = currentClips.filter((c) => c.url !== targetUrl);
                                                                let nextKeywordsSelected: any = ch.keywordsSelected;
                                                                if (Array.isArray(ch.keywordsSelected)) {
                                                                  const arr = ch.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[];
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
                                                                    clips: updatedClips.length > 0 ? updatedClips : null,
                                                                  },
                                                                  ...(nextKeywordsSelected !== undefined ? { keywordsSelected: nextKeywordsSelected } : {})
                                                                };
                                                              }
                                                              return ch;
                                                            });
                                                            onSceneDataUpdate(updatedSceneData);
                                                            GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updatedSceneData[index], 'Media deleted');
                                                          }}
                                                        >
                                                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                          </svg>
                                                        </IconButton>
                                                      </Box>
                                                    ))}

                                                    {/* Videos from clips and keywords */}
                                                    {allVideos.map((videoUrl, vidIndex) => {
                                                      const clip = allClips.find(c => c.url === videoUrl);
                                                      const thumbnail = clip?.thumbnail || videoUrl;
                                                      return (
                                                        <Box
                                                          key={`selected-vid-${vidIndex}`}
                                                          sx={{ position: 'relative', flex: '0 0 auto', width: '96px', height: '72px', borderRadius: 0.5, overflow: 'hidden', border: `2px solid ${PRIMARY.main}`, cursor: 'pointer' }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Handle video click - similar to image click
                                                            handleImageClick(index, allImages.length + vidIndex, false);
                                                          }}
                                                        >
                                                          <Box sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)' }}>
                                                            {HelperFunctions.isVideoUrl(thumbnail) ? (
                                                              <video
                                                                src={thumbnail}
                                                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                                muted
                                                                playsInline
                                                              />
                                                            ) : (
                                                              <img src={thumbnail} alt={`Video thumbnail ${vidIndex + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            )}
                                                            <PlayIcon sx={{ position: 'relative', zIndex: 1, color: 'white', fontSize: '24px' }} />
                                                          </Box>
                                                          <IconButton
                                                            size="small"
                                                            sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper', width: 14, height: 14, minWidth: 14, zIndex: 2, '&:hover': { bgcolor: 'background.paper' } }}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              const targetUrl = videoUrl;
                                                              const updatedSceneData: SceneData[] = scenesData.map((ch, chIndex) => {
                                                                if (chIndex === index) {
                                                                  const currentImages = ch.assets && Array.isArray(ch.assets.images) ? ch.assets.images : [];
                                                                  const updatedImages = currentImages.filter((url) => url !== targetUrl);
                                                                  const currentClips = ch.assets?.clips || [];
                                                                  const updatedClips = currentClips.filter((c) => c.url !== targetUrl);
                                                                  let nextKeywordsSelected: any = ch.keywordsSelected;
                                                                  if (Array.isArray(ch.keywordsSelected)) {
                                                                    const arr = ch.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[];
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
                                                                      clips: updatedClips.length > 0 ? updatedClips : null,
                                                                    },
                                                                    ...(nextKeywordsSelected !== undefined ? { keywordsSelected: nextKeywordsSelected } : {})
                                                                  };
                                                                }
                                                                return ch;
                                                              });
                                                              onSceneDataUpdate(updatedSceneData);
                                                              GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updatedSceneData[index], 'Media deleted');
                                                            }}
                                                          >
                                                            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                              <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                          </IconButton>
                                                        </Box>
                                                      );
                                                    })}

                                                    {(SceneDataImagesMap[index] || []).map((imageUrl, imgIndex) => (
                                                      <Box
                                                        key={`extra-${imgIndex}`}
                                                        sx={{ position: 'relative', flex: '0 0 auto', width: '96px', height: '72px', borderRadius: 0.5, overflow: 'hidden', border: `1px solid ${BORDER.light}`, cursor: 'pointer' }}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const imageIndex = sceneData.assets?.images?.[imgIndex] ? imgIndex + 1 : imgIndex;
                                                          handleImageClick(index, imageIndex, false);
                                                        }}
                                                      >
                                                        <img src={imageUrl} alt={`scene ${index + 1} Media ${imgIndex + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <IconButton
                                                          size="small"
                                                          sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper', width: 14, height: 14, minWidth: 14, '&:hover': { bgcolor: 'background.paper' } }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const currentImages = SceneDataImagesMap[index] || [];
                                                            const updatedImages = currentImages.filter((_, i) => i !== imgIndex);
                                                            onSceneDataImagesMapChange({
                                                              ...SceneDataImagesMap,
                                                              [index]: updatedImages
                                                            });

                                                            const imageUrlToRemove = imageUrl;
                                                            const updatedSceneData: SceneData[] = scenesData.map((ch, chIndex) => {
                                                              if (chIndex !== index) return ch;
                                                              const imagesList = Array.isArray(ch.assets?.images) ? (ch.assets!.images as string[]) : [];
                                                              const newImagesList = imagesList.filter(u => u !== imageUrlToRemove);
                                                              const newClips = (ch.assets?.clips || []).filter(c => c.url !== imageUrlToRemove) || null;

                                                              let nextKeywordsSelected: any = ch.keywordsSelected;
                                                              if (Array.isArray(ch.keywordsSelected)) {
                                                                const arr = ch.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[];
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
                                                                  clips: newClips,
                                                                },
                                                                ...(nextKeywordsSelected !== undefined ? { keywordsSelected: nextKeywordsSelected } : {})
                                                              };
                                                            });
                                                            onSceneDataUpdate(updatedSceneData);
                                                            GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updatedSceneData[index], 'Media deleted');
                                                          }}
                                                        >
                                                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke={ERROR.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                          </svg>
                                                        </IconButton>
                                                      </Box>
                                                    ))}

                                                  </Box>
                                                );
                                              })()}
                                            </Box>
                                          </Box>
                                        </Grid>
                                      )}
                                    </Grid>
                                  )}
                                </Box>

                                {/* SceneData Actions */}
                                {/* <Box sx={{ display: expandedSceneDataIndex === index ? 'none' : 'flex', flexDirection: 'column', gap: 1, ml: 2, alignSelf: 'center' }}>
                                  {editingSceneData === index ? (
                                    <>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const cleaned = scenesData.map((ch, i) => (
                                            i === index
                                              ? { ...(ch as any), assets: { ...(ch as any).assets, video: undefined } as any } as any
                                              : ch
                                          ));
                                          onSceneDataUpdate(cleaned);
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
                                        className="SceneData-actions"
                                        size="small"
                                        onClick={async () => {
                                          try {
                                            onPickerOpen(true);
                                            onPickerSceneDataIndex(index);
                                            onPickerLoading(true);
                                            const SceneData = scenesData[index];
                                            const res = await fetch(API_ENDPOINTS.GET_NARRATION_VARIATIONS, {
                                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                narration: sceneData.narration,
                                                noOfNarrations: 5
                                              })
                                            });
                                            const data = await res.json();
                                            const vars: string[] = Array.isArray(data?.variations) ? data.variations : [];
                                            onPickerNarrations(vars);
                                          } catch (e) {
                                            console.log('picker fetch failed', e);
                                            onPickerNarrations([scenesData[index].narration]);
                                          } finally {
                                            onPickerLoading(false);
                                          }
                                        }}
                                        sx={{
                                          opacity: selectedSceneDataIndex === index ? 1 : 0,
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
                                        className="SceneData-actions"
                                        size="small"
                                        onClick={() => {
                                          onSelectSceneData(index);
                                          setExpandedSceneDataIndex(expandedSceneDataIndex === index ? null : index);
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
                                        title="Edit SceneData"
                                      >
                                        <CreateIcon fontSize="small" />
                                      </IconButton>
                                     
                                      <IconButton
                                        className="SceneData-actions"
                                        size="small"
                                        onClick={() => onDeleteSceneData(index)}
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
                                        title="Delete SceneData"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>

                                      <IconButton
                                        className="SceneData-actions"
                                        size="small"
                                        onClick={() => onAddSceneDataAfter(index)}
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
      <MediaManagementDialog
        open={mediaManagementOpen}
        onClose={() => onMediaManagementOpen(false)}
        mediaManagementSceneDataIndex={mediaManagementSceneDataIndex}
        selectedSceneDataIndex={selectedSceneDataIndex}
        scenesData={scenesData}
        SceneDataImagesMap={SceneDataImagesMap}
        scriptTitle={scriptTitle}
        trendingTopic={trendingTopic}
        location={location}
        jobId={jobId}
        onSceneDataImagesMapChange={onSceneDataImagesMapChange}
        onSceneDataUpdate={onSceneDataUpdate}
        onMediaManagementOpen={onMediaManagementOpen}
        onMediaManagementSceneDataIndex={onMediaManagementSceneDataIndex}
        onClearSelection={onClearSelection}
        onGoogleImagePreview={onGoogleImagePreview}
      />

      {/* Image View Modal */}
      <ImageViewModal
        open={imageViewer.isOpen}
        onClose={imageViewer.closeViewer}
        images={imageViewer.images}
        currentIndex={imageViewer.currentIndex}
        onIndexChange={imageViewer.setCurrentIndex}
        viewMode={imageViewer.viewMode}
        onViewModeChange={imageViewer.setViewMode}
        title={`Preview Image`}
        showNavigation={true}
        showDownload={true}
        showViewModeSelector={true}
      />

      {/* SceneData Edit Dialog */}
      <SceneDataEditDialog
        open={SceneDataEditDialogOpen}
        sceneData={scenesData[selectedSceneDataIndex] || null}
        sceneDataIndex={selectedSceneDataIndex}
        language={language}
        onClose={() => onSceneDataEditDialogOpen(false)}
        onSave={(sceneDataIndex, sceneData: SceneData) => {
          const updatedSceneData: SceneData[] = scenesData.map((ch: SceneData, idx: number) =>
            idx === sceneDataIndex ? sceneData : ch
          );
          onSceneDataUpdate(updatedSceneData as SceneData[]);
          onSceneDataEditDialogOpen(false);
        }}
      />
    </Paper>
  );
};

export default SceneDataSection;
