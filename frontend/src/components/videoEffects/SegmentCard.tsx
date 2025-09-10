import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';

interface SegmentProps {
  title: string;
  duration: number;
  narration: string;
  index: number;
}

export function SegmentCard({ title, duration, narration, index }: SegmentProps) {
  const colors = [
    'from-blue-500/20 to-indigo-500/20 border-blue-400/30',
    'from-indigo-500/20 to-purple-500/20 border-indigo-400/30',
    'from-purple-500/20 to-pink-500/20 border-purple-400/30',
    'from-pink-500/20 to-red-500/20 border-pink-400/30',
    'from-red-500/20 to-orange-500/20 border-red-400/30',
    'from-orange-500/20 to-yellow-500/20 border-orange-400/30',
    'from-yellow-500/20 to-green-500/20 border-yellow-400/30',
  ];

  const colorClass = colors[index % colors.length];

  return (
    <div className={`group bg-gradient-to-br ${colorClass} backdrop-blur-sm rounded-xl p-6 border cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
            {index + 1}
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
            {title}
          </h3>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300 text-sm">{duration} seconds</span>
      </div>
      
      <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
        {narration}
      </p>
    </div>
  );
}