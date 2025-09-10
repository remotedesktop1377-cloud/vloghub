import React, { useState } from 'react';
import { 
  Edit3, 
  Save, 
  X, 
  Upload, 
  Play, 
  Clock, 
  Image, 
  Wand2,
  Settings,
  ChevronDown,
  Trash2,
  Plus,
  Eye,
  Volume2
} from 'lucide-react';
import { ScenePreview } from './ScenePreview';
import { MediaPlayer } from './MediaPlayer';

interface Clip {
  id: string;
  name: string;
  url: string;
  duration: number;
  thumbnail?: string;
}

interface Logo {
  id: string;
  name: string;
  url: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

interface BackgroundMusic {
  id: string;
  selectedMusic: string;
  volume: number;
  autoAdjust: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
}

interface SegmentData {
  title: string;
  duration: number;
  narration: string;
  clips: Clip[];
  logos: Logo[];
  transition: string;
  effects: string[];
  backgroundMusic?: BackgroundMusic;
}

interface EditableSegmentCardProps {
  title: string;
  duration: number;
  narration: string;
  index: number;
  initialData?: SegmentData;
  onSave: (data: SegmentData) => void;
}

const predefinedTransitions = [
  'quantum_dissolve',
  'particle_burst', 
  'quantum_tunnel',
  'digital_matrix',
  'data_stream',
  'holographic_dissolve',
  'reality_shift',
  'quantum_fade_to_black'
];

const predefinedEffects = [
  'chroma_key',
  'background_blur',
  'color_grade_blue',
  'particle_trails',
  'glow',
  'contrast_boost',
  'sepia_tone',
  'vignette',
  'lens_flare',
  'desaturate_50',
  'border_highlight'
];

const preStoredMusic = [
  { id: 'ambient_1', name: 'Ethereal Ambience', genre: 'Ambient', url: '/music/ambient_1.mp3' },
  { id: 'corporate_1', name: 'Corporate Success', genre: 'Corporate', url: '/music/corporate_1.mp3' },
  { id: 'tech_1', name: 'Digital Future', genre: 'Tech', url: '/music/tech_1.mp3' },
  { id: 'cinematic_1', name: 'Epic Journey', genre: 'Cinematic', url: '/music/cinematic_1.mp3' },
  { id: 'upbeat_1', name: 'Positive Energy', genre: 'Upbeat', url: '/music/upbeat_1.mp3' },
  { id: 'minimal_1', name: 'Clean Minimal', genre: 'Minimal', url: '/music/minimal_1.mp3' }
];

export function EditableSegmentCard({ title, duration, narration, index, initialData, onSave }: EditableSegmentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showScenePreview, setShowScenePreview] = useState(false);
  const [editData, setEditData] = useState<SegmentData>(
    initialData || {
      title,
      duration,
      narration,
      clips: [],
      logos: [],
      transition: 'quantum_dissolve',
      effects: []
    }
  );

  // Update editData when initialData changes (from bulk operations)
  React.useEffect(() => {
    if (initialData) {
      setEditData(initialData);
      setShowPreview(true); // Show that the scene has been modified
    }
  }, [initialData]);

  const colors = [
    'from-cyan-500/20 to-blue-500/20 border-cyan-400/30',
    'from-blue-500/20 to-purple-500/20 border-blue-400/30',
    'from-purple-500/20 to-pink-500/20 border-purple-400/30',
    'from-pink-500/20 to-red-500/20 border-pink-400/30',
    'from-red-500/20 to-orange-500/20 border-red-400/30',
    'from-orange-500/20 to-yellow-500/20 border-orange-400/30',
    'from-yellow-500/20 to-green-500/20 border-yellow-400/30',
  ];

  const colorClass = colors[index % colors.length];

