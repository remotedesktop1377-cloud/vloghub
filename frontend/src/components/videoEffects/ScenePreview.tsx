import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  Eye,
  Settings,
  Film,
  Image as ImageIcon,
  Zap,
  Palette
} from 'lucide-react';
import { MediaPlayer } from './MediaPlayer';

interface ScenePreviewProps {
  sceneData: {
    title: string;
    duration: number;
    narration: string;
    clips: any[];
    logos: any[];
    transition: string;
    effects: string[];
    backgroundMusic?: {
      id: string;
      selectedMusic: string;
      volume: number;
      autoAdjust: boolean;
      fadeIn: boolean;
      fadeOut: boolean;
    };
  };
  isVisible: boolean;
  onClose: () => void;
}

export function ScenePreview({ sceneData, isVisible, onClose }: ScenePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Film className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">{sceneData.title}</h2>
              <p className="text-gray-400 text-sm">Scene Preview - {sceneData.duration}s</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 p-6">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <div className="aspect-video relative">
                {sceneData.clips.length > 0 ? (
                  <MediaPlayer
                    src={sceneData.clips[0].url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                    type="video"
                    title={sceneData.title}
                    className="w-full h-full"
                    thumbnail={sceneData.clips[0].thumbnail}
                  />
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-900 relative flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Play className="w-8 h-8 text-blue-400 ml-1" />
                      </div>
                      <p className="text-gray-400 text-sm">Scene Preview</p>
                      <p className="text-gray-500 text-xs mt-1">
                        No clips added yet
                      </p>
                    </div>
                  </div>
                )}

                {/* Logo overlays preview */}
                {sceneData.logos.map((logo, index) => (
                  <div
                    key={index}
                    className={`absolute w-16 h-16 rounded-lg overflow-hidden ${
                      logo.position === 'top-left' ? 'top-4 left-4' :
                      logo.position === 'top-right' ? 'top-4 right-4' :
                      logo.position === 'bottom-left' ? 'bottom-4 left-4' :
                      logo.position === 'bottom-right' ? 'bottom-4 right-4' :
                      'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                    }`}
                  >
                    {logo.url ? (
                      <MediaPlayer
                        src={logo.url}
                        type="image"
                        title={logo.name}
                        className="w-full h-full"
                        controls={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Effects overlay */}
                {sceneData.effects.length > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
                )}
              </div>
            </div>

            {/* Video Controls */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg border border-green-400/30 text-green-400 text-sm transition-colors">
                  <Download className="w-4 h-4" />
                  Export Scene
                </button>
                <button className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 text-blue-400 text-sm transition-colors">
                  <Settings className="w-4 h-4" />
                  Render Settings
                </button>
              </div>
            </div>
          </div>

          {/* Background Music */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-orange-400" />
              Background Music
            </h3>
            {sceneData.backgroundMusic?.selectedMusic ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/10">
                  <div className="w-8 h-8 bg-orange-500/20 rounded flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {sceneData.backgroundMusic.selectedMusic || 'Background Music'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Volume: {Math.round((sceneData.backgroundMusic.volume || 0.3) * 100)}%
                      {sceneData.backgroundMusic.autoAdjust && ' • Auto-adjusted'}
                    </div>
                  </div>
                </div>
                
                {/* Music Player */}
                <MediaPlayer
                  src={sceneData.backgroundMusic.selectedMusic || ''}
                  type="audio"
                  title={sceneData.backgroundMusic.selectedMusic}
                  className="w-full"
                />
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No background music</p>
            )}
          </div>
          {/* Scene Details */}
          <div className="space-y-4">
            {/* Clips */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Film className="w-4 h-4 text-blue-400" />
                Video Clips ({sceneData.clips.length})
              </h3>
              {sceneData.clips.length > 0 ? (
                <div className="space-y-2">
                  {sceneData.clips.map((clip, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/10">
                      <div className="w-8 h-8 rounded overflow-hidden">
                        <MediaPlayer
                          src={clip.url}
                          type="video"
                          className="w-full h-full"
                          controls={false}
                          thumbnail={clip.thumbnail}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{clip.name}</div>
                        <div className="text-gray-400 text-xs">{clip.duration}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No clips added</p>
              )}
            </div>

            {/* Logos */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-green-400" />
                Logo Overlays ({sceneData.logos.length})
              </h3>
              {sceneData.logos.length > 0 ? (
                <div className="space-y-2">
                  {sceneData.logos.map((logo, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/10">
                      <div className="w-8 h-8 rounded overflow-hidden">
                        <MediaPlayer
                          src={logo.url}
                          type="image"
                          className="w-full h-full"
                          controls={false}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{logo.name}</div>
                        <div className="text-gray-400 text-xs capitalize">{logo.position.replace('-', ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No logos added</p>
              )}
            </div>

            {/* Transition */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Transition Effect
              </h3>
              <div className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/10">
                <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-white text-sm font-medium">
                  {sceneData.transition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            </div>

            {/* Effects */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-yellow-400" />
                Applied Effects ({sceneData.effects.length})
              </h3>
              {sceneData.effects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sceneData.effects.map((effect, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-400/30"
                    >
                      {effect.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No effects applied</p>
              )}
            </div>

            {/* Narration */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3">Narration Script</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {sceneData.narration}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}