import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { ContentCut as CutIcon } from '@mui/icons-material';

interface ClipData {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  sentiment: string;
  selected: boolean;
}

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface TimelineEditorProps {
  duration: number;
  clips: ClipData[];
  transcript: TranscriptSegment[];
  currentTime: number;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  onSelectionChange: (start: number | null, end: number | null) => void;
  onSeek: (time: number) => void;
  onClipSelect: (clip: ClipData) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  duration,
  clips,
  transcript,
  currentTime,
  selectionStart,
  selectionEnd,
  onSelectionChange,
  onSeek,
  onClipSelect,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const timelineHeight = 120;
  const clipTrackHeight = 40;
  const transcriptTrackHeight = 30;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeFromPosition = (x: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const percentage = relativeX / rect.width;
    return Math.max(0, Math.min(duration, percentage * duration));
  };

  const getPositionFromTime = (time: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const percentage = time / duration;
    return percentage * rect.width;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    setDragStart(time);
    onSelectionChange(time, null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart !== null) {
      const time = getTimeFromPosition(e.clientX);
      const start = Math.min(dragStart, time);
      const end = Math.max(dragStart, time);
      onSelectionChange(start, end);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      const time = getTimeFromPosition(e.clientX);
      onSeek(time);
    }
  };

  // Generate time markers
  const timeMarkers = [];
  const markerInterval = Math.max(1, Math.floor(duration / 10)); // About 10 markers
  for (let i = 0; i <= duration; i += markerInterval) {
    timeMarkers.push(i);
  }

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
      case 'hopeful':
      case 'inspiring':
        return '#4caf50';
      case 'negative':
      case 'somber':
      case 'angry':
        return '#f44336';
      case 'neutral':
        return '#9e9e9e';
      case 'determined':
      case 'defiant':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  };

  return (
    <Box>
      {/* Time Markers */}
      <Box sx={{ position: 'relative', height: 20, mb: 1 }}>
        {timeMarkers.map((time) => (
          <Box
            key={time}
            sx={{
              position: 'absolute',
              left: `${(time / duration) * 100}%`,
              transform: 'translateX(-50%)',
              borderLeft: '1px solid #ccc',
              height: 10,
              top: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {formatTime(time)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Timeline */}
      <Paper
        ref={timelineRef}
        sx={{
          height: timelineHeight,
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleTimelineClick}
      >
        {/* Clip Track */}
        <Box sx={{ position: 'relative', height: clipTrackHeight }}>
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: 4,
              top: 2,
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.8)',
              px: 1,
              borderRadius: 0.5,
            }}
          >
            Clips
          </Typography>
          
          {clips.map((clip) => (
            <Box
              key={clip.id}
              sx={{
                position: 'absolute',
                left: `${(clip.startTime / duration) * 100}%`,
                width: `${((clip.endTime - clip.startTime) / duration) * 100}%`,
                height: clipTrackHeight - 4,
                top: 2,
                backgroundColor: getSentimentColor(clip.sentiment),
                opacity: clip.selected ? 1 : 0.7,
                borderRadius: 1,
                border: clip.selected ? '2px solid #1976d2' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                px: 1,
                '&:hover': {
                  opacity: 1,
                  transform: 'scaleY(1.1)',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClipSelect(clip);
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'white',
                  fontSize: 9,
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {clip.title}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Transcript Track */}
        <Box sx={{ position: 'relative', height: transcriptTrackHeight, top: clipTrackHeight }}>
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: 4,
              top: 2,
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.8)',
              px: 1,
              borderRadius: 0.5,
            }}
          >
            Transcript
          </Typography>
          
          {transcript.map((segment) => (
            <Box
              key={segment.id}
              sx={{
                position: 'absolute',
                left: `${(segment.startTime / duration) * 100}%`,
                width: `${((segment.endTime - segment.startTime) / duration) * 100}%`,
                height: transcriptTrackHeight - 4,
                top: 2,
                backgroundColor: segment.speaker ? '#e3f2fd' : '#f3e5f5',
                border: '1px solid #ddd',
                borderRadius: 0.5,
                overflow: 'hidden',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: 8,
                  p: 0.5,
                  lineHeight: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {segment.text.substring(0, 20)}...
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Waveform Placeholder */}
        <Box
          sx={{
            position: 'relative',
            height: 30,
            top: clipTrackHeight + transcriptTrackHeight,
            backgroundColor: '#e8f5e8',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: 4,
              top: 2,
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.8)',
              px: 1,
              borderRadius: 0.5,
            }}
          >
            Audio Waveform
          </Typography>
          {/* Simple waveform visualization */}
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0 }}>
            {Array.from({ length: 50 }, (_, i) => (
              <rect
                key={i}
                x={`${(i / 50) * 100}%`}
                y="50%"
                width="2%"
                height={`${Math.random() * 60 + 10}%`}
                fill="#4caf50"
                opacity={0.3}
                transform="translateY(-50%)"
              />
            ))}
          </svg>
        </Box>

        {/* Current Time Indicator */}
        <Box
          sx={{
            position: 'absolute',
            left: `${(currentTime / duration) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: '#d32f2f',
            zIndex: 15,
            pointerEvents: 'none',
          }}
        />

        {/* Selection Overlay */}
        {selectionStart !== null && selectionEnd !== null && (
          <Box
            sx={{
              position: 'absolute',
              left: `${(selectionStart / duration) * 100}%`,
              width: `${((selectionEnd - selectionStart) / duration) * 100}%`,
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              border: '2px solid #1976d2',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}
      </Paper>

      {/* Selection Info */}
      {selectionStart !== null && selectionEnd !== null && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            Selection: {formatTime(selectionStart)} - {formatTime(selectionEnd)} 
            ({formatTime(selectionEnd - selectionStart)} duration)
          </Typography>
          <IconButton
            size="small"
            onClick={() => onSelectionChange(selectionStart, selectionEnd)}
            title="Create clip from selection"
          >
            <CutIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default TimelineEditor; 