import React, { useState } from 'react';
import { 
  Layers, 
  Wand2, 
  Image, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Play,
  Palette,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Volume2
} from 'lucide-react';
import { MediaPlayer } from './MediaPlayer';

interface BulkOperationsProps {
  onApplyToAll: (type: 'transition' | 'effect' | 'logo' | 'background' | 'music', data: any) => void;
  totalScenes: number;
  modifiedScenes: number;
}

const bulkTransitions = [
  { id: 'fade_dissolve', name: 'Fade Dissolve', description: 'Smooth fade between all scenes' },
  { id: 'cross_dissolve', name: 'Cross Dissolve', description: 'Classic cross-fade for all transitions' },
  { id: 'slide_transition', name: 'Slide Transition', description: 'Consistent sliding motion' },
  { id: 'quantum_dissolve', name: 'Quantum Dissolve', description: 'Sci-fi themed transitions' }
];

const bulkEffects = [
  { id: 'color_grade_blue', name: 'Blue Color Grade', description: 'Consistent blue grading' },
  { id: 'glow', name: 'Glow Effect', description: 'Soft glow on all scenes' },
  { id: 'contrast_boost', name: 'Contrast Boost', description: 'Enhanced contrast throughout' },
  { id: 'vignette', name: 'Vignette', description: 'Dark edges on all scenes' }
];

const logoPositions = [
  { id: 'top-left', name: 'Top Left' },
  { id: 'top-right', name: 'Top Right' },
  { id: 'bottom-left', name: 'Bottom Left' },
  { id: 'bottom-right', name: 'Bottom Right' },
  { id: 'center', name: 'Center' }
];

const backgroundTypes = [
  { id: 'image', name: 'Background Image' },
  { id: 'video', name: 'Background Video' }
];

const preStoredMusic = [
  {
    id: 'ambient_tech',
    name: 'Ambient Technology',
    url: 'https://example.com/music/ambient_tech.mp3',
    duration: 180,
    genre: 'Ambient',
    description: 'Soft ambient music perfect for tech presentations'
  },
  {
    id: 'corporate_upbeat',
    name: 'Corporate Upbeat',
    url: 'https://example.com/music/corporate_upbeat.mp3',
    duration: 240,
    genre: 'Corporate',
    description: 'Energetic corporate background music'
  },
  {
    id: 'cinematic_drama',
    name: 'Cinematic Drama',
    url: 'https://example.com/music/cinematic_drama.mp3',
    duration: 200,
    genre: 'Cinematic',
    description: 'Dramatic cinematic score for impactful scenes'
  },
  {
    id: 'minimal_piano',
    name: 'Minimal Piano',
    url: 'https://example.com/music/minimal_piano.mp3',
    duration: 160,
    genre: 'Classical',
    description: 'Gentle piano melody for emotional content'
  },
  {
    id: 'electronic_pulse',
    name: 'Electronic Pulse',
    url: 'https://example.com/music/electronic_pulse.mp3',
    duration: 220,
    genre: 'Electronic',
    description: 'Modern electronic beats for dynamic presentations'
  },
  {
    id: 'orchestral_inspire',
    name: 'Orchestral Inspiration',
    url: 'https://example.com/music/orchestral_inspire.mp3',
    duration: 300,
    genre: 'Orchestral',
    description: 'Inspiring orchestral music for powerful moments'
  }
];

const effectCategories = {
  color: {
    icon: Palette,
    name: 'Color & Grading',
    effects: [
      { id: 'color_grade_blue', name: 'Blue Grade', description: 'Cool blue color grading' },
      { id: 'sepia_tone', name: 'Sepia Tone', description: 'Vintage sepia effect' },
      { id: 'desaturate_50', name: 'Desaturate', description: '50% desaturation' },
      { id: 'contrast_boost', name: 'Contrast Boost', description: 'Enhanced contrast' },
      { id: 'color_enhancement', name: 'Color Enhancement', description: 'Vibrant colors' }
    ]
  },
  visual: {
    icon: Eye,
    name: 'Visual Effects',
    effects: [
      { id: 'chroma_key', name: 'Chroma Key', description: 'Green screen removal' },
      { id: 'background_blur', name: 'Background Blur', description: 'Blur background' },
      { id: 'vignette', name: 'Vignette', description: 'Dark edge effect' },
      { id: 'lens_flare', name: 'Lens Flare', description: 'Light lens flare' },
      { id: 'border_highlight', name: 'Border Highlight', description: 'Glowing border' }
    ]
  },
  motion: {
    icon: Zap,
    name: 'Motion & Glow',
    effects: [
      { id: 'glow', name: 'Glow Effect', description: 'Soft glow around objects' },
      { id: 'particle_trails', name: 'Particle Trails', description: 'Quantum particle effects' },
      { id: 'slight_blur', name: 'Motion Blur', description: 'Subtle motion blur' },
      { id: 'scaling_80_percent', name: 'Scale Down', description: 'Scale to 80%' },
      { id: 'center_focus', name: 'Center Focus', description: 'Focus on center' }
    ]
  },
  audio: {
    icon: Settings,
    name: 'Audio Effects',
    effects: [
      { id: 'echo', name: 'Echo', description: 'Audio echo effect' },
      { id: 'reverb', name: 'Reverb', description: 'Spatial reverb' },
      { id: 'quantum_resonance', name: 'Quantum Resonance', description: 'Sci-fi audio effect' },
      { id: 'spatial_audio', name: 'Spatial Audio', description: '3D audio positioning' }
    ]
  }
};

