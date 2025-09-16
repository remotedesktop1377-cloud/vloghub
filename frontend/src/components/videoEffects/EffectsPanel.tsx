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
  // helpers to get currently selected per category
  const getSelectedForCategory = (categoryKey: keyof typeof effectCategories): string => {
    const ids = effectCategories[categoryKey].effects.map(e => e.id);
    const hit = selectedEffects.find(id => ids.includes(id));
    return hit || '';
  };

  const setSelectedForCategory = (categoryKey: keyof typeof effectCategories, nextId: string) => {
    const ids = effectCategories[categoryKey].effects.map(e => e.id);
    const current = selectedEffects.find(id => ids.includes(id));
    if (current && current !== nextId) {
      // toggle off previous
      onEffectToggle(current);
    }
    if (nextId) {
      // toggle on new if not already set
      if (!selectedEffects.includes(nextId)) onEffectToggle(nextId);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">

      {/* Four dropdowns horizontally */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 10, width: '100%' }}>
        {(['color', 'visual', 'motion', 'audio'] as Array<keyof typeof effectCategories>).map((categoryKey) => {
          const category = effectCategories[categoryKey];
          const selected = getSelectedForCategory(categoryKey);
          return (
            <div key={categoryKey} >
              <div style={{ marginBottom: 5 }}>
                <span className="text-white text-sm font-semibold">{category.name}</span>
              </div>
              <select
                style={{
                  height: 44, 
                  minWidth: 280,
                  // maxWidth: 320,
                  display: 'inline-block',
                  // maxWidth: 280,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                value={selected}
                onChange={(e) => setSelectedForCategory(categoryKey, e.target.value)}
              >
                <option value="" className="bg-black text-gray-300">Select {category.name}...</option>
                {category.effects.map((e) => (
                  <option key={e.id} value={e.id} className="bg-black text-white">{e.name}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Summary + Apply All */}
      {/* <div style={{ marginTop: 10, display: 'flex', flexDirection: 'row', gap: 10, width: '100%' }}>
        <div className="flex flex-wrap gap-2">
          {selectedEffects.map((effectId) => {
            const effect = Object.values(effectCategories).flatMap(cat => cat.effects).find(e => e.id === effectId);
            return (
              <span key={effectId} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded border border-cyan-400/30">
                {effect?.name || effectId}
              </span>
            );
          })}
        </div>
        {onApplyToAllScenes && (
          <button
            onClick={() => onApplyToAllScenes(selectedEffects)}
            className="self-start md:self-auto inline-flex items-center justify-center gap-2 px-4 h-10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-md border border-cyan-400/30 text-cyan-300 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Apply to All Scenes
          </button>
        )}
      </div> */}
    </div>
  );
}