'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { EditorProject, Clip, Track } from '@/types/videoEditor';
import { HelperFunctions } from '@/utils/helperFunctions';
import { useAudioEditing } from '@/hooks/useAudioEditing';
import { getActiveTextClips, calculateTextOpacity, positionToPixels, getTextAlign } from '@/utils/textRenderer';
import { getActiveClipsAtTime, getBaseVideoClip, calculateClipOpacity, getClipPlaybackTime } from '@/utils/previewCompositor';

interface PreviewAreaProps {
  project: EditorProject;
  playheadTime: number;
  isPlaying: boolean;
  narratorVideoUrl?: string;
  onPlayheadChange: (time: number) => void;
  onProjectUpdate?: (project: EditorProject) => void;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({
  project,
  playheadTime,
  isPlaying,
  narratorVideoUrl,
  onPlayheadChange,
  onProjectUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<EditorProject>(project);
  const videoRefsMap = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [draggingTextClip, setDraggingTextClip] = useState<Clip | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const audioEditing = useAudioEditing();

  // Helper to register video element (callback ref pattern)
  const registerVideoRef = React.useCallback((clipId: string) => {
    return (element: HTMLVideoElement | null) => {
      if (element) {
        videoRefsMap.current.set(clipId, element);
      } else {
        videoRefsMap.current.delete(clipId);
      }
    };
  }, []);
  
  // Keep project ref in sync
  useEffect(() => {
    projectRef.current = project;
  }, [project]);
  
  // Get all active clips at current playhead time (video, image, text)
  const activeClips = getActiveClipsAtTime(project, playheadTime);
  const activeTextClips = activeClips.text.map(t => t.clip);
  
  // Get base video (first video clip from timeline or narrator video)
  const baseVideo = getBaseVideoClip(project, narratorVideoUrl);
  
  // Separate base video from overlay videos
  const baseVideoClips = baseVideo.clip ? [baseVideo] : [];
  const overlayVideoClips = activeClips.video.filter(v => 
    baseVideo.clip ? v.clip.id !== baseVideo.clip.id : true
  );

  // Handle text drag start
  const handleTextDragStart = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();
    setDraggingTextClip(clip);
    const rect = previewContainerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle text drag
  useEffect(() => {
    if (!draggingTextClip || !dragStartPos || !previewContainerRef.current || !onProjectUpdate) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = previewContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Convert to percentage
      const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

      setDragOffset({ x: xPercent, y: yPercent });
    };

    const handleMouseUp = () => {
      // Commit the position change
      if (onProjectUpdate && draggingTextClip && dragOffset) {
        const currentProject = projectRef.current;
        const updated = {
          ...currentProject,
          timeline: currentProject.timeline.map((track) => ({
            ...track,
            clips: track.clips.map((c) =>
              c.id === draggingTextClip.id
                ? {
                    ...c,
                    position: dragOffset,
                  }
                : c
            ),
          })),
        };
        onProjectUpdate(updated);
      }
      
      setDraggingTextClip(null);
      setDragStartPos(null);
      setDragOffset(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTextClip, dragStartPos, dragOffset, onProjectUpdate]);

  // Handle base video loading (narrator or first timeline video clip)
  useEffect(() => {
    const videoToLoad = baseVideo.clip?.mediaId || baseVideo.narratorUrl || narratorVideoUrl;
    if (videoRef.current && videoToLoad) {
      const video = videoRef.current;
      
      // Normalize Google Drive URL if needed
      let normalizedUrl = HelperFunctions.normalizeGoogleDriveUrl(videoToLoad);
      console.log('Loading video:', { original: videoToLoad, normalized: normalizedUrl });
      
      // Convert relative URL to absolute if needed
      if (normalizedUrl.startsWith('/api/')) {
        normalizedUrl = `${window.location.origin}${normalizedUrl}`;
        console.log('Converted to absolute URL:', normalizedUrl);
      }
      
      // Verify URL was normalized correctly
      if (!normalizedUrl || (normalizedUrl === videoToLoad && videoToLoad.includes('drive.google.com'))) {
        console.warn('URL normalization may have failed, using original URL');
      }
      
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded, duration:', video.duration);
        setVideoReady(true);
        setVideoLoading(false);
        setVideoError(null);
      };

      const handleError = (e: Event) => {
        console.error('Video loading error:', e, video.error);
        let errorMessage = 'Failed to load video.';
        
        if (video.error) {
          switch (video.error.code) {
            case video.error.MEDIA_ERR_ABORTED:
              errorMessage = 'Video loading was aborted.';
              break;
            case video.error.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading video. Check your connection.';
              break;
            case video.error.MEDIA_ERR_DECODE:
              errorMessage = 'Video decoding error. The file may be corrupted.';
              break;
            case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Video format not supported or source not found.';
              break;
            default:
              errorMessage = `Video error (code ${video.error.code}): ${video.error.message || 'Unknown error'}`;
          }
        } else {
          errorMessage = 'Video failed to load. Please check the video URL and try again.';
        }
        
        setVideoError(errorMessage);
        setVideoLoading(false);
        setVideoReady(false);
      };

      const handleLoadStart = () => {
        console.log('Video load started');
        setVideoLoading(true);
        setVideoError(null);
        setVideoReady(false);
      };

      const handleCanPlay = () => {
        console.log('Video can play');
        setVideoReady(true);
        setVideoLoading(false);
        setVideoError(null);
      };

      const handleLoadedData = () => {
        console.log('Video data loaded');
      };

      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const duration = video.duration;
          if (duration > 0) {
            const percent = (bufferedEnd / duration) * 100;
            console.log(`Video buffered: ${percent.toFixed(1)}%`);
          }
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('progress', handleProgress);

      // Don't set crossOrigin for our API endpoint (it's same-origin)
      // Only set it for external Google Drive URLs
      if (normalizedUrl.includes('drive.google.com') && !normalizedUrl.includes('/api/')) {
        video.crossOrigin = 'anonymous';
      }

      // Clear previous source and reset
      video.src = '';
      video.load();
      
      // Small delay to ensure previous load is cleared, then set new source
      const timeoutId = setTimeout(() => {
        if (videoRef.current && videoRef.current === video) {
          video.src = normalizedUrl;
          video.load();
        }
      }, 100);

      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('progress', handleProgress);
        // Clean up video source
        if (videoRef.current) {
          video.src = '';
          video.load();
        }
      };
    } else {
      setVideoLoading(false);
      setVideoReady(false);
    }
  }, [baseVideo.clip?.mediaId, baseVideo.narratorUrl, narratorVideoUrl]);

  // Sync playhead with video (only when NOT playing - user scrubbing)
  useEffect(() => {
    if (videoRef.current && videoReady && !isPlaying) {
      const video = videoRef.current;
      const currentTime = video.currentTime;
      const timeDiff = Math.abs(currentTime - playheadTime);

      // Only seek if difference is significant (more than 0.1 seconds)
      // This handles user scrubbing the timeline
      if (timeDiff > 0.1) {
        video.currentTime = playheadTime;
      }
    }
  }, [playheadTime, videoReady, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current && videoReady) {
      const video = videoRef.current;
      if (isPlaying) {
        // Only set video time to playhead if we're starting playback (not if already playing)
        // Check if video is currently paused or stopped
        if (video.paused || video.ended) {
          const timeDiff = Math.abs(video.currentTime - playheadTime);
          if (timeDiff > 0.1) {
            video.currentTime = playheadTime;
          }
        }
        video.play().catch((error) => {
          console.error('Error playing video:', error);
        });
      } else {
        video.pause();
      }
    }
    // Only depend on isPlaying and videoReady - don't seek when playheadTime changes during playback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, videoReady]);

  // Update playhead as video plays
  useEffect(() => {
    if (!videoRef.current || !videoReady || !isPlaying) return;

    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      if (video && !video.paused && !video.ended) {
        const currentTime = video.currentTime;
        // Always update playhead when video is playing - let the threshold check prevent loops
        // Don't check against playheadTime here to avoid interference
        onPlayheadChange(currentTime);
      }
    };

    const handleEnded = () => {
      // When video ends, pause playback
      if (video) {
        video.pause();
        onPlayheadChange(video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
    // Remove playheadTime from deps - it shouldn't re-register listeners when playhead changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, videoReady, onPlayheadChange]);

  // Apply audio properties to video element
  // Use a ref to track last applied values to avoid unnecessary updates
  const lastAudioPropsRef = React.useRef<{
    muted: boolean;
    volume: number;
    loop: boolean;
  } | null>(null);

  useEffect(() => {
    const videoToLoad = baseVideo.clip?.mediaId || baseVideo.narratorUrl || narratorVideoUrl;
    if (!videoRef.current || !videoReady || !videoToLoad) return;

    const video = videoRef.current;
    
    // Find the active clip at the current playhead time
    let activeClip: Clip | null = null;
    let activeTrack: Track | null = null;

    for (const track of project.timeline) {
      for (const clip of track.clips) {
        if (
          clip.mediaType === 'video' &&
          playheadTime >= clip.startTime &&
          playheadTime <= clip.startTime + clip.duration
        ) {
          activeClip = clip;
          activeTrack = track;
          break;
        }
      }
      if (activeClip) break;
    }

    // If no active clip found, use the first video clip (likely narrator video)
    if (!activeClip) {
      for (const track of project.timeline) {
        const videoClip = track.clips.find((c) => c.mediaType === 'video');
        if (videoClip) {
          activeClip = videoClip;
          activeTrack = track;
          break;
        }
      }
    }

    if (activeClip && activeTrack) {
      const effectiveMuted = audioEditing.getEffectiveMuted(activeClip, activeTrack);
      let effectiveVolume = audioEditing.getEffectiveVolume(activeClip, activeTrack);

      // Handle fade in/out (this needs to update on every playhead change)
      if (activeClip.properties.fadeIn || activeClip.properties.fadeOut) {
        const clipRelativeTime = playheadTime - activeClip.startTime;
        const fadeIn = activeClip.properties.fadeIn ?? 0;
        const fadeOut = activeClip.properties.fadeOut ?? 0;
        const clipDuration = activeClip.duration;

        // Clamp clipRelativeTime to valid range
        const clampedRelativeTime = Math.max(0, Math.min(clipDuration, clipRelativeTime));

        // Check if we're in fade-out period first (fade-out takes precedence if overlapping)
        const fadeOutStart = clipDuration - fadeOut;
        if (fadeOut > 0 && clampedRelativeTime > fadeOutStart) {
          const fadeOutProgress = (clipDuration - clampedRelativeTime) / fadeOut;
          effectiveVolume = effectiveVolume * fadeOutProgress;
        }
        // Otherwise, check fade-in (only if not in fade-out period)
        else if (fadeIn > 0 && clampedRelativeTime < fadeIn) {
          effectiveVolume = effectiveVolume * (clampedRelativeTime / fadeIn);
        }

        // If before clip start or after clip end, volume should be 0
        if (clipRelativeTime < 0 || clipRelativeTime > clipDuration) {
          effectiveVolume = 0;
        }
      }

      const finalVolume = Math.max(0, Math.min(1, effectiveVolume));
      const shouldLoop = activeClip.mediaType === 'audio' && activeClip.properties.loop === true;

      // Only update if values have changed
      const lastProps = lastAudioPropsRef.current;
      if (
        !lastProps ||
        lastProps.muted !== effectiveMuted ||
        Math.abs(lastProps.volume - finalVolume) > 0.01 ||
        lastProps.loop !== shouldLoop
      ) {
        video.muted = effectiveMuted;
        video.volume = finalVolume;
        video.loop = shouldLoop;
        
        lastAudioPropsRef.current = {
          muted: effectiveMuted,
          volume: finalVolume,
          loop: shouldLoop,
        };
      }
    } else {
      // Default: unmuted, full volume, no loop
      const defaultMuted = false;
      const defaultVolume = 1;
      const defaultLoop = false;

      const lastProps = lastAudioPropsRef.current;
      if (
        !lastProps ||
        lastProps.muted !== defaultMuted ||
        Math.abs(lastProps.volume - defaultVolume) > 0.01 ||
        lastProps.loop !== defaultLoop
      ) {
        video.muted = defaultMuted;
        video.volume = defaultVolume;
        video.loop = defaultLoop;
        
        lastAudioPropsRef.current = {
          muted: defaultMuted,
          volume: defaultVolume,
          loop: defaultLoop,
        };
      }
    }
  }, [project, playheadTime, videoReady, narratorVideoUrl, audioEditing]);

  // Load and sync all video overlay clips to playhead time
  useEffect(() => {
    overlayVideoClips.forEach(({ clip, track }) => {
      const videoEl = videoRefsMap.current.get(clip.id);
      if (!videoEl) return;

      const isActive = playheadTime >= clip.startTime && playheadTime <= clip.startTime + clip.duration;
      
      // Only process if clip is active
      if (!isActive) {
        // Pause and hide inactive clips
        if (!videoEl.paused) {
          videoEl.pause();
        }
        return;
      }

      // Normalize and set source if needed
      const normalizedUrl = HelperFunctions.normalizeGoogleDriveUrl(clip.mediaId);
      const finalUrl = normalizedUrl.startsWith('/api/') 
        ? `${window.location.origin}${normalizedUrl}` 
        : normalizedUrl;
      
      // Set source if it's different
      if (videoEl.src !== finalUrl && videoEl.src !== window.location.origin + finalUrl) {
        videoEl.src = finalUrl;
        videoEl.load();
      }

      // Set crossOrigin if needed
      if (finalUrl.includes('drive.google.com') && !finalUrl.includes('/api/')) {
        videoEl.crossOrigin = 'anonymous';
      }

      const clipPlaybackTime = getClipPlaybackTime(clip, playheadTime);
      const timeDiff = Math.abs(videoEl.currentTime - clipPlaybackTime);
      
      // Wait for video to be ready before syncing
      const handleCanPlay = () => {
        if (videoEl.readyState >= 2) { // HAVE_CURRENT_DATA
          if (timeDiff > 0.1 && !isPlaying) {
            // Sync when paused (user scrubbing)
            videoEl.currentTime = clipPlaybackTime;
          } else if (isPlaying && (videoEl.paused || videoEl.ended)) {
            // Sync when starting playback
            videoEl.currentTime = clipPlaybackTime;
          }
        }
      };

      if (videoEl.readyState >= 2) {
        handleCanPlay();
      } else {
        videoEl.addEventListener('canplay', handleCanPlay, { once: true });
        return () => {
          videoEl.removeEventListener('canplay', handleCanPlay);
        };
      }
    });
  }, [playheadTime, videoReady, isPlaying, overlayVideoClips]);

  // Handle play/pause for all video overlay clips
  useEffect(() => {
    overlayVideoClips.forEach(({ clip, track }) => {
      const videoEl = videoRefsMap.current.get(clip.id);
      if (!videoEl) return;

      const isActive = playheadTime >= clip.startTime && playheadTime <= clip.startTime + clip.duration;
      
      // Only play if clip is active
      if (!isActive) {
        if (!videoEl.paused) {
          videoEl.pause();
        }
        return;
      }

      // Wait for video to be ready
      if (videoEl.readyState < 2) {
        const handleCanPlay = () => {
          if (isPlaying) {
            const clipPlaybackTime = getClipPlaybackTime(clip, playheadTime);
            if (videoEl.paused || videoEl.ended) {
              videoEl.currentTime = clipPlaybackTime;
            }
            videoEl.play().catch((error) => {
              console.error(`Error playing overlay video ${clip.id}:`, error);
            });
          } else {
            videoEl.pause();
          }
        };
        videoEl.addEventListener('canplay', handleCanPlay, { once: true });
        return;
      }

      if (isPlaying) {
        if (videoEl.paused || videoEl.ended) {
          const clipPlaybackTime = getClipPlaybackTime(clip, playheadTime);
          videoEl.currentTime = clipPlaybackTime;
        }
        videoEl.play().catch((error) => {
          console.error(`Error playing overlay video ${clip.id}:`, error);
        });
      } else {
        videoEl.pause();
      }
    });
  }, [isPlaying, videoReady, playheadTime, overlayVideoClips]);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Paper
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black',
          position: 'relative',
        }}
      >
        {(narratorVideoUrl || activeClips.video.length > 0 || baseVideo.clip || activeClips.image.length > 0 || activeClips.text.length > 0) ? (
          <>
            {videoLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                }}
              >
                <CircularProgress color="primary" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Loading video...
                </Typography>
              </Box>
            )}

            {videoError && (
              <Alert 
                severity="error" 
                sx={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 2 }}
                onClose={() => setVideoError(null)}
              >
                {videoError}
                {narratorVideoUrl && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    URL: {narratorVideoUrl.substring(0, 100)}...
                  </Typography>
                )}
              </Alert>
            )}

            <Box
              ref={previewContainerRef}
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: videoReady ? 'block' : 'none',
              }}
            >
              {/* Base Video Layer - Narrator or first timeline video clip */}
              {baseVideo.clip || baseVideo.narratorUrl || narratorVideoUrl ? (
                <Box
                  component="video"
                  ref={videoRef}
                  key={baseVideo.clip?.id || 'narrator-base'}
                  src={baseVideo.clip?.mediaId || baseVideo.narratorUrl || narratorVideoUrl || ''}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    zIndex: 0,
                  }}
                  controls={false}
                  muted={false}
                  playsInline
                  preload="metadata"
                  loop={false}
                />
              ) : null}

              {/* Video Overlay Layers */}
              {overlayVideoClips.map(({ clip, track }, index) => {
                const opacity = calculateClipOpacity(clip, playheadTime);
                const clipPlaybackTime = getClipPlaybackTime(clip, playheadTime);
                const trackIndex = project.timeline.findIndex(t => t.id === track.id);
                const isActive = playheadTime >= clip.startTime && playheadTime <= clip.startTime + clip.duration;
                
                // Normalize Google Drive URL if needed
                const normalizedUrl = HelperFunctions.normalizeGoogleDriveUrl(clip.mediaId);
                const finalUrl = normalizedUrl.startsWith('/api/') 
                  ? `${window.location.origin}${normalizedUrl}` 
                  : normalizedUrl;
                
                return (
                  <Box
                    key={`video-overlay-${clip.id}`}
                    component="video"
                    ref={registerVideoRef(clip.id)}
                    src={finalUrl}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: opacity,
                      zIndex: 1 + trackIndex,
                      pointerEvents: 'none',
                    }}
                    controls={false}
                    muted={track.muted || clip.properties.muted}
                    playsInline
                    preload="auto"
                    loop={false}
                    crossOrigin={finalUrl.includes('drive.google.com') && !finalUrl.includes('/api/') ? 'anonymous' : undefined}
                    style={{ 
                      display: isActive && opacity > 0 ? 'block' : 'none',
                      ...(clip.position && {
                        width: 'auto',
                        height: 'auto',
                        left: `${clip.position.x}%`,
                        top: `${clip.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                      })
                    }}
                  />
                );
              })}

              {/* Image Overlay Layers */}
              {activeClips.image.map(({ clip, track }, index) => {
                const opacity = calculateClipOpacity(clip, playheadTime);
                const trackIndex = project.timeline.findIndex(t => t.id === track.id);
                const position = clip.position || { x: 50, y: 50 };
                
                return (
                  <Box
                    key={`image-overlay-${clip.id}`}
                    component="img"
                    src={clip.mediaId}
                    alt={clip.mediaId}
                    sx={{
                      position: 'absolute',
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      opacity: opacity,
                      zIndex: 500 + trackIndex,
                      pointerEvents: 'none',
                      objectFit: 'contain',
                    }}
                    style={{ 
                      display: opacity > 0 ? 'block' : 'none',
                    }}
                  />
                );
              })}
              
              {/* Text Overlays */}
              {activeTextClips.map((textClip) => {
                const opacity = calculateTextOpacity(textClip, playheadTime);
                const containerWidth = previewContainerRef.current?.clientWidth || 0;
                const containerHeight = previewContainerRef.current?.clientHeight || 0;
                const position = positionToPixels(
                  textClip.position || { x: 50, y: 50 },
                  containerWidth,
                  containerHeight
                );
                const textAlign = getTextAlign(textClip.properties.alignment);
                const isDragging = draggingTextClip?.id === textClip.id;
                // Use drag offset for visual feedback during drag, otherwise use clip position
                const displayPosition = isDragging && dragOffset ? dragOffset : (textClip.position || { x: 50, y: 50 });
                
                return (
                  <Box
                    key={textClip.id}
                    onMouseDown={(e) => handleTextDragStart(e, textClip)}
                    sx={{
                      position: 'absolute',
                      left: `${displayPosition.x}%`,
                      top: `${displayPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: textClip.properties.fontColor || '#FFFFFF',
                      fontSize: `${textClip.properties.fontSize || 48}px`,
                      fontWeight: 600,
                      textAlign: textAlign,
                      opacity: opacity,
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                      pointerEvents: onProjectUpdate ? 'auto' : 'none',
                      cursor: onProjectUpdate ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      maxWidth: '90%',
                      zIndex: 10,
                      userSelect: 'none',
                      transition: isDragging ? 'none' : 'left 0.1s, top 0.1s',
                      '&:hover': onProjectUpdate ? {
                        outline: '2px dashed rgba(255, 255, 255, 0.5)',
                        outlineOffset: '4px',
                      } : {},
                    }}
                  >
                    {textClip.properties.text || ''}
                  </Box>
                );
              })}
            </Box>

            {!videoReady && !videoLoading && !videoError && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">Video not available</Typography>
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: 'text.secondary',
            }}
          >
            <Typography variant="h6">Preview Area</Typography>
            <Typography variant="body2">
              {isPlaying ? 'Playing' : 'Paused'} - {playheadTime.toFixed(2)}s
            </Typography>
            <Typography variant="caption" color="text.secondary">
              No narrator video available
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PreviewArea;

