import React, { useState } from 'react';
import { SegmentCard } from './SegmentCard';

interface SegmentTimelineProps {
  script: any;
}

export function SegmentTimeline({ script }: SegmentTimelineProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const segments = [
    { key: 'intro', ...script.intro },
    { key: 'segment_1', title: 'Classical vs Quantum Computing', ...script.segment_1 },
    { key: 'segment_2', title: 'Quantum Phenomena: Superposition and Entanglement', ...script.segment_2 },
    { key: 'segment_3', title: 'Quantum Hardware: The Engineering Marvel', ...script.segment_3 },
    { key: 'segment_4', title: 'Quantum Algorithms: Unlocking Exponential Power', ...script.segment_4 },
    { key: 'segment_5', title: 'Real-World Applications: Transforming Industries', ...script.segment_5 },
    { key: 'segment_6', title: 'Challenges and Current Limitations', ...script.segment_6 },
    { key: 'conclusion', title: 'The Quantum Future', ...script.conclusion },
  ];

  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Documentary Segments</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Explore each carefully crafted segment of our quantum computing journey
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {segments.map((segment, index) => (
            <div 
              key={segment.key}
              onClick={() => setActiveSegment(activeSegment === segment.key ? null : segment.key)}
            >
              <SegmentCard
                title={segment.title || 'Introduction'}
                duration={segment.duration}
                narration={segment.narration}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Timeline visualization */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-cyan-400 via-blue-400 to-purple-400"></div>
            {segments.map((segment, index) => {
              const totalDuration = segments.slice(0, index + 1).reduce((acc, s) => acc + s.duration, 0);
              return (
                <div key={segment.key} className="relative flex items-center justify-center mb-8">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-cyan-400 rounded-full border-4 border-slate-900"></div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 ml-8 border border-white/20">
                    <div className="text-white font-semibold text-sm">
                      {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}