const transitionCategories = {
  cinematic: {
    icon: Play,
    name: 'Cinematic',
    transitions: [
      { id: 'fade_dissolve', name: 'Fade Dissolve', description: 'Smooth fade transition between scenes', duration: 2.0 },
      { id: 'cross_dissolve', name: 'Cross Dissolve', description: 'Classic cross-fade transition', duration: 1.5 },
      { id: 'slide_transition', name: 'Slide Transition', description: 'Smooth sliding motion between scenes', duration: 2.0 },
      { id: 'fade_to_black', name: 'Fade to Black', description: 'Classic fade to black transition', duration: 3.0 }
    ]
  },
  digital: {
    icon: Eye,
    name: 'Digital',
    transitions: [
      { id: 'digital_wipe', name: 'Digital Wipe', description: 'Modern digital wipe effect', duration: 1.8 },
      { id: 'mosaic_transition', name: 'Mosaic Transition', description: 'Pixelated mosaic effect', duration: 2.5 }
    ]
  },
  creative: {
    icon: Sparkles,
    name: 'Creative',
    transitions: [
      { id: 'zoom_transition', name: 'Zoom Transition', description: 'Dynamic zoom-based transition', duration: 2.2 },
      { id: 'blur_transition', name: 'Blur Transition', description: 'Artistic blur-based transition', duration: 2.0 }
    ]
  }
};

