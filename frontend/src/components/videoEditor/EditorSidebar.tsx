'use client';

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TransformIcon from '@mui/icons-material/Transform';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import DeleteIcon from '@mui/icons-material/Delete';
import { Track, EditorProject, Clip } from '@/types/videoEditor';
import TextTitles from './EditorSidebar/TextTitles';
import MediaLibrary from './EditorSidebar/MediaLibrary';
import AudioLibrary from './EditorSidebar/AudioLibrary';
import TransitionsPanel from './EditorSidebar/TransitionsPanel';

interface EditorSidebarProps {
  onAddTrack: (type: Track['type']) => void;
  onRemoveTrack: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onToggleTrackMute: (trackId: string) => void;
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
  tracks,
  project,
  playheadTime,
  onAddTextClip,
  onAddClip,
}) => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box
      sx={{
        width: 280,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Media" />
        <Tab label="Text" />
        <Tab label="Audio" />
        <Tab label="Effects" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {tabIndex === 0 && (
          <MediaLibrary
            project={project}
            playheadTime={playheadTime}
            onAddClip={onAddClip}
            onAddTrack={onAddTrack}
          />
        )}

        {tabIndex === 1 && (
          <TextTitles
            project={project}
            playheadTime={playheadTime}
            onAddTextClip={onAddTextClip}
          />
        )}

        {tabIndex === 2 && (
          <AudioLibrary
            project={project}
            playheadTime={playheadTime}
            onAddClip={onAddClip}
            onAddTrack={onAddTrack}
          />
        )}

        {tabIndex === 3 && (
          <TransitionsPanel project={project} />
        )}
      </Box>

      {/* Tracks Section */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Tracks ({tracks.length})
        </Typography>
        <List dense>
          {tracks.map((track) => (
            <ListItem 
              key={track.id} 
              sx={{ 
                px: 1,
                py: 0.5,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => onToggleTrackLock(track.id)}
                    title={track.locked ? 'Unlock track' : 'Lock track'}
                  >
                    {track.locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                  </IconButton>
                  {(track.type === 'audio' || track.type === 'video') && (
                    <IconButton
                      size="small"
                      onClick={() => onToggleTrackMute(track.id)}
                      title={track.muted ? 'Unmute track' : 'Mute track'}
                    >
                      {track.muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => onRemoveTrack(track.id)}
                    title="Remove track"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {track.type === 'video' && <VideoLibraryIcon fontSize="small" />}
                {track.type === 'audio' && <MusicNoteIcon fontSize="small" />}
                {track.type === 'overlay' && <TextFieldsIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={`${track.type.charAt(0).toUpperCase() + track.type.slice(1)} Track`}
                secondary={`${track.clips.length} clips`}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => onAddTrack('video')}
            sx={{ textTransform: 'none', flex: 1 }}
          >
            Video
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => onAddTrack('audio')}
            sx={{ textTransform: 'none', flex: 1 }}
          >
            Audio
          </Button>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => onAddTrack('overlay')}
          sx={{ textTransform: 'none', mt: 1, width: '100%' }}
        >
          Overlay
        </Button>
      </Box>
    </Box>
  );
};

export default EditorSidebar;

