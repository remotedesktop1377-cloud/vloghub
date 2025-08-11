import React, { useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeFromClientX = (clientX: number): number => {
    const el = containerRef.current;
    if (!el || duration <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(clientX, rect.right));
    const pct = (x - rect.left) / rect.width;
    return Math.max(0, Math.min(duration, pct * duration));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const start = getTimeFromClientX(e.clientX);
    setDragStartX(e.clientX);
    onSelectionChange(start, null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    const start = getTimeFromClientX(dragStartX);
    const current = getTimeFromClientX(e.clientX);
    const selStart = Math.min(start, current);
    const selEnd = Math.max(start, current);
    onSelectionChange(selStart, selEnd);
  };

  const endDrag = () => {
    setIsDragging(false);
    setDragStartX(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return; // ignore click if it was a drag
    const time = getTimeFromClientX(e.clientX);
    onSeek(time);
  };

  // Compute selection overlay styles (percentage-based)
  const selStartPct = selectionStart != null && duration > 0 ? (selectionStart / duration) * 100 : null;
  const selEndPct = selectionEnd != null && duration > 0 ? (selectionEnd / duration) * 100 : null;
  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Timeline Editor - Duration: {formatTime(duration)}
      </Typography>
      <Paper
        ref={containerRef}
        sx={{
          position: 'relative',
          height: 120,
          backgroundColor: '#f5f5f5',
          userSelect: 'none',
          cursor: isDragging ? 'ew-resize' : 'pointer',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClick={handleClick}
      >
        {/* Current time indicator */}
        <Box
          sx={{
            position: 'absolute',
            left: `${currentPct}%`,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: '#d32f2f',
            pointerEvents: 'none',
          }}
        />

        {/* Selection overlay */}
        {selStartPct != null && selEndPct != null && (
          <Box
            sx={{
              position: 'absolute',
              left: `${selStartPct}%`,
              width: `${Math.max(0, selEndPct - selStartPct)}%`,
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              border: '2px solid #1976d2',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Placeholder center label */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Click to seek • Drag to select
          </Typography>
        </Box>
      </Paper>

      {selectionStart != null && selectionEnd != null && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            Selection: {formatTime(selectionStart)} - {formatTime(selectionEnd)} ({formatTime(selectionEnd - selectionStart)} duration)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TimelineEditor; 