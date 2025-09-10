import React, { useState } from 'react';
import { Play, Eye, Sparkles, ChevronRight } from 'lucide-react';

interface Transition {
  id: string;
  name: string;
  description: string;
  duration: number;
  preview: string;
  category: 'cinematic' | 'digital' | 'creative';
}

interface TransitionSelectorProps {
  selectedTransition: string;
  onTransitionSelect: (transitionId: string) => void;
}

const transitions: Transition[] = [
  {
    id: 'fade_dissolve',
    name: 'Fade Dissolve',
    description: 'Smooth fade transition between scenes',
    duration: 2.0,
    preview: 'fade-dissolve-preview.mp4',
    category: 'cinematic'
  },
  {
    id: 'cross_dissolve',
    name: 'Cross Dissolve',
    description: 'Classic cross-fade transition',
    duration: 1.5,
    preview: 'cross-dissolve-preview.mp4',
    category: 'cinematic'
  },
  {
    id: 'slide_transition',
    name: 'Slide Transition',
    description: 'Smooth sliding motion between scenes',
    duration: 2.0,
    preview: 'slide-transition-preview.mp4',
    category: 'cinematic'
  },
  {
    id: 'digital_wipe',
    name: 'Digital Wipe',
    description: 'Modern digital wipe effect',
    duration: 1.8,
    preview: 'digital-wipe-preview.mp4',
    category: 'digital'
  },
  {
    id: 'zoom_transition',
    name: 'Zoom Transition',
    description: 'Dynamic zoom-based transition',
    duration: 2.2,
    preview: 'zoom-transition-preview.mp4',
    category: 'creative'
  },
  {
    id: 'blur_transition',
    name: 'Blur Transition',
    description: 'Artistic blur-based transition',
    duration: 2.0,
    preview: 'blur-transition-preview.mp4',
    category: 'creative'
  },
  {
    id: 'mosaic_transition',
    name: 'Mosaic Transition',
    description: 'Pixelated mosaic effect',
    duration: 2.5,
    preview: 'mosaic-transition-preview.mp4',
    category: 'digital'
  },
  {
    id: 'fade_to_black',
    name: 'Fade to Black',
    description: 'Classic fade to black transition',
    duration: 3.0,
    preview: 'fade-to-black-preview.mp4',
    category: 'cinematic'
  }
];

const categoryColors = {
  cinematic: 'from-blue-500/20 to-indigo-500/20 border-blue-400/30',
  digital: 'from-green-500/20 to-emerald-500/20 border-green-400/30',
  creative: 'from-purple-500/20 to-pink-500/20 border-purple-400/30'
};

const categoryIcons = {
  cinematic: Play,
  digital: Eye,
  creative: Sparkles
};

export function TransitionSelector({ selectedTransition, onTransitionSelect }: TransitionSelectorProps) {
  const [previewingTransition, setPreviewingTransition] = useState<string | null>(null);

  const groupedTransitions = transitions.reduce((acc, transition) => {
    if (!acc[transition.category]) {
      acc[transition.category] = [];
    }
    acc[transition.category].push(transition);
    return acc;
  }, {} as Record<string, Transition[]>);

  const handlePreview = (transitionId: string) => {
    setPreviewingTransition(transitionId);
    // Simulate preview duration
    setTimeout(() => setPreviewingTransition(null), 2000);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        Transition Effects
      </h3>

      <div className="space-y-6">
        {Object.entries(groupedTransitions).map(([category, categoryTransitions]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          
          return (
            <div key={category}>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 capitalize">
                <Icon className="w-4 h-4 text-blue-400" />
                {category} Transitions
              </h4>
              
              <div className="grid md:grid-cols-2 gap-3">
                {categoryTransitions.map((transition) => (
                  <div
                    key={transition.id}
                    onClick={() => onTransitionSelect(transition.id)}
                    className={`relative p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedTransition === transition.id
                        ? `bg-gradient-to-br ${categoryColors[category as keyof typeof categoryColors]} scale-105`
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Preview overlay */}
                    {previewingTransition === transition.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg flex items-center justify-center">
                        <div className="text-white font-medium">Previewing...</div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="text-white font-medium">{transition.name}</h5>
                        <p className="text-gray-400 text-xs mt-1">{transition.description}</p>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {transition.duration}s
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(transition.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-gray-300 text-xs transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Preview
                      </button>
                      
                      {selectedTransition === transition.id && (
                        <div className="flex items-center gap-1 text-blue-400 text-xs">
                          <ChevronRight className="w-3 h-3" />
                          Selected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Transition Info */}
      {selectedTransition && (
        <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-400/20">
          <h4 className="text-purple-400 font-medium mb-2">Selected Transition</h4>
          <div className="text-white text-sm">
            {transitions.find(t => t.id === selectedTransition)?.name} 
            <span className="text-gray-400 ml-2">
              ({transitions.find(t => t.id === selectedTransition)?.duration}s)
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            {transitions.find(t => t.id === selectedTransition)?.description}
          </p>
        </div>
      )}
    </div>
  );
}