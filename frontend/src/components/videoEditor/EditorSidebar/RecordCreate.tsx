'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { EditorProject, Clip, Track } from '@/types/videoEditor';

interface RecordCreateProps {
  project: EditorProject;
  playheadTime: number;
  onAddClip: (clip: Clip, trackId: string) => void;
  onAddTrack: (type: Track['type']) => void;
}

const RecordCreate: React.FC<RecordCreateProps> = ({
  project,
  playheadTime,
  onAddClip,
  onAddTrack,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'webcam' | 'screen' | 'audio' | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async (type: 'webcam' | 'screen' | 'audio') => {
    try {
      let stream: MediaStream;
      
      if (type === 'webcam') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else if (type === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create clip from recording
        const videoTrack = project.timeline.find(t => t.type === 'video') || 
          project.timeline[0] || { id: `track-${Date.now()}`, type: 'video' as const, clips: [] };
        
        const newClip: Clip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mediaId: url,
          mediaType: type === 'audio' ? 'audio' : 'video',
          startTime: playheadTime,
          duration: recordingTime,
          trimIn: 0,
          trimOut: 0,
          properties: {
            volume: 1,
            opacity: 1,
          },
        };

        onAddClip(newClip, videoTrack.id);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingType(type);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setRecordingType(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Record & Create
      </Typography>

      {isRecording ? (
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'error.dark',
            color: 'error.contrastText',
          }}
        >
          <FiberManualRecordIcon sx={{ fontSize: 48, mb: 2, color: 'error.light' }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Recording {recordingType}
          </Typography>
          <Typography variant="h4" sx={{ mb: 3, fontFamily: 'monospace' }}>
            {formatTime(recordingTime)}
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopRecording}
            size="large"
          >
            Stop Recording
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<VideocamIcon />}
            onClick={() => startRecording('webcam')}
            sx={{ py: 2, textTransform: 'none' }}
          >
            Record Webcam
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<ScreenShareIcon />}
            onClick={() => startRecording('screen')}
            sx={{ py: 2, textTransform: 'none' }}
          >
            Record Screen
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<MicIcon />}
            onClick={() => startRecording('audio')}
            sx={{ py: 2, textTransform: 'none' }}
          >
            Record Audio
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Record directly to your timeline. Make sure to allow camera/microphone permissions.
        </Typography>
      </Box>
    </Box>
  );
};

export default RecordCreate;

