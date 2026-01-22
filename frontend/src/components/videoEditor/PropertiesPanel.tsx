'use client';

import React from 'react';
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
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Properties
        </Typography>
        {selectedClips.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {selectedClips.length} clip{selectedClips.length > 1 ? 's' : ''} selected
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {selectedClips.length === 0 ? (
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Select a clip to edit properties
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Clip Operations */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Clip Operations
              </Typography>
              <ButtonGroup orientation="vertical" fullWidth size="small">
                {onDeleteClips && (
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={() => onDeleteClips(selectedClipIds)}
                    color="error"
                    variant="outlined"
                  >
                    Delete ({selectedClipIds.length})
                  </Button>
                )}
                {onDuplicateClips && (
                  <Button
                    startIcon={<ContentCopyIcon />}
                    onClick={() => onDuplicateClips(selectedClipIds)}
                    variant="outlined"
                  >
                    Duplicate ({selectedClipIds.length})
                  </Button>
                )}
                {onSplitClips && selectedClipIds.length === 1 && (
                  <Button
                    startIcon={<ScissorsIcon />}
                    onClick={() => onSplitClips(selectedClipIds, playheadTime)}
                    variant="outlined"
                    disabled={(() => {
                      const clip = selectedClips[0];
                      if (!clip) return true;
                      return playheadTime <= clip.startTime || playheadTime >= clip.startTime + clip.duration;
                    })()}
                  >
                    Split at Playhead
                  </Button>
                )}
              </ButtonGroup>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Clip Properties */}
            {selectedClipsWithTracks.map(({ clip, track }) => {
              const effectiveVolume = audioEditing.getEffectiveVolume(clip, track);
              const effectiveMuted = audioEditing.getEffectiveMuted(clip, track);
              const clipVolume = clip.properties.volume ?? 1;
              const isAudioClip = clip.mediaType === 'audio' || clip.mediaType === 'video';
              const isVideoClip = clip.mediaType === 'video';
              const hasAudio = isAudioClip;

              return (
                <Paper key={clip.id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    {clip.mediaType.charAt(0).toUpperCase() + clip.mediaType.slice(1)} Clip
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  
                  {/* Basic Info */}
                  <Typography variant="body2" color="text.secondary">
                    Duration: {clip.duration.toFixed(2)}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start: {clip.startTime.toFixed(2)}s
                  </Typography>
                  {clip.trimIn > 0 || clip.trimOut > 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Trim: In {clip.trimIn.toFixed(2)}s, Out {clip.trimOut.toFixed(2)}s
                    </Typography>
                  ) : null}

                  {/* Text Properties - Only show for text clips */}
                  {clip.mediaType === 'text' && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Text Properties
                      </Typography>

                      {/* Text Content */}
                      <TextField
                        fullWidth
                        label="Text"
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
                        sx={{ mb: 2 }}
                      />

                      {/* Font Size */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Font Size: {clip.properties.fontSize || 48}px
                        </Typography>
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
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                          Color:
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
                            height: 36,
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        />
                      </Box>

                      {/* Alignment */}
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Alignment</InputLabel>
                        <Select
                          value={clip.properties.alignment || 'center'}
                          label="Alignment"
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

                      {/* Animation */}
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Animation</InputLabel>
                        <Select
                          value={clip.properties.animation || 'none'}
                          label="Animation"
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

                      {/* Position (X, Y) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Position (X, Y): {clip.position?.x || 50}%, {clip.position?.y || 50}%
                        </Typography>
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
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Opacity: {Math.round((clip.properties.opacity || 1) * 100)}%
                        </Typography>
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
                    </>
                  )}

                  {/* Audio Controls - Only show for audio/video clips */}
                  {hasAudio && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Audio Controls
                      </Typography>

                      {/* Volume Control */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const newMuted = !clip.properties.muted;
                              const updated = audioEditing.setClipMuted(project, clip.id, newMuted);
                              onProjectUpdate(updated);
                            }}
                            color={effectiveMuted ? 'error' : 'default'}
                          >
                            {effectiveMuted ? <VolumeOffIcon /> : clipVolume > 0.5 ? <VolumeUpIcon /> : <VolumeDownIcon />}
                          </IconButton>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            Volume: {Math.round(clipVolume * 100)}%
                          </Typography>
                        </Box>
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
                          sx={{ ml: 1, mr: 1 }}
                        />
                      </Box>

                      {/* Mute Toggle */}
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
                        sx={{ mb: 1 }}
                      />

                      {/* Fade In/Out Controls */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Fade Effects
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
                          />
                        </Box>
                      </Box>

                      {/* Loop Control - Only for audio clips */}
                      {clip.mediaType === 'audio' && (
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
                          sx={{ mb: 1 }}
                        />
                      )}

                      {/* Detach/Attach Audio - Only for video clips */}
                      {isVideoClip && (
                        <Tooltip title={clip.properties.audioDetached ? 'Attach audio back to video' : 'Detach audio from video'}>
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
                            sx={{ mt: 1 }}
                          >
                            {clip.properties.audioDetached ? 'Attach Audio' : 'Detach Audio'}
                          </Button>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Paper>
              );
            })}
          </>
        )}
      </Box>
    </Box>
  );
};

export default PropertiesPanel;
