import React, { useState } from 'react';
import { 
  Palette, 
  Zap, 
  Eye, 
  Sparkles, 
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Check
} from 'lucide-react';

interface Effect {
  id: string;
  name: string;
  category: 'color' | 'visual' | 'motion' | 'audio';
  description: string;
  parameters?: { [key: string]: any };
}

interface EffectsPanelProps {
  selectedEffects: string[];
  onEffectToggle: (effectId: string) => void;
  onEffectParameterChange?: (effectId: string, parameter: string, value: any) => void;
  onApplyToAllScenes?: (effects: string[]) => void;
}

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

export function EffectsPanel({ selectedEffects, onEffectToggle, onApplyToAllScenes }: EffectsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['color', 'visual']);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        Video Effects Library
      </h3>

      <div className="space-y-4">
        {Object.entries(effectCategories).map(([categoryKey, category]) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.includes(categoryKey);
          
          return (
            <div key={categoryKey} className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(categoryKey)}
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
                      onClick={() => onEffectToggle(effect.id)}
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

      {/* Selected Effects Summary */}
      {selectedEffects.length > 0 && (
        <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-400/20">
          <h4 className="text-cyan-400 font-medium mb-2">Active Effects ({selectedEffects.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedEffects.map((effectId) => {
              const effect = Object.values(effectCategories)
                .flatMap(cat => cat.effects)
                .find(e => e.id === effectId);
              
              return (
                <span
                  key={effectId}
                  className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded border border-cyan-400/30"
                >
                  {effect?.name || effectId}
                </span>
              );
            })}
          </div>
          
          {/* Apply to All Scenes Button */}
          {onApplyToAllScenes && (
            <button
              onClick={() => onApplyToAllScenes(selectedEffects)}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-lg border border-cyan-400/30 text-cyan-400 font-medium transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              Apply to All Scenes
            </button>
          )}
        </div>
      )}
    </div>
  );
}