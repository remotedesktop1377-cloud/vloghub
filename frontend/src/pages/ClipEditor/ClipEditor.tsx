import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipPrevious as PrevIcon,
  SkipNext as NextIcon,
  VolumeUp as VolumeIcon,
  Fullscreen as FullscreenIcon,
  ContentCut as CutIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import TimelineEditor from '../../components/TimelineEditor/TimelineEditor';
import MetadataEditor from '../../components/MetadataEditor/MetadataEditor';
import TranscriptViewer from '../../components/TranscriptViewer/TranscriptViewer';

interface ClipData {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  sentiment: string;
  entities: string[];
  keywords: string[];
  selected: boolean;
}

interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  confidence: number;
}

const ClipEditor: React.FC = () => {
  const router = useRouter();
  const { videoId } = router.query;
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingClips, setProcessingClips] = useState(false);

  // Timeline selection
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  useEffect(() => {
    if (videoId && typeof videoId === 'string') {
      loadVideoData(videoId);
    }
  }, [videoId]);

  const loadVideoData = async (id: string) => {
    setLoading(true);
    try {
      // Load video metadata
      const metadataResponse = await fetch(`/api/youtube/video/${id}`);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        setVideoMetadata(metadata);
      }

      // Analyze video for clips
      setProcessingClips(true);
      const analysisResponse = await fetch('/api/clip-detection/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: id,
          min_duration: 30,
          max_duration: 120,
          min_relevance: 0.6,
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setClips(analysisData.clips || []);
        setTranscript(analysisData.transcript?.segments || []);
      } else {
        // Mock data for demo
        setClips(getMockClips());
        setTranscript(getMockTranscript());
      }
    } catch (error) {
      console.error('Error loading video data:', error);
      setVideoMetadata(getMockVideoMetadata());
      setClips(getMockClips());
      setTranscript(getMockTranscript());
    } finally {
      setLoading(false);
      setProcessingClips(false);
    }
  };

  const getMockVideoMetadata = (): VideoMetadata => ({
    id: (videoId as string) || '',
    title: 'Nelson Mandela: The Long Walk to Freedom',
    description: 'A comprehensive documentary about Nelson Mandela\'s journey.',
    duration: 2730, // 45:30 in seconds
    thumbnailUrl: `https://img.youtube.com/vi/${videoId as string}/maxresdefault.jpg`,
    channelTitle: 'History Channel',
    publishedAt: '2023-12-01',
    url: `https://www.youtube.com/watch?v=${videoId as string}`,
  });

  const getMockClips = (): ClipData[] => [
    {
      id: '1',
      startTime: 120,
      endTime: 180,
      title: 'Early Life and Education',
      description: 'Mandela\'s childhood and education in rural South Africa',
      sentiment: 'hopeful',
      entities: ['Nelson Mandela', 'Qunu', 'University'],
      keywords: ['education', 'childhood', 'rural'],
      selected: false,
    },
    {
      id: '2',
      startTime: 300,
      endTime: 420,
      title: 'Political Awakening',
      description: 'Joining the ANC and early political activities',
      sentiment: 'determined',
      entities: ['ANC', 'African National Congress', 'Politics'],
      keywords: ['politics', 'activism', 'resistance'],
      selected: false,
    },
    {
      id: '3',
      startTime: 600,
      endTime: 720,
      title: 'The Rivonia Trial',
      description: 'Mandela\'s famous speech during the trial',
      sentiment: 'defiant',
      entities: ['Rivonia Trial', 'Speech', 'Court'],
      keywords: ['trial', 'speech', 'justice'],
      selected: false,
    },
  ];

  const getMockTranscript = (): TranscriptSegment[] => [
    {
      id: '1',
      startTime: 0,
      endTime: 5,
      text: 'Nelson Mandela was born in 1918 in the small village of Qunu.',
      speaker: 'Narrator',
      confidence: 0.95,
    },
    {
      id: '2',
      startTime: 5,
      endTime: 12,
      text: 'His early years were shaped by the traditions of his Xhosa heritage.',
      speaker: 'Narrator',
      confidence: 0.92,
    },
    // More segments...
  ];

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleClipSelect = (clip: ClipData) => {
    setSelectedClip(clip);
    setSelectionStart(clip.startTime);
    setSelectionEnd(clip.endTime);
    setCurrentTime(clip.startTime);
  };

  const handleCreateClip = () => {
    if (selectionStart !== null && selectionEnd !== null) {
      const newClip: ClipData = {
        id: `custom_${Date.now()}`,
        startTime: selectionStart,
        endTime: selectionEnd,
        title: `Custom Clip ${clips.length + 1}`,
        description: 'User-created clip',
        sentiment: 'neutral',
        entities: [],
        keywords: [],
        selected: false,
      };
      setClips([...clips, newClip]);
      setSelectedClip(newClip);
    }
  };

  const handleExportClips = async () => {
    const selectedClips = clips.filter(clip => clip.selected);
    if (selectedClips.length === 0) {
      alert('Please select at least one clip to export');
      return;
    }

    try {
      const response = await fetch('/api/download/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId as string,
          clips: selectedClips,
          format: 'mp4',
          quality: '720p',
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clips_${videoId as string}.zip`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading video and analyzing content...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Clip Editor
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CutIcon />}
            onClick={handleCreateClip}
            disabled={selectionStart === null || selectionEnd === null}
            sx={{ mr: 2 }}
          >
            Create Clip
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportClips}
          >
            Export Selected
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Video Player */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <VideoPlayer
              videoId={videoId as string}
              currentTime={currentTime}
              playing={playing}
              volume={volume}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onDuration={setDuration}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
            />

            {/* Video Controls */}
            <Box display="flex" alignItems="center" mt={2} gap={2}>
              <IconButton onClick={handlePlayPause}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
              
              <Typography variant="body2" sx={{ minWidth: 80 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
              
              <Slider
                size="small"
                value={currentTime}
                max={duration}
                onChange={(_, value) => handleSeek(value as number)}
                sx={{ flexGrow: 1 }}
              />
              
              <VolumeIcon />
              <Slider
                size="small"
                value={volume}
                max={1}
                step={0.1}
                onChange={(_, value) => setVolume(value as number)}
                sx={{ width: 100 }}
              />
            </Box>
          </Paper>

          {/* Timeline Editor */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Timeline Editor
            </Typography>
            <TimelineEditor
              duration={duration}
              clips={clips}
              transcript={transcript}
              currentTime={currentTime}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              onSelectionChange={(start, end) => {
                setSelectionStart(start);
                setSelectionEnd(end);
              }}
              onSeek={handleSeek}
              onClipSelect={handleClipSelect}
            />
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Video Info */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Video Information
            </Typography>
            {videoMetadata && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {videoMetadata.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {videoMetadata.channelTitle}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Duration: {formatTime(videoMetadata.duration)}
                </Typography>
                <Typography variant="body2">
                  Published: {videoMetadata.publishedAt}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Detected Clips */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Detected Clips ({clips.length})
              </Typography>
              {processingClips && <LinearProgress sx={{ width: 100 }} />}
            </Box>
            
            <List dense>
              {clips.map((clip) => (
                <ListItem key={clip.id} disablePadding>
                  <ListItemButton
                    selected={selectedClip?.id === clip.id}
                    onClick={() => handleClipSelect(clip)}
                  >
                    <ListItemText
                      primary={clip.title}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                          </Typography>
                          <Box mt={1}>
                            <Chip
                              label={clip.sentiment}
                              size="small"
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                            {clip.entities.slice(0, 2).map((entity, index) => (
                              <Chip
                                key={index}
                                label={entity}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Metadata Editor */}
          {selectedClip && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Clip Metadata
              </Typography>
              <MetadataEditor
                clip={selectedClip}
                onChange={(updatedClip) => {
                  setSelectedClip(updatedClip);
                  setClips(clips.map(c => 
                    c.id === updatedClip.id ? updatedClip : c
                  ));
                }}
              />
            </Paper>
          )}

          {/* Transcript */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Transcript</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TranscriptViewer
                segments={transcript}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClipEditor; 