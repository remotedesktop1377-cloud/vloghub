import { useEffect, useRef, useCallback, RefObject } from 'react';

interface UsePreviewSyncOptions {
  videoRef: RefObject<HTMLVideoElement>;
  playheadTime: number;
  isPlaying: boolean;
  videoReady: boolean;
  onPlayheadChange: (time: number) => void;
  seekThreshold?: number; // Minimum time difference to trigger seek (default 0.1s)
}

/**
 * Hook to synchronize video playback with editor playhead and timeline
 * Handles:
 * - Syncing video playback state with isPlaying
 * - Updating playhead as video plays
 * - Seeking video when playhead changes
 */
export function usePreviewSync({
  videoRef,
  playheadTime,
  isPlaying,
  videoReady,
  onPlayheadChange,
  seekThreshold = 0.1,
}: UsePreviewSyncOptions) {
  const lastSeekTimeRef = useRef<number>(0);
  const isUserSeekingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  // Sync video playback with isPlaying state
  useEffect(() => {
    if (!videoRef.current || !videoReady) return;

    const video = videoRef.current;

    if (isPlaying) {
      video.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, videoReady, videoRef]);

  // Seek video when playhead changes (from timeline clicks, scrubbing, etc.)
  useEffect(() => {
    if (!videoRef.current || !videoReady) return;

    const video = videoRef.current;
    const currentTime = video.currentTime;
    const timeDiff = Math.abs(currentTime - playheadTime);

    // Only seek if difference is significant (avoid infinite loops)
    // and if we're not currently playing (to avoid interrupting playback)
    if (timeDiff > seekThreshold && !isPlaying && !isUserSeekingRef.current) {
      // Check if this is a new seek (different from last seek)
      if (Math.abs(playheadTime - lastSeekTimeRef.current) > seekThreshold) {
        video.currentTime = playheadTime;
        lastSeekTimeRef.current = playheadTime;
      }
    }
  }, [playheadTime, videoReady, videoRef, seekThreshold, isPlaying]);

  // Update playhead as video plays (using requestAnimationFrame for smooth updates)
  // Note: We don't include playheadTime in deps to avoid infinite loops
  useEffect(() => {
    if (!videoRef.current || !videoReady || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    let lastUpdateTime = performance.now();
    let lastPlayheadTime = video.currentTime;

    const updatePlayhead = () => {
      if (!video || video.paused) return;

      const now = performance.now();
      const elapsed = now - lastUpdateTime;
      const currentVideoTime = video.currentTime;

      // Update playhead every ~100ms or when time changes significantly
      if (elapsed >= 100 || Math.abs(currentVideoTime - lastPlayheadTime) > 0.1) {
        // Only update if the time actually changed significantly
        if (Math.abs(currentVideoTime - lastPlayheadTime) > 0.05) {
          onPlayheadChange(currentVideoTime);
          lastPlayheadTime = currentVideoTime;
        }
        lastUpdateTime = now;
      }

      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
    // Removed playheadTime from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, videoReady, onPlayheadChange]);


  // Expose manual seek function for user-initiated seeks (scrubbing, clicking timeline)
  const seekTo = useCallback((time: number) => {
    if (!videoRef.current || !videoReady) return;

    isUserSeekingRef.current = true;
    videoRef.current.currentTime = time;
    lastSeekTimeRef.current = time;
    onPlayheadChange(time);

    // Reset user seeking flag after a short delay
    setTimeout(() => {
      isUserSeekingRef.current = false;
    }, 100);
  }, [videoRef, videoReady, onPlayheadChange]);

  return { seekTo };
}