  // Update editData when props change (for bulk operations)
  React.useEffect(() => {
    // This will be called when bulk operations update the scene data
    // We need to get the updated data from the parent component
  }, []);

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
    setShowPreview(true);
    // Auto-show scene preview after saving
    setTimeout(() => setShowScenePreview(true), 300);
  };

  const handleCancel = () => {
    setEditData({
      title,
      duration,
      narration,
      clips: [],
      logos: [],
      transition: 'quantum_dissolve',
      effects: []
    });
    setIsEditing(false);
  };

  const addClip = () => {
    const newClip: Clip = {
      id: Date.now().toString(),
      name: '',
      url: '',
      duration: 30
    };
    setEditData(prev => ({
      ...prev,
      clips: [...prev.clips, newClip]
    }));
  };

  const updateClip = (id: string, field: keyof Clip, value: string | number) => {
    setEditData(prev => ({
      ...prev,
      clips: prev.clips.map(clip => 
        clip.id === id ? { ...clip, [field]: value } : clip
      )
    }));
  };

  const removeClip = (id: string) => {
    setEditData(prev => ({
      ...prev,
      clips: prev.clips.filter(clip => clip.id !== id)
    }));
  };

  const addLogo = () => {
    const newLogo: Logo = {
      id: Date.now().toString(),
      name: 'New Logo',
      url: '',
      position: 'top-right'
    };
    setEditData(prev => ({
      ...prev,
      logos: [...prev.logos, newLogo]
    }));
  };

  const updateLogo = (id: string, field: keyof Logo, value: string) => {
    setEditData(prev => ({
      ...prev,
      logos: prev.logos.map(logo => 
        logo.id === id ? { ...logo, [field]: value } : logo
      )
    }));
  };

  const removeLogo = (id: string) => {
    setEditData(prev => ({
      ...prev,
      logos: prev.logos.filter(logo => logo.id !== id)
    }));
  };

  const toggleEffect = (effect: string) => {
    setEditData(prev => ({
      ...prev,
      effects: prev.effects.includes(effect)
        ? prev.effects.filter(e => e !== effect)
        : [...prev.effects, effect]
    }));
  };

  if (!isEditing) {
    return (
      <>
        <div className={`group bg-gradient-to-br ${colorClass} backdrop-blur-sm rounded-xl p-6 border relative ${
          showPreview ? 'ring-2 ring-green-400/50' : ''
        }`}>
          {showPreview && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-400/30">
              Modified
            </div>
          )}
          
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-12 p-2 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20"
          >
            <Edit3 className="w-4 h-4 text-white" />
          </button>
          
          {showPreview && (
            <button
              onClick={() => setShowScenePreview(true)}
              className="absolute top-4 right-4 p-2 bg-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-500/30 border border-blue-400/30"
            >
              <Eye className="w-4 h-4 text-blue-400" />
            </button>
          )}

          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold text-white">
                {title}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">{duration} seconds</span>
          </div>
          
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
            {narration}
          </p>
          
          {/* Show applied customizations */}
          {showPreview && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex flex-wrap gap-2">
                {editData.clips.length > 0 && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-400/30">
                    <Play className="w-3 h-3 inline mr-1" />
                    {editData.clips.length} clips
                  </span>
                )}
                {editData.logos.length > 0 && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-400/30">
                    <Image className="w-3 h-3 inline mr-1" />
                    {editData.logos.length} logos
                  </span>
                )}
                {editData.effects.length > 0 && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-400/30">
                    <Wand2 className="w-3 h-3 inline mr-1" />
                    {editData.effects.length} effects
                  </span>
                )}
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-400/30">
                  <Play className="w-3 h-3 inline mr-1" />
                  {editData.transition.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Scene Preview Modal */}
        {showScenePreview && showPreview && (
          <ScenePreview
            sceneData={editData}
            isVisible={showScenePreview}
            onClose={() => setShowScenePreview(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${colorClass} backdrop-blur-sm rounded-xl p-6 border`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Edit Segment {index + 1}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg border border-green-400/30 transition-colors"
          >
            <Save className="w-4 h-4 text-green-400" />
          </button>
          <button
            onClick={handleCancel}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-400/30 transition-colors"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Duration (seconds)</label>
          <input
            type="number"
            value={editData.duration}
            onChange={(e) => setEditData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Narration</label>
          <textarea
            value={editData.narration}
            onChange={(e) => setEditData(prev => ({ ...prev, narration: e.target.value }))}
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Video Clips Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-cyan-400" />
            Video Clips
          </h4>
          <button
            onClick={addClip}
            className="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg border border-cyan-400/30 text-cyan-400 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Clip
          </button>
        </div>

        <div className="space-y-3">
          {editData.clips.map((clip) => (
            <div key={clip.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Clip Name</label>
                  <input
                    type="text"
                    value={clip.name}
                    onChange={(e) => updateClip(clip.id, 'name', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">URL or File</label>
                  <input
                    type="text"
                    value={clip.url}
                    onChange={(e) => updateClip(clip.id, 'url', e.target.value)}
                    placeholder="https://... or upload file"
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Duration (s)</label>
                    <input
                      type="number"
                      value={clip.duration}
                      onChange={(e) => updateClip(clip.id, 'duration', parseInt(e.target.value) || 0)}
                      className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => removeClip(clip.id)}
                    className="mt-5 p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Video Preview */}
              {clip.url && (
                <div className="mt-3">
                  <MediaPlayer
                    src={clip.url}
                    type="video"
                    title={clip.name}
                    className="w-full h-32 rounded-lg"
                    thumbnail={clip.thumbnail}
                  />
                </div>
              )}
              
              <div className="mt-3 flex gap-2">
                <button className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 text-xs transition-colors">
                  <Upload className="w-3 h-3" />
                  Upload File
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logos Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-400" />
            Logo Overlays
          </h4>
          <button
            onClick={addLogo}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 text-blue-400 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Logo
          </button>
        </div>

        <div className="space-y-3">
          {editData.logos.map((logo) => (
            <div key={logo.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Logo Name</label>
                  <input
                    type="text"
                    value={logo.name}
                    onChange={(e) => updateLogo(logo.id, 'name', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={logo.url}
                    onChange={(e) => updateLogo(logo.id, 'url', e.target.value)}
                    placeholder="https://... or upload"
                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Position</label>
                    <select
                      value={logo.position}
                      onChange={(e) => updateLogo(logo.id, 'position', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-blue-400 focus:outline-none"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeLogo(logo.id)}
                    className="mt-5 p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Logo Preview */}
              {logo.url && (
                <div className="mt-3">
                  <MediaPlayer
                    src={logo.url}
                    type="image"
                    title={logo.name}
                    className="w-full h-20 rounded-lg"
                  />
                </div>
              )}
              
              <div className="mt-3">
                <button className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 text-xs transition-colors">
                  <Upload className="w-3 h-3" />
                  Upload Logo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Music Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-orange-400" />
            Background Music
          </h4>
          {!editData.backgroundMusic ? (
            <button
              onClick={() => setEditData(prev => ({ 
                ...prev, 
                backgroundMusic: { 
                  id: Date.now().toString(),
                  selectedMusic: '',
                  volume: 0.3,
                  autoAdjust: true,
                  fadeIn: true,
                  fadeOut: true
                }
              }))}
              className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg border border-orange-400/30 text-orange-400 text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Music
            </button>
          ) : (
            <button
              onClick={() => setEditData(prev => ({ ...prev, backgroundMusic: undefined }))}
              className="flex items-center gap-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-400/30 text-red-400 text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove Music
            </button>
          )}
        </div>

        {editData.backgroundMusic && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Select Licensed Music</label>
              <select
                value={editData.backgroundMusic.selectedMusic || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  backgroundMusic: { 
                    id: prev.backgroundMusic?.id || Date.now().toString(),
                    selectedMusic: e.target.value,
                    volume: prev.backgroundMusic?.volume || 0.3,
                    autoAdjust: prev.backgroundMusic?.autoAdjust !== false,
                    fadeIn: prev.backgroundMusic?.fadeIn !== false,
                    fadeOut: prev.backgroundMusic?.fadeOut !== false
                  }
                }))}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:border-orange-400 focus:outline-none"
              >
                <option value="" className="bg-slate-800">Select background music...</option>
                {preStoredMusic.map((music) => (
                  <option key={music.id} value={music.id} className="bg-slate-800">
                    {music.name} - {music.genre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Volume ({Math.round((editData.backgroundMusic.volume || 0.3) * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={editData.backgroundMusic.volume || 0.3}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  backgroundMusic: { 
                    id: prev.backgroundMusic?.id || Date.now().toString(),
                    selectedMusic: prev.backgroundMusic?.selectedMusic || '',
                    volume: parseFloat(e.target.value),
                    autoAdjust: prev.backgroundMusic?.autoAdjust !== false,
                    fadeIn: prev.backgroundMusic?.fadeIn !== false,
                    fadeOut: prev.backgroundMusic?.fadeOut !== false
                  }
                }))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none slider"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={editData.backgroundMusic.autoAdjust !== false}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    backgroundMusic: { 
                      id: prev.backgroundMusic?.id || Date.now().toString(),
                      selectedMusic: prev.backgroundMusic?.selectedMusic || '',
                      volume: prev.backgroundMusic?.volume || 0.3,
                      autoAdjust: e.target.checked,
                      fadeIn: prev.backgroundMusic?.fadeIn !== false,
                      fadeOut: prev.backgroundMusic?.fadeOut !== false
                    }
                  }))}
                  className="rounded border-white/20 bg-white/10 text-orange-400 focus:ring-orange-400"
                />
                Auto-adjust volume for vocals
              </label>
              
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={editData.backgroundMusic.fadeIn !== false}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    backgroundMusic: { 
                      id: prev.backgroundMusic?.id || Date.now().toString(),
                      selectedMusic: prev.backgroundMusic?.selectedMusic || '',
                      volume: prev.backgroundMusic?.volume || 0.3,
                      autoAdjust: prev.backgroundMusic?.autoAdjust !== false,
                      fadeIn: e.target.checked,
                      fadeOut: prev.backgroundMusic?.fadeOut !== false
                    }
                  }))}
                  className="rounded border-white/20 bg-white/10 text-orange-400 focus:ring-orange-400"
                />
                Fade in
              </label>
              
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={editData.backgroundMusic.fadeOut !== false}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    backgroundMusic: { 
                      id: prev.backgroundMusic?.id || Date.now().toString(),
                      selectedMusic: prev.backgroundMusic?.selectedMusic || '',
                      volume: prev.backgroundMusic?.volume || 0.3,
                      autoAdjust: prev.backgroundMusic?.autoAdjust !== false,
                      fadeIn: prev.backgroundMusic?.fadeIn !== false,
                      fadeOut: e.target.checked
                    }
                  }))}
                  className="rounded border-white/20 bg-white/10 text-orange-400 focus:ring-orange-400"
                />
                Fade out
              </label>
            </div>

            {/* Music Preview */}
            {editData.backgroundMusic.selectedMusic && (
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-2">Music Preview</div>
                <MediaPlayer
                  src={preStoredMusic.find(m => m.id === editData.backgroundMusic?.selectedMusic)?.url || ''}
                  type="audio"
                  title={preStoredMusic.find(m => m.id === editData.backgroundMusic?.selectedMusic)?.name}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transitions Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-400" />
          Transition Effect
        </h4>
        <div className="relative">
          <select
            value={editData.transition}
            onChange={(e) => setEditData(prev => ({ ...prev, transition: e.target.value }))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none appearance-none"
          >
            {predefinedTransitions.map((transition) => (
              <option key={transition} value={transition} className="bg-slate-800">
                {transition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Video Effects Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-pink-400" />
          Video Effects
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {predefinedEffects.map((effect) => (
            <button
              key={effect}
              onClick={() => toggleEffect(effect)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                editData.effects.includes(effect)
                  ? 'bg-pink-500/30 border border-pink-400/50 text-pink-300'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {effect.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        {editData.effects.length > 0 && (
          <div className="mt-3 text-xs text-gray-400">
            Selected: {editData.effects.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}