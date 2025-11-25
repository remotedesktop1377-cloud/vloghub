import React from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { Pause as PauseIcon, PlayArrow as PlayIcon, SkipNext as SkipNextIcon, SkipPrevious as SkipPreviousIcon } from '@mui/icons-material';
import { HelperFunctions } from '../../utils/helperFunctions';

interface Props {
  src: string;
  title?: string;
  playerId?: string;
}

export const CustomAudioPlayer: React.FC<Props> = ({ src, title, playerId }) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Normalize empty src to undefined
  const safeSrc = (typeof src === 'string' && backend.trim().length > 0) ? src : undefined;

  React.useEffect(() => {
    // registry for external pause by id
    if (typeof window !== 'undefined' && playerId && audioRef.current) {
      (window as any).__audioPlayers = (window as any).__audioPlayers || {};
      (window as any).__audioPlayers[playerId] = audioRef.current;
      return () => {
        if ((window as any).__audioPlayers && (window as any).__audioPlayers[playerId] === audioRef.current) {
          delete (window as any).__audioPlayers[playerId];
        }
      };
    }
  }, [playerId]);

  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onError = () => {
      if (typeof window !== 'undefined' && (window as any).toast) {
        HelperFunctions.showError('Unable to play audio. Please ensure the Drive file is publicly accessible.');
      }
    };
    const onCanPlay = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    el.addEventListener('error', onError);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('canplaythrough', onCanPlay);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('playing', onPlaying);
    return () => {
      el.removeEventListener('error', onError);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('canplaythrough', onCanPlay);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('playing', onPlaying);
    };
  }, []);

  React.useEffect(() => {
    const el = audioRef.current;
    setIsPlaying(false);
    setIsLoading(true);
    if (el) {
      try { el.pause(); } catch {}
      try { el.load(); } catch {}
    }
  }, [safeSrc]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      try {
        setIsLoading(true);
        await el.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    }
  };

  const accent = '#d32f2f';

  // If no valid src, render nothing
  if (!safeSrc) return null;

  return (
    <Box sx={{ width: '100%' }}>
      <audio ref={audioRef} src={safeSrc} preload="auto" crossOrigin="anonymous" />
      <Box sx={{ p: 1.5, bgcolor: 'background.paper', width: '100%' }}>
        {title && (
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>{title}</Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <IconButton size="small" disabled sx={{ color: accent }}>
            <SkipPreviousIcon fontSize="small" />
          </IconButton>
          <IconButton size="medium" onClick={toggle} sx={{ color: 'white', bgcolor: accent, '&:hover': { bgcolor: '#b71c1c' }, width: 36, height: 36 }}>
            {isLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : (isPlaying ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />)}
          </IconButton>
          <IconButton size="small" disabled sx={{ color: accent }}>
            <SkipNextIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomAudioPlayer;


