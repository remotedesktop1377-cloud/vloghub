import { EditorProject, Track, Clip } from '@/types/videoEditor';
import { SceneData } from '@/types/sceneData';

/**
 * Convert SceneData array to EditorProject timeline format
 */
export function convertSceneDataToTimeline(scenesData: SceneData[]): EditorProject {
  const tracks: Track[] = [
    {
      id: 'video-track-1',
      type: 'video',
      clips: [],
      locked: false,
      muted: false,
    },
    {
      id: 'overlay-track-1',
      type: 'overlay',
      clips: [],
      locked: false,
      muted: false,
    },
    {
      id: 'audio-track-1',
      type: 'audio',
      clips: [],
      locked: false,
      muted: false,
    },
  ];

  let currentTime = 0;
  let totalDuration = 0;

  scenesData.forEach((scene, index) => {
    const sceneDuration = scene.durationInSeconds || 0;
    
    // Create video/image clip for this scene
    if (scene.assets?.images && scene.assets.images.length > 0) {
      const firstImage = scene.assets.images[0];
      const videoClip: Clip = {
        id: `clip-video-${scene.id || index}`,
        mediaId: firstImage,
        mediaType: 'image',
        startTime: currentTime,
        duration: sceneDuration,
        trimIn: 0,
        trimOut: sceneDuration,
        properties: {
          opacity: 1,
        },
        sceneId: scene.id,
      };
      tracks[0].clips.push(videoClip);
    }

    // Add video clips if available
    if (scene.assets?.clips && scene.assets.clips.length > 0) {
      scene.assets.clips.forEach((videoClip, clipIndex) => {
        const clip: Clip = {
          id: `clip-video-${scene.id || index}-${clipIndex}`,
          mediaId: videoClip.url,
          mediaType: 'video',
          startTime: currentTime,
          duration: videoClip.duration || sceneDuration,
          trimIn: 0,
          trimOut: videoClip.duration || sceneDuration,
          properties: {
            volume: 1,
            opacity: 1,
          },
          sceneId: scene.id,
        };
        tracks[0].clips.push(clip);
        currentTime += clip.duration;
      });
    } else {
      currentTime += sceneDuration;
    }

    // Add text overlay if narration exists
    if (scene.narration) {
      const textClip: Clip = {
        id: `clip-text-${scene.id || index}`,
        mediaId: `text-${scene.id || index}`,
        mediaType: 'text',
        startTime: currentTime - sceneDuration,
        duration: sceneDuration,
        trimIn: 0,
        trimOut: sceneDuration,
        position: { x: 50, y: 50 }, // Default center position
        properties: {
          text: scene.narration,
          fontSize: 24,
          fontColor: '#FFFFFF',
          alignment: 'center',
          animation: 'fadeIn',
        },
        sceneId: scene.id,
      };
      tracks[1].clips.push(textClip);
    }

    // Add audio if narrator video is available
    // This would be added separately as the narrator video is project-level

    totalDuration = Math.max(totalDuration, currentTime);
  });

  return {
    timeline: tracks,
    playheadTime: 0,
    aspectRatio: '16:9',
    totalDuration,
  };
}

/**
 * Convert EditorProject timeline back to SceneData array format
 */
