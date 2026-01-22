/**
 * Preview Compositor Utilities
 * Handles compositing multiple video, image, and text layers for real-time preview
 * Similar to professional video editors like CapCut
 */

import { EditorProject, Clip, Track } from '@/types/videoEditor';

/**
 * Get all active clips at a specific time on the timeline
 * Returns clips grouped by type and ordered by track layer (bottom to top)
 */
export function getActiveClipsAtTime(project: EditorProject, time: number): {
  video: Array<{ clip: Clip; track: Track }>;
  image: Array<{ clip: Clip; track: Track }>;
  text: Array<{ clip: Clip; track: Track }>;
} {
  const activeVideo: Array<{ clip: Clip; track: Track }> = [];
  const activeImage: Array<{ clip: Clip; track: Track }> = [];
  const activeText: Array<{ clip: Clip; track: Track }> = [];

  // Iterate through tracks in order (tracks earlier in array = lower layer)
  project.timeline.forEach((track) => {
    if (track.locked) return; // Skip locked tracks

    track.clips.forEach((clip) => {
      // Check if clip is active at this time
      const clipStart = clip.startTime;
      const clipEnd = clip.startTime + clip.duration;
      const clipRelativeTime = time - clipStart;

      if (time >= clipStart && time <= clipEnd && clipRelativeTime >= 0) {
        // Clip is active
        if (clip.mediaType === 'video') {
          activeVideo.push({ clip, track });
        } else if (clip.mediaType === 'image') {
          activeImage.push({ clip, track });
        } else if (clip.mediaType === 'text') {
          activeText.push({ clip, track });
        }
      }
    });
  });

  return {
    video: activeVideo,
    image: activeImage,
    text: activeText,
  };
}

/**
 * Get the base video clip (used as background)
 * Priority: first video clip in timeline, then narrator video
 */
export function getBaseVideoClip(
  project: EditorProject,
  narratorVideoUrl?: string
): { clip?: Clip; track?: Track; narratorUrl?: string } {
  // First, look for video clips in timeline
  for (const track of project.timeline) {
    if (track.type === 'video') {
      const firstVideoClip = track.clips.find((c) => c.mediaType === 'video');
      if (firstVideoClip) {
        return { clip: firstVideoClip, track };
      }
    }
  }

  // If no video clip found, use narrator video as fallback
  if (narratorVideoUrl) {
    return { narratorUrl: narratorVideoUrl };
  }

  return {};
}

/**
 * Calculate clip opacity at a specific time
 * Handles fade in/out and clip properties
 */
export function calculateClipOpacity(clip: Clip, time: number): number {
  const clipRelativeTime = time - clip.startTime;
  const clipDuration = clip.duration;
  const baseOpacity = clip.properties.opacity ?? 1;

  // Handle fade in/out
  const fadeIn = clip.properties.fadeIn ?? 0;
  const fadeOut = clip.properties.fadeOut ?? 0;

  if (fadeIn > 0 && clipRelativeTime < fadeIn) {
    // Fade in
    const fadeInProgress = clipRelativeTime / fadeIn;
    return baseOpacity * Math.max(0, Math.min(1, fadeInProgress));
  }

  if (fadeOut > 0 && clipRelativeTime > clipDuration - fadeOut) {
    // Fade out
    const fadeOutProgress = (clipDuration - clipRelativeTime) / fadeOut;
    return baseOpacity * Math.max(0, Math.min(1, fadeOutProgress));
  }

  // Outside clip bounds
  if (clipRelativeTime < 0 || clipRelativeTime > clipDuration) {
    return 0;
  }

  return baseOpacity;
}

/**
 * Get the current playback time for a video clip
 * Accounts for trim in/out
 */
export function getClipPlaybackTime(clip: Clip, timelineTime: number): number {
  const clipRelativeTime = timelineTime - clip.startTime;
  return clip.trimIn + Math.max(0, Math.min(clip.duration, clipRelativeTime));
}

/**
 * Determine clip rendering order
 * Returns z-index order: lower number = rendered first (bottom layer)
 */
export function getClipZIndex(clip: Clip, trackIndex: number, totalTracks: number): number {
  // Text clips are always on top (highest z-index)
  if (clip.mediaType === 'text') {
    return 1000 + trackIndex;
  }

  // Overlay tracks (images) are above video
  // Video tracks are at the bottom
  if (clip.mediaType === 'image') {
    return 500 + trackIndex;
  }

  // Video clips are at the bottom
  return trackIndex;
}