export function BulkOperationsPanel({ onApplyToAll, totalScenes, modifiedScenes }: BulkOperationsProps) {
  const [selectedTransition, setSelectedTransition] = useState('');
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [expandedEffectCategories, setExpandedEffectCategories] = useState<string[]>(['color', 'visual']);
  const [expandedTransitionCategories, setExpandedTransitionCategories] = useState<string[]>(['cinematic']);
  const [logoConfig, setLogoConfig] = useState({
    name: '',
    url: '',
    position: 'top-right' as const
  });
  const [backgroundConfig, setBackgroundConfig] = useState({
    name: '',
    url: '',
    type: 'image' as const,
    opacity: 0.7
  });
  const [musicConfig, setMusicConfig] = useState({
    selectedMusic: '',
    volume: 0.3,
    autoAdjust: true,
    fadeIn: true,
    fadeOut: true
  });
  const [activeTab, setActiveTab] = useState<'transitions' | 'effects' | 'logos' | 'backgrounds'>('effects');

  const handleApplyTransition = () => {
    if (selectedTransition) {
      onApplyToAll('transition', selectedTransition);
      // Don't clear selection immediately so user can see what was applied
      // setSelectedTransition('');
    }
  };

  const handleApplyEffects = () => {
    if (selectedEffects.length > 0) {
      onApplyToAll('effect', selectedEffects);
      // Don't clear selection immediately so user can see what was applied
      // setSelectedEffects([]);
    }
  };

  const handleApplyLogo = () => {
    if (logoConfig.name && logoConfig.url) {
      onApplyToAll('logo', logoConfig);
      setLogoConfig({ name: '', url: '', position: 'top-right' });
    }
  };

  const handleApplyBackground = () => {
    if (backgroundConfig.name && backgroundConfig.url) {
      onApplyToAll('background', backgroundConfig);
      setBackgroundConfig({ name: '', url: '', type: 'image', opacity: 0.7 });
    }
  };

  const handleApplyMusic = () => {
    if (musicConfig.selectedMusic) {
      const selectedMusicData = preStoredMusic.find(m => m.id === musicConfig.selectedMusic);
      if (selectedMusicData) {
        const musicData = {
          ...selectedMusicData,
          volume: musicConfig.volume,
          autoAdjust: musicConfig.autoAdjust,
          fadeIn: musicConfig.fadeIn,
          fadeOut: musicConfig.fadeOut,
          id: `${selectedMusicData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        onApplyToAll('music', musicData);
        setMusicConfig({
          selectedMusic: '',
          volume: 0.3,
          autoAdjust: true,
          fadeIn: true,
          fadeOut: true
        });
      }
    }
  };
  const toggleEffect = (effectId: string) => {
    setSelectedEffects(prev => 
      prev.includes(effectId) 
        ? prev.filter(e => e !== effectId)
        : [...prev, effectId]
    );
  };

  const toggleEffectCategory = (category: string) => {
    setExpandedEffectCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTransitionCategory = (category: string) => {
    setExpandedTransitionCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          Bulk Operations
        </h3>
        <div className="text-sm text-gray-400">
          {modifiedScenes}/{totalScenes} scenes modified
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'effects', label: 'Effects', icon: Palette },
          { id: 'transitions', label: 'Transitions', icon: Zap },
          { id: 'logos', label: 'Logos', icon: Image },
          { id: 'backgrounds', label: 'Backgrounds', icon: Settings },
          { id: 'music', label: 'Music', icon: Volume2 }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === id
                ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400'
                : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Effects Tab */}
      {activeTab === 'effects' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Selected effects will be added to all scenes</span>
          </div>
          
          <div className="space-y-4">
            {Object.entries(effectCategories).map(([categoryKey, category]) => {
              const Icon = category.icon;
              const isExpanded = expandedEffectCategories.includes(categoryKey);
              
              return (
                <div key={categoryKey} className="border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleEffectCategory(categoryKey)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <span className="text-white font-medium">{category.name}</span>
                      <span className="text-xs text-gray-400">
                        ({category.effects.filter(e => selectedEffects.includes(e.id)).length} selected)
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-2">
                      {category.effects.map((effect) => (
                        <div
                          key={effect.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            selectedEffects.includes(effect.id)
                              ? 'bg-cyan-500/20 border border-cyan-400/30'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                          }`}
                          onClick={() => toggleEffect(effect.id)}
                        >
                          <div>
                            <div className="text-white font-medium text-sm">{effect.name}</div>
                            <div className="text-gray-400 text-xs">{effect.description}</div>
                          </div>
                          <div className={`w-4 h-4 rounded border-2 transition-colors ${
                            selectedEffects.includes(effect.id)
                              ? 'bg-cyan-400 border-cyan-400'
                              : 'border-gray-400'
                          }`}>
                            {selectedEffects.includes(effect.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedEffects.length > 0 && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
              <p className="text-purple-400 text-sm font-medium">
                Selected Effects ({selectedEffects.length})
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedEffects.map(effectId => {
                  const effect = Object.values(effectCategories)
                    .flatMap(cat => cat.effects)
                    .find(e => e.id === effectId);
                  
                  return (
                    <span key={effectId} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                      {effect?.name || effectId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleApplyEffects}
            disabled={selectedEffects.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 rounded-lg border border-purple-400/30 text-purple-400 font-medium transition-colors"
          >
            <Palette className="w-4 h-4" />
            Apply Effects to All Scenes
          </button>
        </div>
      )}

      {/* Transitions Tab */}
      {activeTab === 'transitions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">This will apply the same transition to all scenes</span>
          </div>
          
          <div className="space-y-4">
            {Object.entries(transitionCategories).map(([categoryKey, category]) => {
              const Icon = category.icon;
              const isExpanded = expandedTransitionCategories.includes(categoryKey);
              
              return (
                <div key={categoryKey} className="border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleTransitionCategory(categoryKey)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">{category.name} Transitions</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-2">
                      {category.transitions.map((transition) => (
                        <div
                          key={transition.id}
                          onClick={() => setSelectedTransition(transition.id)}
                          className={`p-4 rounded-lg cursor-pointer transition-all ${
                            selectedTransition === transition.id
                              ? 'bg-blue-500/20 border border-blue-400/30'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium">{transition.name}</h4>
                              <p className="text-gray-400 text-sm">{transition.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-400 text-xs">{transition.duration}s</div>
                              {selectedTransition === transition.id && (
                                <CheckCircle className="w-5 h-5 text-blue-400 mt-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedTransition && (
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
              <h4 className="text-blue-400 font-medium mb-2">Selected Transition</h4>
              <div className="text-white text-sm">
                {Object.values(transitionCategories)
                  .flatMap(cat => cat.transitions)
                  .find(t => t.id === selectedTransition)?.name} 
                <span className="text-gray-400 ml-2">
                  ({Object.values(transitionCategories)
                    .flatMap(cat => cat.transitions)
                    .find(t => t.id === selectedTransition)?.duration}s)
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {Object.values(transitionCategories)
                  .flatMap(cat => cat.transitions)
                  .find(t => t.id === selectedTransition)?.description}
              </p>
            </div>
          )}

          <button
            onClick={handleApplyTransition}
            disabled={!selectedTransition}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 rounded-lg border border-blue-400/30 text-blue-400 font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            Apply Transition to All Scenes
          </button>
        </div>
      )}

      {/* Effects Tab - Old Simple Version (Remove this section) */}
      {false && activeTab === 'effects' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Selected effects will be added to all scenes</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {bulkEffects.map((effect) => (
              <div
                key={effect.id}
                onClick={() => toggleEffect(effect.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedEffects.includes(effect.id)
                    ? 'bg-purple-500/20 border border-purple-400/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium text-sm">{effect.name}</h4>
                    <p className="text-gray-400 text-xs">{effect.description}</p>
                  </div>
                  {selectedEffects.includes(effect.id) && (
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedEffects.length > 0 && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
              <p className="text-purple-400 text-sm font-medium">
                Selected Effects ({selectedEffects.length})
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedEffects.map(effectId => (
                  <span key={effectId} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                    {bulkEffects.find(e => e.id === effectId)?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleApplyEffects}
            disabled={selectedEffects.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 rounded-lg border border-purple-400/30 text-purple-400 font-medium transition-colors"
          >
            <Palette className="w-4 h-4" />
            Apply Effects to All Scenes
          </button>
        </div>
      )}

      {/* Logos Tab */}
      {activeTab === 'logos' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Logo will be added to all scenes at the specified position</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo Name</label>
              <input
                type="text"
                value={logoConfig.name}
                onChange={(e) => setLogoConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Company Logo"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
              <input
                type="url"
                value={logoConfig.url}
                onChange={(e) => setLogoConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <select
                value={logoConfig.position}
                onChange={(e) => setLogoConfig(prev => ({ ...prev, position: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none"
              >
                {logoPositions.map((pos) => (
                  <option key={pos.id} value={pos.id} className="bg-slate-800">
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg border border-green-400/30 text-green-400 text-sm transition-colors">
                <Image className="w-4 h-4" />
                Upload Logo
              </button>
            </div>
          </div>

          <button
            onClick={handleApplyLogo}
            disabled={!logoConfig.name || !logoConfig.url}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 rounded-lg border border-green-400/30 text-green-400 font-medium transition-colors"
          >
            <Image className="w-4 h-4" />
            Apply Logo to All Scenes
          </button>
        </div>
      )}

      {/* Backgrounds Tab */}
      {activeTab === 'backgrounds' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Background will be added to all scenes behind the narrator overlay</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background Name</label>
              <input
                type="text"
                value={backgroundConfig.name}
                onChange={(e) => setBackgroundConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Corporate Background"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background Type</label>
              <select
                value={backgroundConfig.type}
                onChange={(e) => setBackgroundConfig(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-orange-400 focus:outline-none"
              >
                {backgroundTypes.map((type) => (
                  <option key={type.id} value={type.id} className="bg-slate-800">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {backgroundConfig.type === 'image' ? 'Image URL' : 'Video URL'}
              </label>
              <input
                type="url"
                value={backgroundConfig.url}
                onChange={(e) => setBackgroundConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder={backgroundConfig.type === 'image' ? 'https://example.com/background.jpg' : 'https://example.com/background.mp4'}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Opacity ({Math.round(backgroundConfig.opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={backgroundConfig.opacity}
                onChange={(e) => setBackgroundConfig(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg border border-orange-400/30 text-orange-400 text-sm transition-colors">
                <Image className="w-4 h-4" />
                Upload {backgroundConfig.type === 'image' ? 'Image' : 'Video'}
              </button>
            </div>
          </div>

          <button
            onClick={handleApplyBackground}
            disabled={!backgroundConfig.name || !backgroundConfig.url}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 rounded-lg border border-orange-400/30 text-orange-400 font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Apply Background to All Scenes
          </button>
        </div>
      )}
    </div>
  );
}