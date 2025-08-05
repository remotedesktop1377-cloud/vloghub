import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
} from '@mui/material';

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  confidence: number;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  segments,
  currentTime,
  onSeek,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCurrentSegment = (segment: TranscriptSegment): boolean => {
    return currentTime >= segment.startTime && currentTime <= segment.endTime;
  };

  return (
    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
      <List dense>
        {segments.map((segment) => (
          <ListItem key={segment.id} disablePadding>
            <ListItemButton
              selected={isCurrentSegment(segment)}
              onClick={() => onSeek(segment.startTime)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              <ListItemText
                primary={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="caption" color="textSecondary">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </Typography>
                      {segment.speaker && (
                        <Chip
                          label={segment.speaker}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      )}
                      <Chip
                        label={`${Math.round(segment.confidence * 100)}%`}
                        size="small"
                        color={segment.confidence > 0.8 ? 'success' : 'warning'}
                        sx={{ fontSize: 10, height: 20 }}
                      />
                    </Box>
                    <Typography variant="body2">
                      {segment.text}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {segments.length === 0 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No transcript available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TranscriptViewer; 