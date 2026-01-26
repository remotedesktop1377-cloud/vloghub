'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Collapse,
  Paper,
  Tooltip,
  Chip,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Track, EditorProject, Clip } from '@/types/videoEditor';
import IconNavigation, { SidebarSection } from './EditorSidebar/IconNavigation';
import YourMediaSection from './EditorSidebar/YourMediaSection';
import RecordCreate from './EditorSidebar/RecordCreate';
import TextTitles from './EditorSidebar/TextTitles';
import AudioLibrary from './EditorSidebar/AudioLibrary';
import StockMedia from './EditorSidebar/StockMedia';
import Templates from './EditorSidebar/Templates';
import Graphics from './EditorSidebar/Graphics';
import TransitionsPanel from './EditorSidebar/TransitionsPanel';
import BrandKit from './EditorSidebar/BrandKit';

interface EditorSidebarProps {
  onAddTrack: (type: Track['type']) => void;
  onRemoveTrack: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackHide?: (trackId: string) => void;
  onRenameTrack?: (trackId: string, newName: string) => void;
  tracks: Track[];
  project: EditorProject;
  playheadTime: number;
  onAddTextClip: (clip: Clip, trackId: string) => void;
  onAddClip: (clip: Clip, trackId: string) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  onAddTrack,
  onRemoveTrack,
  onToggleTrackLock,
  onToggleTrackMute,
  onToggleTrackHide,
  onRenameTrack,
  tracks,
  project,
  playheadTime,
  onAddTextClip,
  onAddClip,
}) => {
  const [activeSection, setActiveSection] = useState<SidebarSection>('media');
  const [tracksExpanded, setTracksExpanded] = useState(true);

  const renderContent = () => {
    switch (activeSection) {
      case 'media':
        return (
          <YourMediaSection
            project={project}
            playheadTime={playheadTime}
            onAddClip={onAddClip}
            onAddTrack={onAddTrack}
          />
        );
      case 'record':
        return (
          <RecordCreate
            project={project}
            playheadTime={playheadTime}
            onAddClip={onAddClip}
            onAddTrack={onAddTrack}
          />
        );
      case 'text':
        return (
          <TextTitles
            project={project}
            playheadTime={playheadTime}
            onAddTextClip={onAddTextClip}
          />
        );
      case 'music':
        return (
          <AudioLibrary
            project={project}
            playheadTime={playheadTime}
            onAddClip={onAddClip}
            onAddTrack={onAddTrack}
          />
        );
      case 'stock-video':
        return <StockMedia type="video" />;
      case 'stock-images':
        return <StockMedia type="image" />;
      case 'templates':
        return <Templates project={project} />;
      case 'graphics':
        return (
          <Graphics
            project={project}
            playheadTime={playheadTime}
            onAddClip={onAddClip}
            onAddTrack={onAddTrack}
          />
        );
      case 'transitions':
        return <TransitionsPanel project={project} />;
      case 'brand-kit':
        return <BrandKit project={project} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        width: 360,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'row',
        bgcolor: 'background.paper',
        height: '100%',
      }}
    >
      {/* Vertical Icon Navigation */}
      <IconNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Content Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderContent()}
        </Box>

        {/* Tracks Section */}
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => setTracksExpanded(!tracksExpanded)}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Tracks ({tracks.length})
            </Typography>
            {tracksExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>

          <Collapse in={tracksExpanded} timeout="auto">
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              {/* Track Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {tracks.map((track) => {
                  const trackColors = {
                    video: { main: '#2196F3', light: 'rgba(33, 150, 243, 0.1)', gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' },
                    audio: { main: '#4CAF50', light: 'rgba(76, 175, 80, 0.1)', gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' },
                    overlay: { main: '#9C27B0', light: 'rgba(156, 39, 176, 0.1)', gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)' },
                  };
                  const colors = trackColors[track.type];
                  const trackIcon = {
                    video: VideoLibraryIcon,
                    audio: MusicNoteIcon,
                    overlay: TextFieldsIcon,
                  };
                  const IconComponent = trackIcon[track.type];

                  return (
                    <Paper
                      key={track.id}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        borderLeft: `4px solid ${colors.main}`,
                        bgcolor: colors.light,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Track Icon */}
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: colors.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0,
                          }}
                        >
                          <IconComponent sx={{ fontSize: 20 }} />
                        </Box>

                        {/* Track Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              mb: 0.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {track.name || `${track.type.charAt(0).toUpperCase() + track.type.slice(1)} Track`}
                          </Typography>
                          <Chip
                            label={`${track.clips.length} clip${track.clips.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: 'rgba(0, 0, 0, 0.05)',
                            }}
                          />
                        </Box>

                        {/* Track Controls */}
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          {onToggleTrackHide && (
                            <Tooltip title={track.hidden ? 'Show track' : 'Hide track'}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTrackHide(track.id);
                                }}
                                sx={{
                                  color: track.hidden ? 'text.disabled' : 'text.primary',
                                }}
                              >
                                {track.hidden ? (
                                  <VisibilityOffIcon fontSize="small" />
                                ) : (
                                  <VisibilityIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={track.locked ? 'Unlock track' : 'Lock track'}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTrackLock(track.id);
                              }}
                              sx={{
                                color: track.locked ? colors.main : 'text.secondary',
                              }}
                            >
                              {track.locked ? (
                                <LockIcon fontSize="small" />
                              ) : (
                                <LockOpenIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          {(track.type === 'audio' || track.type === 'video') && (
                            <Tooltip title={track.muted ? 'Unmute track' : 'Mute track'}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTrackMute(track.id);
                                }}
                                sx={{
                                  color: track.muted ? 'error.main' : 'text.secondary',
                                }}
                              >
                                {track.muted ? (
                                  <VolumeOffIcon fontSize="small" />
                                ) : (
                                  <VolumeUpIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete track">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTrack(track.id);
                              }}
                              sx={{
                                color: 'error.main',
                                '&:hover': {
                                  bgcolor: 'error.light',
                                  color: 'error.dark',
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              {/* Add Track Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onAddTrack('video')}
                    sx={{
                      flex: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                      boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Video
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onAddTrack('audio')}
                    sx={{
                      flex: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #388E3C 0%, #2E7D32 100%)',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Audio
                  </Button>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => onAddTrack('overlay')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%)',
                      boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Overlay
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Box>
  );
};

export default EditorSidebar;