export function convertTimelineToSceneData(
  project: EditorProject,
  originalScenes: SceneData[]
): SceneData[] {
  const updatedScenes: SceneData[] = [];
  
  // Group clips by sceneId to reconstruct scenes
  const clipsByScene = new Map<string, Clip[]>();
  
  project.timeline.forEach(track => {
    track.clips.forEach(clip => {
      if (clip.sceneId) {
        if (!clipsByScene.has(clip.sceneId)) {
          clipsByScene.set(clip.sceneId, []);
        }
        clipsByScene.get(clip.sceneId)!.push(clip);
      }
    });
  });

  // Reconstruct scenes maintaining original order
  originalScenes.forEach((originalScene, index) => {
    const sceneId = originalScene.id || `scene-${index + 1}`;
    const sceneClips = clipsByScene.get(sceneId) || [];
    
    // Find video/image clips for this scene
    const videoClips = sceneClips.filter(c => c.mediaType === 'video' || c.mediaType === 'image');
    const textClips = sceneClips.filter(c => c.mediaType === 'text');
    
    // Calculate scene duration from clips
    let sceneDuration = originalScene.durationInSeconds || 0;
    if (videoClips.length > 0) {
      const lastClip = videoClips[videoClips.length - 1];
      sceneDuration = lastClip.startTime + lastClip.duration - (videoClips[0]?.startTime || 0);
    }

    // Extract narration from text clip
    let narration = originalScene.narration;
    if (textClips.length > 0) {
      narration = textClips[0].properties.text || narration;
    }

    // Reconstruct assets
    const images: string[] = [];
    const videoClipsArray: Array<{ id: string; name: string; url: string; duration: number }> = [];
    
    videoClips.forEach(clip => {
      if (clip.mediaType === 'image') {
        images.push(clip.mediaId);
      } else if (clip.mediaType === 'video') {
        videoClipsArray?.push({
          id: clip.id,
          name: `Video Clip ${clip.id}`,
          url: clip.mediaId,
          duration: clip.duration,
        });
      }
    });

    // Update scene with timeline data
    const updatedScene: SceneData = {
      ...originalScene,
      narration,
      durationInSeconds: sceneDuration,
      duration: `${Math.floor(sceneDuration / 60)}:${String(Math.floor(sceneDuration % 60)).padStart(2, '0')}`,
      assets: {
        images: images.length > 0 ? images : originalScene.assets?.images || [],
        clips: videoClipsArray && videoClipsArray.length > 0 ? videoClipsArray : originalScene.assets?.clips || [],
      },
    };

    updatedScenes.push(updatedScene);
  });

  // If we have clips without sceneIds, create new scenes for them
  clipsByScene.forEach((orphanClips, sceneId) => {
    if (!originalScenes.find(s => s.id === sceneId)) {
      const videoClips = orphanClips.filter(c => c.mediaType === 'video' || c.mediaType === 'image');
      const textClips = orphanClips.filter(c => c.mediaType === 'text');
      
      if (videoClips.length > 0 || textClips.length > 0) {
        const firstClip = videoClips[0] || textClips[0];
        const lastClip = videoClips[videoClips.length - 1] || textClips[textClips.length - 1];
        const duration = (lastClip.startTime + lastClip.duration) - firstClip.startTime;
        
        const newScene: SceneData = {
          id: sceneId,
          narration: textClips[0]?.properties.text || '',
          duration: `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`,
          durationInSeconds: duration,
          words: 0,
          startTime: firstClip.startTime,
          endTime: lastClip.startTime + lastClip.duration,
          assets: {
            images: videoClips.filter(c => c.mediaType === 'image').map(c => c.mediaId),
            clips: videoClips
              .filter(c => c.mediaType === 'video')
              .map(c => ({
                id: c.id,
                name: `Video Clip ${c.id}`,
                url: c.mediaId,
                duration: c.duration,
              })),
          },
        };
        updatedScenes.push(newScene);
      }
    }
  });

  // Sort scenes by start time
  updatedScenes.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  return updatedScenes;
}

/**
 * Calculate total duration of all clips in timeline
 */
export function calculateTotalDuration(project: EditorProject): number {
  let maxEndTime = 0;
  
  project.timeline.forEach(track => {
    track.clips.forEach(clip => {
      const endTime = clip.startTime + clip.duration;
      maxEndTime = Math.max(maxEndTime, endTime);
    });
  });
  
  return maxEndTime;
}

/**
 * Find the end time of all clips in a specific track
 */
export function findTrackEnd(track: Track): number {
  if (track.clips.length === 0) {
    return 0;
  }
  
  let maxEndTime = 0;
  track.clips.forEach(clip => {
    const endTime = clip.startTime + clip.duration;
    maxEndTime = Math.max(maxEndTime, endTime);
  });
  
  return maxEndTime;
}

/**
 * Find the end time of all clips in project (same as calculateTotalDuration but more semantic)
 */
export function findProjectEnd(project: EditorProject): number {
  return calculateTotalDuration(project);
}

/**
 * Update project total duration (call after any clip operation)
 */
export function updateProjectDuration(project: EditorProject): EditorProject {
  const totalDuration = calculateTotalDuration(project);
  return {
    ...project,
    totalDuration,
  };
}

/**
 * Check if playhead is near end of timeline
 */
export function isPlayheadNearEnd(playheadTime: number, totalDuration: number, threshold: number = 0.9): boolean {
  if (totalDuration === 0) return true;
  return playheadTime >= totalDuration * threshold;
}

/**
 * Find clips at a specific time
 */
export function getClipsAtTime(project: EditorProject, time: number): Clip[] {
  const clips: Clip[] = [];
  
  project.timeline.forEach(track => {
    track.clips.forEach(clip => {
      if (time >= clip.startTime && time <= clip.startTime + clip.duration) {
        clips.push(clip);
      }
    });
  });
  
  return clips;
}

/**
 * Format time to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Parse time string to seconds
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Get frame rate from project (default: 30fps)
 */
export function getFrameRate(project: { frameRate?: number }): number {
  return project.frameRate || 30;
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMilliseconds(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert milliseconds to seconds
 */
export function millisecondsToSeconds(ms: number): number {
  return ms / 1000;
}

/**
 * Convert time in seconds to frame number
 */
export function timeToFrame(timeInSeconds: number, frameRate: number = 30): number {
  return Math.floor(timeInSeconds * frameRate);
}

/**
 * Convert frame number to time in seconds
 */
export function frameToTime(frameNumber: number, frameRate: number = 30): number {
  return frameNumber / frameRate;
}

/**
 * Format time to frame-accurate string (HH:MM:SS:FF)
 */
export function formatTimeWithFrames(seconds: number, frameRate: number = 30): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = timeToFrame(seconds % 1, frameRate);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

/**
 * Snap time to nearest frame
 */
export function snapToFrame(timeInSeconds: number, frameRate: number = 30): number {
  const frameDuration = 1 / frameRate;
  return Math.round(timeInSeconds / frameDuration) * frameDuration;
}

