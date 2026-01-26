'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  ButtonGroup,
  IconButton,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ScissorsIcon from '@mui/icons-material/ContentCut';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import LoopIcon from '@mui/icons-material/Loop';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LinkIcon from '@mui/icons-material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { EditorProject, Clip, Track } from '@/types/videoEditor';
import { useAudioEditing } from '@/hooks/useAudioEditing';

interface PropertiesPanelProps {
  selectedClipIds: string[];
  project: EditorProject;
  playheadTime: number;
  onProjectUpdate: (project: EditorProject) => void;
  onDeleteClips?: (clipIds: string[]) => void;
  onDuplicateClips?: (clipIds: string[]) => void;
  onSplitClips?: (clipIds: string[], splitTime: number) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedClipIds,
  project,
  playheadTime,
  onProjectUpdate,
  onDeleteClips,
  onDuplicateClips,
  onSplitClips,
}) => {
  const audioEditing = useAudioEditing();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    operations: true,
    video: true,
    audio: true,
    text: true,
  });

  // Find selected clips with their tracks
  const selectedClipsWithTracks: Array<{ clip: Clip; track: Track }> = [];
  project.timeline.forEach((track) => {
    track.clips.forEach((clip) => {
      if (selectedClipIds.includes(clip.id)) {
        selectedClipsWithTracks.push({ clip, track });
      }
    });
  });

  const selectedClips = selectedClipsWithTracks.map(({ clip }) => clip);

  return (
    <Box
      sx={{
        width: 300,
        borderLeft: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <SettingsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Properties
          </Typography>
        </Box>
        {selectedClips.length > 0 && (
          <Chip
            label={`${selectedClips.length} clip${selectedClips.length > 1 ? 's' : ''} selected`}
            size="small"
            sx={{
              mt: 0.5,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              fontWeight: 500,
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedClips.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: 'action.hover',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'divider',
            }}
          >
            <SettingsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
              No clip selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a clip from the timeline to edit its properties
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Clip Operations */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5,
                  cursor: 'pointer',
                }}
                onClick={() =>
                  setExpandedSections((prev) => ({ ...prev, operations: !prev.operations }))
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Clip Operations
                  </Typography>
                </Box>
                {expandedSections.operations ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              <Collapse in={expandedSections.operations}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {onDeleteClips && (
                    <Tooltip title="Permanently delete the selected clip(s)" arrow>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => onDeleteClips(selectedClipIds)}
                        variant="contained"
                        color="error"
                        size="small"
                        fullWidth
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(211, 47, 47, 0.2)',
                        }}
                      >
                        Delete ({selectedClipIds.length})
                      </Button>
                    </Tooltip>
                  )}
                  {onDuplicateClips && (
                    <Tooltip title="Create a copy of the selected clip(s)" arrow>
                      <Button
                        startIcon={<ContentCopyIcon />}
                        onClick={() => onDuplicateClips(selectedClipIds)}
                        variant="contained"
                        color="primary"
                        size="small"
                        fullWidth
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(33, 150, 243, 0.2)',
                        }}
                      >
                        Duplicate ({selectedClipIds.length})
                      </Button>
                    </Tooltip>
                  )}
                  {onSplitClips && selectedClipIds.length === 1 && (
                    <Tooltip
                      title="Split the clip at the current playhead position"
                      arrow
                    >
                      <span>
                        <Button
                          startIcon={<ScissorsIcon />}
                          onClick={() => onSplitClips(selectedClipIds, playheadTime)}
                          variant="outlined"
                          size="small"
                          fullWidth
                          disabled={(() => {
                            const clip = selectedClips[0];
                            if (!clip) return true;
                            return playheadTime <= clip.startTime || playheadTime >= clip.startTime + clip.duration;
                          })()}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          Split at Playhead
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Collapse>
            </Paper>

            {/* Clip Properties */}
            {selectedClipsWithTracks.map(({ clip, track }) => {
              const effectiveVolume = audioEditing.getEffectiveVolume(clip, track);
              const effectiveMuted = audioEditing.getEffectiveMuted(clip, track);
              const clipVolume = clip.properties.volume ?? 1;
              const isAudioClip = clip.mediaType === 'audio' || clip.mediaType === 'video';
              const isVideoClip = clip.mediaType === 'video';
              const hasAudio = isAudioClip;

              return (
                <Box key={clip.id} sx={{ mb: 2 }}>
                  {/* Basic Info Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Clip Information
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Duration:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {clip.duration.toFixed(2)}s
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Start Time:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {clip.startTime.toFixed(2)}s
                        </Typography>
                      </Box>
                      {(clip.trimIn > 0 || clip.trimOut > 0) && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            Trim:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            In {clip.trimIn.toFixed(2)}s, Out {clip.trimOut.toFixed(2)}s
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Text Properties - Only show for text clips */}
                  {clip.mediaType === 'text' && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5,
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setExpandedSections((prev) => ({ ...prev, text: !prev.text }))
                        }
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextFieldsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            Text Properties
                          </Typography>
                        </Box>
                        {expandedSections.text ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                      <Collapse in={expandedSections.text}>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Text Content */}
                          <Box>
                            <Tooltip
                              title="Enter the text content to display on the video"
                              arrow
                              placement="top"
                            >
                              <TextField
                                fullWidth
                                label="Text Content"
                                value={clip.properties.text || ''}
                                onChange={(e) => {
                                  const updated = {
                                    ...project,
                                    timeline: project.timeline.map((t) => ({
                                      ...t,
                                      clips: t.clips.map((c) =>
                                        c.id === clip.id
                                          ? {
                                              ...c,
                                              properties: {
                                                ...c.properties,
                                                text: e.target.value,
                                              },
                                            }
                                          : c
                                      ),
                                    })),
                                  };
                                  onProjectUpdate(updated);
                                }}
                                size="small"
                                multiline
                                rows={2}
                                helperText="The text that will appear on your video"
                              />
                            </Tooltip>
                          </Box>

                          {/* Font Size */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Font Size
                                <Tooltip title="Adjust the size of the text" arrow>
                                  <InfoIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                                </Tooltip>
                              </Typography>
                              <Chip
                                label={`${clip.properties.fontSize || 48}px`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                              />
                            </Box>
                            <Slider
                              value={clip.properties.fontSize || 48}
                              min={12}
                              max={120}
                              step={1}
                              onChange={(_, value) => {
                                const updated = {
                                  ...project,
                                  timeline: project.timeline.map((t) => ({
                                    ...t,
                                    clips: t.clips.map((c) =>
                                      c.id === clip.id
                                        ? {
                                            ...c,
                                            properties: {
                                              ...c.properties,
                                              fontSize: value as number,
                                            },
                                          }
                                        : c
                                    ),
                                  })),
                                };
                                onProjectUpdate(updated);
                              }}
                              sx={{ width: '100%' }}
                            />
                          </Box>

                          {/* Font Color */}
                          <Box>
                            <Tooltip title="Choose the text color" arrow placement="top">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                                  Text Color:
                                </Typography>
                                <input
                                  type="color"
                                  value={clip.properties.fontColor || '#FFFFFF'}
                                  onChange={(e) => {
                                    const updated = {
                                      ...project,
                                      timeline: project.timeline.map((t) => ({
                                        ...t,
                                        clips: t.clips.map((c) =>
                                          c.id === clip.id
                                            ? {
                                                ...c,
                                                properties: {
                                                  ...c.properties,
                                                  fontColor: e.target.value,
                                                },
                                              }
                                            : c
                                        ),
                                      })),
                                    };
                                    onProjectUpdate(updated);
                                  }}
                                  style={{
                                    width: '100%',
                                    height: 40,
                                    border: '1px solid',
                                    borderColor: 'rgba(0, 0, 0, 0.23)',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          </Box>

                          {/* Alignment */}
                          <Tooltip title="Set the horizontal alignment of the text" arrow placement="top">
                            <FormControl fullWidth size="small">
                              <InputLabel>Text Alignment</InputLabel>
                              <Select
                                value={clip.properties.alignment || 'center'}
                                label="Text Alignment"
                                onChange={(e) => {
                                  const updated = {
                                    ...project,
                                    timeline: project.timeline.map((t) => ({
                                      ...t,
                                      clips: t.clips.map((c) =>
                                        c.id === clip.id
                                          ? {
                                              ...c,
                                              properties: {
                                                ...c.properties,
                                                alignment: e.target.value,
                                              },
                                            }
                                          : c
                                      ),
                                    })),
                                  };
                                  onProjectUpdate(updated);
                                }}
                              >
                                <MenuItem value="left">Left</MenuItem>
                                <MenuItem value="center">Center</MenuItem>
                                <MenuItem value="right">Right</MenuItem>
                              </Select>
                            </FormControl>
                          </Tooltip>

                          {/* Animation */}
                          <Tooltip title="Choose an animation effect for the text" arrow placement="top">
                            <FormControl fullWidth size="small">
                              <InputLabel>Animation Effect</InputLabel>
                              <Select
                                value={clip.properties.animation || 'none'}
                                label="Animation Effect"
                                onChange={(e) => {
                                  const updated = {
                                    ...project,
                                    timeline: project.timeline.map((t) => ({
                                      ...t,
                                      clips: t.clips.map((c) =>
                                        c.id === clip.id
                                          ? {
                                              ...c,
                                              properties: {
                                                ...c.properties,
                                                animation: e.target.value as 'none' | 'fadeIn' | 'fadeOut',
                                              },
                                            }
                                          : c
                                      ),
                                    })),
                                  };
                                  onProjectUpdate(updated);
                                }}
                              >
                                <MenuItem value="none">None</MenuItem>
                                <MenuItem value="fadeIn">Fade In</MenuItem>
                                <MenuItem value="fadeOut">Fade Out</MenuItem>
                              </Select>
                            </FormControl>
                          </Tooltip>

                          {/* Position (X, Y) */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Position
                                <Tooltip title="Set the text position on the video (0-100%)" arrow>
                                  <InfoIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                                </Tooltip>
                              </Typography>
                              <Chip
                                label={`${clip.position?.x || 50}%, ${clip.position?.y || 50}%`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                label="X (%)"
                                type="number"
                                size="small"
                                value={clip.position?.x || 50}
                                onChange={(e) => {
                                  const x = Math.max(0, Math.min(100, parseFloat(e.target.value) || 50));
                                  const updated = {
                                    ...project,
                                    timeline: project.timeline.map((t) => ({
                                      ...t,
                                      clips: t.clips.map((c) =>
                                        c.id === clip.id
                                          ? {
                                              ...c,
                                              position: { x, y: c.position?.y || 50 },
                                            }
                                          : c
                                      ),
                                    })),
                                  };
                                  onProjectUpdate(updated);
                                }}
                                inputProps={{ min: 0, max: 100, step: 1 }}
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                label="Y (%)"
                                type="number"
                                size="small"
                                value={clip.position?.y || 50}
                                onChange={(e) => {
                                  const y = Math.max(0, Math.min(100, parseFloat(e.target.value) || 50));
                                  const updated = {
                                    ...project,
                                    timeline: project.timeline.map((t) => ({
                                      ...t,
                                      clips: t.clips.map((c) =>
                                        c.id === clip.id
                                          ? {
                                              ...c,
                                              position: { x: c.position?.x || 50, y },
                                            }
                                          : c
                                      ),
                                    })),
                                  };
                                  onProjectUpdate(updated);
                                }}
                                inputProps={{ min: 0, max: 100, step: 1 }}
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </Box>

                          {/* Opacity */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Opacity
                                <Tooltip title="Adjust text transparency (0-100%)" arrow>
                                  <InfoIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                                </Tooltip>
                              </Typography>
                              <Chip
                                label={`${Math.round((clip.properties.opacity || 1) * 100)}%`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                              />
                            </Box>
                            <Slider
                              value={clip.properties.opacity || 1}
                              min={0}
                              max={1}
                              step={0.01}
                              onChange={(_, value) => {
                                const updated = {
                                  ...project,
                                  timeline: project.timeline.map((t) => ({
                                    ...t,
                                    clips: t.clips.map((c) =>
                                      c.id === clip.id
                                        ? {
                                            ...c,
                                            properties: {
                                              ...c.properties,
                                              opacity: value as number,
                                            },
                                          }
                                        : c
                                    ),
                                  })),
                                };
                                onProjectUpdate(updated);
                              }}
                              sx={{ width: '100%' }}
                            />
                          </Box>
                        </Box>
                      </Collapse>
                    </Paper>
                  )}

                  {/* Audio Controls - Only show for audio/video clips */}
                  {hasAudio && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5,
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setExpandedSections((prev) => ({ ...prev, audio: !prev.audio }))
                        }
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GraphicEqIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            Audio Controls
                          </Typography>
                        </Box>
                        {expandedSections.audio ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                      <Collapse in={expandedSections.audio}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                          {/* Volume Control */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Volume
                                <Tooltip title="Adjust the audio volume level (0-100%)" arrow>
                                  <InfoIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                                </Tooltip>
                              </Typography>
                              <Chip
                                label={`${Math.round(clipVolume * 100)}%`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  bgcolor: effectiveMuted ? 'error.light' : 'primary.light',
                                  color: effectiveMuted ? 'error.contrastText' : 'primary.contrastText',
                                }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Tooltip title={effectiveMuted ? 'Unmute' : 'Mute'} arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const newMuted = !clip.properties.muted;
                                    const updated = audioEditing.setClipMuted(project, clip.id, newMuted);
                                    onProjectUpdate(updated);
                                  }}
                                  color={effectiveMuted ? 'error' : 'default'}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {effectiveMuted ? <VolumeOffIcon /> : clipVolume > 0.5 ? <VolumeUpIcon /> : <VolumeDownIcon />}
                                </IconButton>
                              </Tooltip>
                              <Slider
                                value={clipVolume}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(_, value) => {
                                  const updated = audioEditing.setClipVolume(project, clip.id, value as number);
                                  onProjectUpdate(updated);
                                }}
                                disabled={effectiveMuted}
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </Box>

                          {/* Mute Toggle */}
                          <Tooltip title="Toggle to mute or unmute this clip's audio" arrow>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={clip.properties.muted ?? false}
                                  onChange={(e) => {
                                    const updated = audioEditing.setClipMuted(project, clip.id, e.target.checked);
                                    onProjectUpdate(updated);
                                  }}
                                  size="small"
                                />
                              }
                              label="Mute Clip"
                            />
                          </Tooltip>

                          {/* Fade In/Out Controls */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              Fade Effects
                              <Tooltip
                                title="Gradually increase (fade in) or decrease (fade out) audio volume at the start or end of the clip"
                                arrow
                              >
                                <InfoIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                              </Tooltip>
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                label="Fade In (s)"
                                type="number"
                                size="small"
                                value={clip.properties.fadeIn ?? 0}
                                onChange={(e) => {
                                  const fadeIn = parseFloat(e.target.value) || 0;
                                  const updated = audioEditing.setClipFadeIn(project, clip.id, fadeIn);
                                  onProjectUpdate(updated);
                                }}
                                inputProps={{ min: 0, max: clip.duration, step: 0.1 }}
                                sx={{ flex: 1 }}
                                helperText="Start"
                              />
                              <TextField
                                label="Fade Out (s)"
                                type="number"
                                size="small"
                                value={clip.properties.fadeOut ?? 0}
                                onChange={(e) => {
                                  const fadeOut = parseFloat(e.target.value) || 0;
                                  const updated = audioEditing.setClipFadeOut(project, clip.id, fadeOut);
                                  onProjectUpdate(updated);
                                }}
                                inputProps={{ min: 0, max: clip.duration, step: 0.1 }}
                                sx={{ flex: 1 }}
                                helperText="End"
                              />
                            </Box>
                          </Box>

                          {/* Loop Control - Only for audio clips */}
                          {clip.mediaType === 'audio' && (
                            <Tooltip title="Loop the audio clip to repeat continuously" arrow>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={clip.properties.loop ?? false}
                                    onChange={(e) => {
                                      const updated = audioEditing.setClipLoop(project, clip.id, e.target.checked);
                                      onProjectUpdate(updated);
                                    }}
                                    size="small"
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LoopIcon fontSize="small" />
                                    <span>Loop Audio</span>
                                  </Box>
                                }
                              />
                            </Tooltip>
                          )}

                          {/* Detach/Attach Audio - Only for video clips */}
                          {isVideoClip && (
                            <Tooltip
                              title={
                                clip.properties.audioDetached
                                  ? 'Attach audio back to video track'
                                  : 'Detach audio to edit separately'
                              }
                              arrow
                            >
                              <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                startIcon={clip.properties.audioDetached ? <LinkIcon /> : <LinkOffIcon />}
                                onClick={() => {
                                  let updated: EditorProject;
                                  if (clip.properties.audioDetached) {
                                    updated = audioEditing.attachAudioToVideo(project, clip.id);
                                  } else {
                                    updated = audioEditing.detachAudioFromVideo(project, clip.id);
                                  }
                                  onProjectUpdate(updated);
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                }}
                              >
                                {clip.properties.audioDetached ? 'Attach Audio' : 'Detach Audio'}
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </Collapse>
                    </Paper>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </Box>
    </Box>
  );
};

export default PropertiesPanel;
