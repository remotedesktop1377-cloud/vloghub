import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Download,
  Eye,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface MediaPlayerProps {
  src: string;
  type: 'video' | 'image' | 'audio';
  title?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  thumbnail?: string;
}

export function MediaPlayer({
  src,
  type,
  title,
  className = "",
  autoPlay = false,
  controls = true,
  thumbnail
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const handleEnded = () => setIsPlaying(false);

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const media = mediaRef.current;
    if (!media) return;

    media.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSeek = (newTime: number) => {
    const media = mediaRef.current;
    if (!media) return;

    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Video Player
  if (type === 'video') {
    return (
      <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          poster={thumbnail}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {controls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-white text-sm mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div
                className="w-full bg-white/20 rounded-full h-1 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
              >
                <div
                  className="bg-blue-400 h-1 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/20 rounded-full appearance-none slider"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {title && (
          <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm">
            {title}
          </div>
        )}
      </div>
    );
  }

  // Audio Player
  if (type === 'audio') {
    return (
      <div className={`bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 border border-white/10 ${className}`}>
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {title && (
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-400" />
            {title}
          </h4>
        )}

        {controls && (
          <div className="space-y-3">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-white text-sm mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div
                className="w-full bg-white/20 rounded-full h-2 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
              >
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                >
                  <SkipBack className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                >
                  <SkipForward className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Image Viewer
  if (type === 'image') {
    return (
      <>
        <div className={`relative bg-slate-800 rounded-lg overflow-hidden cursor-pointer ${className}`}>
          <img
            src={src}
            alt={title || 'Image'}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onClick={() => setShowImageViewer(true)}
          />

          {controls && (
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => setShowImageViewer(true)}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <Eye className="w-6 h-6 text-white" />
              </button>
            </div>
          )}

          {title && (
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm">
              {title}
            </div>
          )}
        </div>

        {/* Full Image Viewer Modal */}
        {showImageViewer && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-full">
              <img
                src={src}
                alt={title || 'Image'}
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{ transform: `scale(${imageZoom})` }}
              />

              {/* Image Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setImageZoom(prev => Math.min(3, prev + 0.5))}
                  className="p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.5))}
                  className="p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setShowImageViewer(false)}
                  className="p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                >
                  <Eye className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Download Button */}
              <div className="absolute bottom-4 right-4">
                <a
                  href={src}
                  download={title || 'image'}
                  className="flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/80 rounded-lg text-white text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>

              {title && (
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm">
                  {title}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}