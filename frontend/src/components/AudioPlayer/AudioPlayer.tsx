'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconButton, Box, Typography, LinearProgress } from '@mui/material';
import { PlayArrow, Pause, VolumeUp } from '@mui/icons-material';
import { PRIMARY, BORDER, BACKGROUND, TEXT, NEUTRAL, SPECIAL } from '../../styles/colors';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  voiceStyle?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  title = 'Chapter Audio',
  voiceStyle,
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      console.error('Audio loading error');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box className={`${styles.audioPlayer} ${className}`} sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      p: 1, 
      border: `1px solid ${BORDER.light}`,
      borderRadius: 1,
      bgcolor: BACKGROUND.light,
      minWidth: 200 
    }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <IconButton
        onClick={togglePlay}
        disabled={isLoading}
        size="small"
        sx={{ 
          bgcolor: PRIMARY.main, 
          color: PRIMARY.contrastText,
          width: 24,
          height: 24,
          '&:hover': { bgcolor: PRIMARY.light },
          '&:disabled': { bgcolor: NEUTRAL.gray[300] }
        }}
      >
        {isLoading ? (
          <VolumeUp sx={{ fontSize: 12 }} />
        ) : isPlaying ? (
          <Pause sx={{ fontSize: 12 }} />
        ) : (
          <PlayArrow sx={{ fontSize: 12 }} />
        )}
      </IconButton>

      {/* Progress and Waveform Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {/* Title and Voice Style */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
            {title}
          </Typography>
          {voiceStyle && (
            <Typography variant="caption" sx={{ 
              fontSize: '0.6rem', 
              color: TEXT.dark,
              fontStyle: 'italic',
              bgcolor: SPECIAL.lightBlue,
              px: 0.5,
              py: 0.1,
              borderRadius: 0.5
            }}>
              {voiceStyle}
            </Typography>
          )}
        </Box>

        {/* Waveform/Progress Bar */}
        <Box 
          onClick={handleProgressClick}
          sx={{ 
            position: 'relative', 
            height: 20, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {/* Simple waveform visualization */}
          <Box className={styles.waveform} sx={{ 
            position: 'absolute', 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 0.2
          }}>
            {Array.from({ length: 40 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: `${Math.random() * 80 + 20}%`,
                  bgcolor: i / 40 <= progress / 100 ? PRIMARY.main : NEUTRAL.gray[300],
                  borderRadius: 0.2,
                  transition: 'background-color 0.1s ease'
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Time Display */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: TEXT.dark }}>
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: TEXT.dark }}>
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
