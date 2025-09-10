import React from 'react';
import { 
  Heart, 
  TrendingUp, 
  Truck, 
  Earth, 
  Brain,
  ArrowRight 
} from 'lucide-react';

interface Application {
  industry: string;
  benefit: string;
  example: string;
  color_theme: string;
}

interface ApplicationCardProps {
  application: Application;
}

const getIcon = (industry: string) => {
  switch (industry.toLowerCase()) {
    case 'medicine': return Heart;
    case 'finance': return TrendingUp;
    case 'logistics': return Truck;
    case 'climate': return Earth;
    case 'ai': return Brain;
    default: return Brain;
  }
};

export function ApplicationCard({ application }: ApplicationCardProps) {
  const Icon = getIcon(application.industry);
  
  return (
    <div className="group relative bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
      {/* Icon */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors"
        style={{ backgroundColor: `${application.color_theme}20`, border: `2px solid ${application.color_theme}` }}
      >
        <Icon 
          className="w-6 h-6 transition-colors" 
          style={{ color: application.color_theme }}
        />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
        {application.industry}
      </h3>
      
      <p className="text-blue-300 font-semibold mb-2">
        {application.benefit}
      </p>
      
      <p className="text-gray-400 text-sm mb-4">
        Example: {application.example}
      </p>

      {/* Arrow indicator */}
      <div className="flex items-center text-gray-400 group-hover:text-white transition-colors">
        <span className="text-sm mr-2">Learn more</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        style={{ boxShadow: `inset 0 0 20px ${application.color_theme}` }}
      ></div>
    </div>
  );
}