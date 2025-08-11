import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper } from '@mui/material';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  videoId: string;
  currentTime: number;
  playing: boolean;
  volume: number;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onDuration: (duration: number) => void;
  selectionStart?: number | null;
  selectionEnd?: number | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  currentTime,
  playing,
  volume,
  onTimeUpdate,
  onPlay,
  onPause,
  onDuration,
  selectionStart,
  selectionEnd,
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // Seek when currentTime changes externally
  useEffect(() => {
    if (playerRef.current && Math.abs(currentTime - lastUpdateTime) > 1) {
      playerRef.current.seekTo(currentTime, 'seconds');
    }
  }, [currentTime, lastUpdateTime]);

  const handleProgress = (state: { playedSeconds: number }) => {
    setLastUpdateTime(state.playedSeconds);
    onTimeUpdate(state.playedSeconds);
  };

  const handleDuration = (duration: number) => {
    onDuration(duration);
  };

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <Box position="relative">
      <Paper 
        elevation={0}
        sx={{ 
          backgroundColor: '#000',
          borderRadius: 1,
          overflow: 'hidden',
          aspectRatio: '16/9',
          position: 'relative'
        }}
      >
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          volume={volume}
          width="100%"
          height="100%"
          onPlay={onPlay}
          onPause={onPause}
          onProgress={handleProgress}
          onDuration={handleDuration}
          progressInterval={100}
          controls={false} // We'll use custom controls
          config={{
            youtube: {
              playerVars: {
                showinfo: 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
              },
            },
          }}
        />

        {/* Selection Overlay */}
        {selectionStart !== null && selectionEnd !== null && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: `linear-gradient(
                to right,
                rgba(0,0,0,0.6) 0%,
                rgba(0,0,0,0.6) ${(selectionStart! / (playerRef.current?.getDuration() || 1)) * 100}%,
                transparent ${(selectionStart! / (playerRef.current?.getDuration() || 1)) * 100}%,
                transparent ${(selectionEnd! / (playerRef.current?.getDuration() || 1)) * 100}%,
                rgba(0,0,0,0.6) ${(selectionEnd! / (playerRef.current?.getDuration() || 1)) * 100}%,
                rgba(0,0,0,0.6) 100%
              )`,
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default VideoPlayer; 