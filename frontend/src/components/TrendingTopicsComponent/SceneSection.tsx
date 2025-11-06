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
import { SceneData, SceneKeywordSelection } from '../../types/sceneData';
import { HelperFunctions, SecureStorageHelpers } from '../../utils/helperFunctions';
import { ImageViewModal } from '../ui/ImageViewer/ImageViewModal';
import { MediaPlayer } from '../videoEffects/MediaPlayer';
import { useImageViewer, formatSceneDataImages } from '../../hooks/useImageViewer';
import { PRIMARY, SUCCESS, WARNING, ERROR, INFO, PURPLE, NEUTRAL, TEXT, BORDER, HOVER, SPECIAL } from '../../styles/colors';
import ImageSearch from './ImageSearch';
import { SceneDataEditDialog } from './SceneDataEditDialog';
import TextWithHighlights from '../scriptProductionComponents/TextWithHighlights';
import CustomAudioPlayer from '../scriptProductionComponents/CustomAudioPlayer';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';

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
  projectSettings?: {
    transition?: string;
    musicId?: string;
    logo?: { name?: string; url: string; position?: string } | null;
    clip?: { name?: string; url: string } | null;
    transitionEffects?: string[];
  };
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
  generatingSceneData,
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
  driveBackgrounds,
  driveMusic,
  driveTransitions,
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

    const images = formatSceneDataImages(
      SceneDataImages,
      isPreview ? sceneData.previewImage || '' : sceneData.assets?.images?.[0] || '',
    );

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
                  {scenesData.map((sceneData, index) => (
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
                                    data-scenedata-index={index}
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
                                        {sceneData.duration || '0s'}
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '100%' }}>
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
                                                fontFamily: HelperFunctions.getFontFamilyForLanguage(language),
                                                lineHeight: HelperFunctions.isRTLLanguage(language) ? 2.5 : 1.8,
                                                fontSize: '1.2rem',
                                                textAlign: HelperFunctions.isRTLLanguage(language || 'english') ? 'right' : 'left',
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
                                        <>
                                          {/* Content Area - narration and media */}
                                          <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '100%', minHeight: '120px', bgcolor: 'background.paper', justifyContent: 'center', alignItems: 'center' }}>
                                            {/* Narration Content */}
                                            <Box sx={{
                                              flex: expandedSceneDataIndex === index ? '1 1 100%' : '0 0 70%',
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
                                                    {sceneData.highlightedKeywords.map((keyword, keywordIndex) => (
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
                                                          onMediaManagementSceneDataIndex(index);
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
                                                              const imagesGoogle = Array.isArray(ch.assets?.imagesGoogle) ? ch.assets!.imagesGoogle! : [];
                                                              const imagesEnvato = Array.isArray(ch.assets?.imagesEnvato) ? ch.assets!.imagesEnvato! : [];
                                                              const filteredImages = images.filter(u => !urlsToRemove.includes(u));
                                                              const filteredGoogle = imagesGoogle.filter(u => !urlsToRemove.includes(u));
                                                              const filteredEnvato = imagesEnvato.filter(u => !urlsToRemove.includes(u));
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
                                                                  imagesGoogle: filteredGoogle.length > 0 ? filteredGoogle : null,
                                                                  imagesEnvato: filteredEnvato.length > 0 ? filteredEnvato : null,
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
                                                    ))}
                                                  </Box>
                                                  {/* Media Selected (prefer scene-level videoEffects, fallback to project-level) */}
                                                  {projectSettings && (() => {
                                                    const ve: any = (scenesData[index] as any)?.videoEffects || {};
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
                                              {selectedText && selectedText.SceneDataIndex === index && (() => {
                                                const SceneData = scenesData[index];
                                                const currentKeywords = sceneData.highlightedKeywords || [];
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
                                            {expandedSceneDataIndex !== index && (
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
                                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '1.25rem' }}>
                                                    📎 Media ({(SceneDataImagesMap[index] || []).length + (sceneData.assets?.images ? 1 : 0)})
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    <Button
                                                      size="small"
                                                      variant="outlined"
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

                                                {/* Media Display */}
                                                <>
                                                  {(() => {
                                                    const previewUrl = sceneData.previewImage || '';
                                                    // console.log('Preview URL:', previewUrl);
                                                    const handlePreviewClick = (e: any) => {
                                                      e.stopPropagation();
                                                      handleImageClick(index, 0, true);
                                                    };
                                                    return (
                                                      <Box sx={{ mb: 1 }}>
                                                        <Box sx={{ position: 'relative', width: '100%', borderRadius: 1, overflow: 'hidden', border: `1px solid ${BORDER.light}` }} onClick={handlePreviewClick}>
                                                          <Box sx={{ position: 'relative', width: '100%', pt: '75%' }}>
                                                            {previewUrl ? (
                                                              <img
                                                                src={previewUrl}
                                                                alt={`Preview media ${index + 1}`}
                                                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                              />
                                                            ) : (
                                                              <>
                                                                <CircularProgress size={24} />
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '1.25rem', mb: 0.5 }}>
                                                                  Generating Preview...
                                                                </Typography>
                                                              </>
                                                            )}
                                                          </Box>
                                                        </Box>
                                                      </Box>
                                                    );
                                                  })()}

                                                  {/* Horizontal selected images */}
                                                  {(() => {
                                                    const allImages = (sceneData.assets && Array.isArray(sceneData.assets.images)) ? sceneData.assets.images : [];
                                                    const googleSet = new Set(sceneData.assets?.imagesGoogle || []);
                                                    const envatoSet = new Set(sceneData.assets?.imagesEnvato || []);
                                                    const hasAIAtFirst = allImages.length > 0 && !googleSet.has(allImages[0]) && !envatoSet.has(allImages[0]);
                                                    const list = hasAIAtFirst ? allImages.slice(1) : allImages;
                                                    return (
                                                      <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5 }}>
                                                        {list.map((imageUrl, imgIndex) => (
                                                          <Box
                                                            key={`selected-${imgIndex}`}
                                                            sx={{ position: 'relative', flex: '0 0 auto', width: '96px', height: '72px', borderRadius: 0.5, overflow: 'hidden', border: `2px solid ${PRIMARY.main}`, cursor: 'pointer' }}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              const imageIndex = (hasAIAtFirst ? 1 : 0) + imgIndex;
                                                              handleImageClick(index, imageIndex, false);
                                                            }}
                                                          >
                                                            <img src={imageUrl} alt={`Selected Image ${imgIndex + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <IconButton
                                                              size="small"
                                                              sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper', width: 14, height: 14, minWidth: 14, '&:hover': { bgcolor: 'background.paper' } }}
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updatedSceneData: SceneData[] = scenesData.map((ch, chIndex) => {
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
                                                                        imagesGoogle: updatedGoogle.length > 0 ? updatedGoogle : null,
                                                                        imagesEnvato: updatedEnvato.length > 0 ? updatedEnvato : null
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
                                                                  const newImagesGoogle = (ch.assets?.imagesGoogle || []).filter(u => u !== imageUrlToRemove) || null;
                                                                  const newImagesEnvato = (ch.assets?.imagesEnvato || []).filter(u => u !== imageUrlToRemove) || null;

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
                                                                      imagesGoogle: newImagesGoogle,
                                                                      imagesEnvato: newImagesEnvato
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
                                                </>
                                              </Box>
                                            )}
                                          </Box>
                                        </>
                                      )}
                                    </Box>
                                  </Box>
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
                                            const res = await fetch('/api/get-narration-variations', {
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
                                            console.error('picker fetch failed', e);
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
            Manage Media - SceneData {(mediaManagementSceneDataIndex || 0) + 1}
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
                SceneDataNarration={scenesData[mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex]?.narration || ''}
                scriptTitle={scriptTitle}
                trendingTopic={trendingTopic}
                location={location}
                keywords={(scenesData[mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex]?.highlightedKeywords || []).filter(k => typeof k === 'string' && k.trim())}
                onClearSelection={() => onClearSelection()}
                onImageSelect={(imageUrl) => {
                  const currentIdx = mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex;
                  onSceneDataImagesMapChange({
                    ...SceneDataImagesMap,
                    [currentIdx]: [...(SceneDataImagesMap[currentIdx] || []), imageUrl]
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
                SceneDataIndex={mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex}
                onSceneDataUpdate={async (SceneDataIndex, updatedSceneData: any) => {
                  // Update the SceneData with new assets
                  const modifiedScenesData: SceneData[] = scenesData.map((sceneData, index) => {
                    if (index === SceneDataIndex) {
                      // Transform any legacy merge payload (map) into array entries
                      let nextKeywordsSelected: SceneKeywordSelection[] = Array.isArray(sceneData.keywordsSelected) ? (sceneData.keywordsSelected as SceneKeywordSelection[]) : [];
                      if (updatedSceneData?.keywordsSelectedMerge && typeof updatedSceneData.keywordsSelectedMerge === 'object') {
                        const mergeMap = updatedSceneData?.keywordsSelectedMerge as Record<string, string[]>;
                        const entries = Object.entries(mergeMap);
                        if (entries.length > 0) {
                          const [kw, urls] = entries[0];
                          const low = urls?.[0] || undefined;
                          const high = urls?.[1] || urls?.[0] || undefined;
                          const idx = nextKeywordsSelected.findIndex(e => e && e.suggestedKeyword === kw);
                          const newEntry: import('@/types/sceneData').SceneKeywordSelection = {
                            suggestedKeyword: kw,
                            ...(updatedSceneData.modifiedKeywordForMapping && typeof updatedSceneData.modifiedKeywordForMapping === 'string' ? { modifiedKeyword: updatedSceneData.modifiedKeywordForMapping } : {}),
                            media: {
                              ...(low ? { lowResMedia: low } : {}),
                              ...(high ? { highResMedia: high } : {})
                            },
                            // Add transitionsEffects to SceneData and log
                            ...(updatedSceneData.keywordsSelected && Array.isArray(updatedSceneData.keywordsSelected) && updatedSceneData.keywordsSelected.length > 0 && updatedSceneData.keywordsSelected[0].transitionsEffects
                              ? { transitionsEffects: updatedSceneData.keywordsSelected[0].transitionsEffects }
                              : {}),
                          };
                          if (idx >= 0) {
                            const existing = nextKeywordsSelected[idx];
                            nextKeywordsSelected = nextKeywordsSelected.slice();
                            nextKeywordsSelected[idx] = {
                              ...existing,
                              ...(updatedSceneData.modifiedKeywordForMapping && typeof updatedSceneData.modifiedKeywordForMapping === 'string' ? { modifiedKeyword: updatedSceneData.modifiedKeywordForMapping } : {}),
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
                      if (updatedSceneData.keywordsSelected && Array.isArray(updatedSceneData.keywordsSelected) && updatedSceneData.keywordsSelected.length > 0) {
                        const entry = updatedSceneData.keywordsSelected[0] as any;
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
                        ...sceneData,
                        ...(nextKeywordsSelected.length > 0 ? { keywordsSelected: nextKeywordsSelected } : {}),
                        assets: {
                          ...sceneData.assets,
                          ...updatedSceneData.assets
                        }
                      };
                    }
                    return sceneData;
                  });
                  try {
                    // console.log('SceneData modified (onSceneDataUpdate):', JSON.stringify(updatedSceneData[SceneDataIndex]));
                    const sceneId = modifiedScenesData[SceneDataIndex].id || '';
                    const jobId = modifiedScenesData[SceneDataIndex].jobId || '';
                    if (jobId && sceneId) {
                      await GoogleDriveServiceFunctions.persistSceneUpdate(jobId, modifiedScenesData[SceneDataIndex], 'Project settings applied to scene');
                    }
                  } catch { }
                  onSceneDataUpdate(modifiedScenesData);
                }}
                onDone={() => {
                  onMediaManagementOpen(false);
                  onMediaManagementSceneDataIndex(null);
                }}
                existingImageUrls={[
                  ...(
                    scenesData[mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex]?.assets?.imagesGoogle || []
                  ),
                  ...(
                    scenesData[mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex]?.assets?.imagesEnvato || []
                  ),
                  ...(
                    scenesData[mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex]?.assets?.images || []
                  )
                ]}
                suggestionKeywords={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords || []}
                autoSearchOnMount={!!(typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords?.length)}
                currentKeywordForMapping={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword}
                onDoneWithSelected={(selectedUrls, modifiedKeyword) => {
                  const SceneDataIdx = mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex;
                  const kw = typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword;
                  if (kw) {
                    // add selected urls to the images array and keywordsSelected
                    const updated: SceneData[] = scenesData.map((ch, idx) => {
                      if (idx !== SceneDataIdx) return ch;
                      const existingArray: import('@/types/sceneData').SceneKeywordSelection[] = Array.isArray(ch.keywordsSelected) ? (ch.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[]) : [];
                      const low = selectedUrls?.[0] || undefined;
                      const high = selectedUrls?.[1] || selectedUrls?.[0] || undefined;
                      const existingIdx = existingArray.findIndex(e => e && e.suggestedKeyword === kw);
                      let nextArray: import('@/types/sceneData').SceneKeywordSelection[];
                      if (existingIdx >= 0) {
                        nextArray = existingArray.slice();
                        const existing = nextArray[existingIdx] || {} as import('@/types/sceneData').SceneKeywordSelection;
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
                    //   console.log('Media added to SceneData:', JSON.stringify(updated[SceneDataIdx]));
                    // } catch {}
                    onSceneDataUpdate(updated);
                    GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[SceneDataIdx], 'Media added');
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
