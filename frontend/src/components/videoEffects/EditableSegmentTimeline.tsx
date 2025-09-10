import React, { useState, useEffect } from 'react';
import { EditableSegmentCard } from './EditableSegmentCard';
import { ScenePreview } from './ScenePreview';
import { FileUploadZone } from './FileUploadZone';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { RenderPanel } from './RenderPanel';
import { 
  Settings, 
  Save, 
  Download, 
  Eye, 
  Upload,
  Film,
  Palette,
  Zap,
  Clock,
  Layers,
  Play as PlayIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface SegmentData {
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
}

interface EditableSegmentTimelineProps {
  script: any;
}

export function EditableSegmentTimeline({ script }: EditableSegmentTimelineProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segmentData, setSegmentData] = useState<{ [key: string]: SegmentData }>({});
  const [previewSegment, setPreviewSegment] = useState<string | null>(null);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showRenderPanel, setShowRenderPanel] = useState(false);
  const [renderingScenes, setRenderingScenes] = useState<Set<string>>(new Set());
  const [renderedScenes, setRenderedScenes] = useState<Set<string>>(new Set());
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineOffset, setTimelineOffset] = useState(0);

  const segments = [
    { key: 'intro', title: 'Introduction', ...script.intro },
    { key: 'segment_1', title: 'Opening Scene', ...script.segment_1 },
    { key: 'segment_2', title: 'Main Content Part 1', ...script.segment_2 },
    { key: 'segment_3', title: 'Main Content Part 2', ...script.segment_3 },
    { key: 'segment_4', title: 'Key Demonstrations', ...script.segment_4 },
    { key: 'segment_5', title: 'Real-World Examples', ...script.segment_5 },
    { key: 'segment_6', title: 'Challenges & Solutions', ...script.segment_6 },
    { key: 'conclusion', title: 'Conclusion', ...script.conclusion },
  ];

  // Calculate timeline data with golden ratio principles
  const calculateTimelineData = () => {
    let currentTime = 0;
    const timelineData = segments.map((segment) => {
      const duration = segmentData[segment.key]?.duration || segment.duration;
      const startTime = currentTime;
      currentTime += duration;
      
      return {
        ...segment,
        startTime,
        duration,
        endTime: currentTime
      };
    });

    const totalDuration = currentTime;
    
    // Golden ratio calculations for optimal viewing
    const goldenRatio = 1.618;
    const minSceneWidth = 120; // Minimum width for readability
    const maxSceneWidth = 400; // Maximum width to prevent oversized scenes
    
    // Calculate optimal zoom based on golden ratio
    const containerWidth = 1200; // Approximate container width
    const optimalZoom = Math.max(0.3, Math.min(2, (containerWidth * 0.618) / totalDuration));
    
    return { timelineData, totalDuration, optimalZoom };
  };

  const { timelineData, totalDuration, optimalZoom } = calculateTimelineData();

  // Auto-adjust timeline zoom when segments change
  useEffect(() => {
    setTimelineZoom(optimalZoom);
  }, [segmentData, optimalZoom]);

  const handleSegmentSave = (segmentKey: string, data: SegmentData) => {
    setSegmentData(prev => ({
      ...prev,
      [segmentKey]: data
    }));
    
    // Start rendering the scene
    renderScene(segmentKey, data);
  };

  const renderScene = async (segmentKey: string, sceneData: SegmentData) => {
    setRenderingScenes(prev => new Set(prev).add(segmentKey));
    
    try {
      // Prepare scene data for rendering
      const renderPayload = {
        sceneId: segmentKey,
        title: sceneData.title,
        duration: sceneData.duration,
        narration: sceneData.narration,
        clips: sceneData.clips,
        logos: sceneData.logos,
        transition: sceneData.transition,
        effects: sceneData.effects,
        timestamp: new Date().toISOString()
      };

      console.log('Rendering scene:', segmentKey, renderPayload);
      
      // Simulate API call to backend rendering service
      const response = { ok: true };

      if (response.ok) {
        setRenderedScenes(prev => new Set(prev).add(segmentKey));
        console.log(`Scene ${segmentKey} rendered successfully`);
      } else {
        console.error(`Failed to render scene ${segmentKey}`);
      }
    } catch (error) {
      console.error('Error rendering scene:', error);
    } finally {
      setRenderingScenes(prev => {
        const newSet = new Set(prev);
        newSet.delete(segmentKey);
        return newSet;
      });
    }
  };

  const handleFileUpload = (file: any) => {
    console.log('File uploaded:', file);
  };

  const handleBulkApply = (type: 'transition' | 'effect' | 'logo' | 'background' | 'music', data: any) => {
    const updatedData = { ...segmentData };
    
    segments.forEach(segment => {
      if (!updatedData[segment.key]) {
        updatedData[segment.key] = {
          title: segment.title || 'Scene',
          duration: segment.duration,
          narration: segment.narration,
          clips: [],
          logos: [],
          transition: 'fade_dissolve',
          effects: [],
          backgroundMusic: undefined
        };
      }
      
      if (type === 'effect') {
        // Merge new effects with existing ones, avoiding duplicates
        const existingEffects = updatedData[segment.key].effects || [];
        const newEffects = Array.isArray(data) ? data : [data];
        const mergedEffects = Array.from(new Set([...existingEffects, ...newEffects]));
        updatedData[segment.key].effects = mergedEffects;
      } else if (type === 'transition') {
        updatedData[segment.key].transition = data;
      } else if (type === 'logo') {
        // Add logo with unique ID to avoid duplicates
        const logoWithId = {
          ...data,
          id: `${data.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedData[segment.key].logos = [...(updatedData[segment.key].logos || []), logoWithId];
      } else if (type === 'background') {
        // Background handling - this might be for background images or videos
        // For now, we'll skip this as it's not part of our current SegmentData interface
        console.log('Background type not implemented yet:', data);
      }
      
      if (type === 'music') {
        // Set background music with unique ID
        const musicWithId = {
          ...data,
          id: `${data.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        updatedData[segment.key].backgroundMusic = musicWithId;
      }
      
      // Trigger re-render for each scene to show the applied changes
      renderScene(segment.key, updatedData[segment.key]);
    });
    
    setSegmentData(updatedData);
    
    // Show success message
    console.log(`Applied ${type} to all ${segments.length} scenes`);
  };

  const handleStartRender = (renderSettings: any) => {
    console.log('Starting render with settings:', renderSettings);
    console.log('Scene data:', segmentData);
  };

  const exportProject = () => {
    const exportData = {
      segments: segmentData,
      timeline: timelineData,
      totalDuration,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSceneWidth = (duration: number) => {
    const baseWidth = duration * timelineZoom * 3; // 3px per second base
    const minWidth = 120;
    const maxWidth = 400;
    return Math.max(minWidth, Math.min(maxWidth, baseWidth));
  };

  const resetTimelineView = () => {
    setTimelineZoom(optimalZoom);
    setTimelineOffset(0);
  };

  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">Video Scenes Editor</h2>
          
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Edit and customize each scene with clips, logos, transitions, and effects. Scenes are automatically rendered when saved.
          </p>

          {/* Editor Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              onClick={exportProject}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400/30 text-green-400 rounded-lg font-medium hover:bg-green-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Project
            </button>
            
            <button
              onClick={() => setShowRenderPanel(!showRenderPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showRenderPanel
                  ? 'bg-green-500/20 border border-green-400/30 text-green-400'
                  : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              <PlayIcon className="w-4 h-4" />
              Render Video
            </button>
            
            <button
              onClick={() => setShowBulkOperations(!showBulkOperations)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showBulkOperations
                  ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400'
                  : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Layers className="w-4 h-4" />
              Effects & Transitions
            </button>
            
            <div className="text-sm text-gray-400">
              {Object.keys(segmentData).length} scenes edited • {renderedScenes.size} rendered • {formatTime(totalDuration)} total
            </div>
          </div>
        </div>

        {/* Timeline Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setTimelineZoom(prev => Math.min(3, prev * 1.2))}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-gray-300 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
            Zoom In
          </button>
          
          <button
            onClick={() => setTimelineZoom(prev => Math.max(0.3, prev / 1.2))}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-gray-300 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
            Zoom Out
          </button>
          
          <button
            onClick={resetTimelineView}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg border border-cyan-400/30 text-cyan-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset View
          </button>
          
          <div className="text-sm text-gray-400">
            Zoom: {Math.round(timelineZoom * 100)}%
          </div>
        </div>

        {/* Bulk Operations and Render Panels */}
        <div className="space-y-6 mb-12">
          {showBulkOperations && (
            <BulkOperationsPanel
              onApplyToAll={handleBulkApply}
              totalScenes={segments.length}
              modifiedScenes={Object.keys(segmentData).length}
            />
          )}
          
          {showRenderPanel && (
            <RenderPanel
              totalScenes={segments.length}
              modifiedScenes={Object.keys(segmentData).length}
              onStartRender={handleStartRender}
            />
          )}
        </div>

        {/* File Upload Zone */}
        <div className="mb-12">
          <FileUploadZone
            accept="video/*,image/*"
            maxSize={500}
            onFileUpload={handleFileUpload}
            label="Upload Media Assets"
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Timeline Header */}
        <div className="mb-8 max-w-6xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Video Timeline - {formatTime(totalDuration)} Total Duration
            </h3>
            
            {/* Vertical Timeline */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Timeline Ruler - Left Side */}
              <div className="lg:col-span-2">
                <div className="sticky top-20">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Timeline</h4>
                  <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-400 to-purple-400 rounded-full"></div>
                    
                    {/* Timeline markers */}
                    {timelineData.map((segment, index) => {
                      const cumulativeHeight = timelineData.slice(0, index).reduce((acc, s) => acc + Math.max(200, s.duration * 2), 0);
                      const sceneHeight = Math.max(200, segment.duration * 2);
                      
                      return (
                        <div key={segment.key} className="relative mb-4" style={{ height: `${sceneHeight}px` }}>
                          {/* Timeline dot */}
                          <div className="absolute left-3 top-4 w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-900 z-10"></div>
                          
                          {/* Time labels */}
                          <div className="ml-8 space-y-1">
                            <div className="text-xs font-mono text-cyan-400">
                              {formatTime(segment.startTime)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {segment.duration}s
                            </div>
                            <div className="text-xs font-mono text-gray-500">
                              {formatTime(segment.endTime)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Scenes - Right Side */}
              <div className="lg:col-span-10">
                <div className="space-y-6">
                  {timelineData.map((segment, index) => {
                    const isRendering = renderingScenes.has(segment.key);
                    const isRendered = renderedScenes.has(segment.key);
                    const isEdited = segmentData[segment.key];
                    const sceneHeight = Math.max(200, segment.duration * 2);
                    
                    return (
                      <div
                        key={segment.key}
                        className="relative"
                        style={{ minHeight: `${sceneHeight}px` }}
                      >
                        {/* Scene Header with Status */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white">
                                {segment.title || `Scene ${index + 1}`}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</span>
                                <span>{segment.duration}s duration</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Indicators */}
                          <div className="flex items-center gap-2">
                            {isRendering && (
                              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-400/30 flex items-center gap-2">
                                <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                Rendering...
                              </div>
                            )}
                            
                            {isRendered && !isRendering && (
                              <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-400/30 flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                Rendered
                              </div>
                            )}
                            
                            {isEdited && !isRendered && !isRendering && (
                              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-400/30">
                                Edited
                              </div>
                            )}
                            
                            {/* Preview Button for Rendered Scenes */}
                            {isRendered && segmentData[segment.key] && (
                              <button
                                onClick={() => setPreviewSegment(segment.key)}
                                className="flex items-center gap-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-full border border-green-400/30 text-green-400 text-xs transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Preview
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Scene Card */}
                        <div
                          onClick={() => setSelectedSegment(segment.key)}
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedSegment === segment.key ? 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.02]' : ''
                          }`}
                        >
                          <EditableSegmentCard
                            key={`${segment.key}-${JSON.stringify(segmentData[segment.key])}`}
                            title={segment.title || 'Scene'}
                            duration={segment.duration}
                            narration={segment.narration}
                            index={index}
                            initialData={segmentData[segment.key]}
                            onSave={(data) => handleSegmentSave(segment.key, data)}
                          />
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isRendered ? 'bg-green-400' :
                              isRendering ? 'bg-blue-400 animate-pulse' :
                              isEdited ? 'bg-yellow-400' : 'bg-gray-400'
                            }`}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scene Preview Modal */}
        {previewSegment && segmentData[previewSegment] && renderedScenes.has(previewSegment) && (
          <ScenePreview
            sceneData={segmentData[previewSegment]}
            isVisible={!!previewSegment}
            onClose={() => setPreviewSegment(null)}
          />
        )}
      </div>
    </section>
  );
}