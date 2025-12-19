import React, { useState } from 'react';
import { 
  Play, 
  Download, 
  Settings, 
  Clock, 
  Monitor, 
  Volume2,
  Cpu,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink
} from 'lucide-react';

interface RenderSettings {
  resolution: string;
  fps: number;
  quality: string;
  format: string;
  audioQuality: string;
  includeSubtitles: boolean;
}

interface RenderPanelProps {
  totalScenes: number;
  modifiedScenes: number;
  onStartRender: (settings: RenderSettings) => void;
}

export function RenderPanel({ totalScenes, modifiedScenes, onStartRender }: RenderPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    resolution: '1920x1080',
    fps: 30,
    quality: 'high',
    format: 'mp4',
    audioQuality: '48kHz',
    includeSubtitles: false
  });

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderStatus('processing');
    setRenderProgress(0);

    try {
      // Simulate render progress
      const progressInterval = setInterval(() => {
        setRenderProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setRenderStatus('completed');
            setIsRendering(false);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Call the actual render function
      await onStartRender(renderSettings);
      
    } catch (error) {
      setRenderStatus('error');
      setIsRendering(false);
      console.log('Render failed:', error);
    }
  };

  const estimatedRenderTime = Math.ceil((totalScenes * 2.5) + (modifiedScenes * 1.5));

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-400/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Play className="w-5 h-5 text-green-400" />
          Final Render
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Render Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{totalScenes}</div>
          <div className="text-gray-400 text-sm">Total Scenes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">{modifiedScenes}</div>
          <div className="text-gray-400 text-sm">Modified</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">~{estimatedRenderTime}m</div>
          <div className="text-gray-400 text-sm">Est. Time</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${
            renderStatus === 'completed' ? 'text-green-400' :
            renderStatus === 'error' ? 'text-red-400' :
            renderStatus === 'processing' ? 'text-blue-400' :
            'text-gray-400'
          }`}>
            {renderStatus === 'completed' ? '✓' :
             renderStatus === 'error' ? '✗' :
             renderStatus === 'processing' ? '⟳' : '○'}
          </div>
          <div className="text-gray-400 text-sm capitalize">{renderStatus}</div>
        </div>
      </div>

      {/* Render Progress */}
      {isRendering && (
        <div className="mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-400 font-medium">Rendering Video...</span>
            <span className="text-blue-400 text-sm">{Math.round(renderProgress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${renderProgress}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
            <Loader className="w-4 h-4 animate-spin" />
            Processing scenes and applying effects...
          </div>
        </div>
      )}

      {/* Render Completed */}
      {renderStatus === 'completed' && (
        <div className="mb-6 p-4 bg-green-500/10 rounded-lg border border-green-400/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Render Completed!</span>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg border border-green-400/30 text-green-400 text-sm transition-colors">
              <Download className="w-4 h-4" />
              Download Video
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 text-blue-400 text-sm transition-colors">
              <ExternalLink className="w-4 h-4" />
              View Online
            </button>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {isExpanded && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-4">Render Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Resolution</label>
              <select
                value={renderSettings.resolution}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, resolution: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-green-400 focus:outline-none"
              >
                <option value="1920x1080" className="bg-slate-800">1080p (1920x1080)</option>
                <option value="1280x720" className="bg-slate-800">720p (1280x720)</option>
                <option value="3840x2160" className="bg-slate-800">4K (3840x2160)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Frame Rate</label>
              <select
                value={renderSettings.fps}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-green-400 focus:outline-none"
              >
                <option value={24} className="bg-slate-800">24 fps</option>
                <option value={30} className="bg-slate-800">30 fps</option>
                <option value={60} className="bg-slate-800">60 fps</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Quality</label>
              <select
                value={renderSettings.quality}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, quality: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-green-400 focus:outline-none"
              >
                <option value="low" className="bg-slate-800">Low (Fast)</option>
                <option value="medium" className="bg-slate-800">Medium</option>
                <option value="high" className="bg-slate-800">High (Slow)</option>
                <option value="ultra" className="bg-slate-800">Ultra (Very Slow)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Format</label>
              <select
                value={renderSettings.format}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, format: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-green-400 focus:outline-none"
              >
                <option value="mp4" className="bg-slate-800">MP4</option>
                <option value="mov" className="bg-slate-800">MOV</option>
                <option value="avi" className="bg-slate-800">AVI</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={renderSettings.includeSubtitles}
                onChange={(e) => setRenderSettings(prev => ({ ...prev, includeSubtitles: e.target.checked }))}
                className="rounded border-white/20 bg-white/10 text-green-400 focus:ring-green-400"
              />
              Include subtitles/captions
            </label>
          </div>
        </div>
      )}

      {/* Main Render Button */}
      <button
        onClick={handleStartRender}
        disabled={isRendering || totalScenes === 0}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 disabled:from-gray-500 disabled:to-gray-600 disabled:text-gray-400 rounded-lg text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 hover:shadow-2xl hover:shadow-green-500/25"
      >
        {isRendering ? (
          <>
            <Loader className="w-6 h-6 animate-spin" />
            Rendering Video...
          </>
        ) : (
          <>
            <Play className="w-6 h-6" />
            Start Final Render
          </>
        )}
      </button>

      {/* Render Info */}
      <div className="mt-4 text-center text-sm text-gray-400">
        This will process all {totalScenes} scenes and generate the final video
      </div>
    </div>
  );
}