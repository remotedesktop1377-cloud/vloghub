import { Clip, EditorProject } from '@/types/videoEditor';

/**
 * Calculate opacity based on animation and clip timing
 */
export function calculateTextOpacity(
  clip: Clip,
  currentTime: number
): number {
  if (!clip.properties.animation || clip.properties.animation === 'none') {
    return clip.properties.opacity ?? 1;
  }

  const clipStart = clip.startTime;
  const clipEnd = clip.startTime + clip.duration;
  const clipRelativeTime = currentTime - clipStart;
  const clipDuration = clip.duration;
  const baseOpacity = clip.properties.opacity ?? 1;

  // Fade in animation
  if (clip.properties.animation === 'fadeIn') {
    const fadeDuration = Math.min(clipDuration * 0.3, 1); // 30% of clip or 1 second, whichever is less
    if (clipRelativeTime < fadeDuration) {
      return baseOpacity * (clipRelativeTime / fadeDuration);
    }
    return baseOpacity;
  }

  // Fade out animation
  if (clip.properties.animation === 'fadeOut') {
    const fadeDuration = Math.min(clipDuration * 0.3, 1); // 30% of clip or 1 second, whichever is less
    const fadeStart = clipDuration - fadeDuration;
    if (clipRelativeTime > fadeStart) {
      const fadeProgress = (clipDuration - clipRelativeTime) / fadeDuration;
      return baseOpacity * fadeProgress;
    }
    return baseOpacity;
  }

  return baseOpacity;
}

/**
 * Get all active text clips at a specific time
 */
export function getActiveTextClips(project: EditorProject, currentTime: number): Clip[] {
  const textClips: Clip[] = [];

  project.timeline.forEach((track) => {
    if (track.type === 'overlay') {
      track.clips.forEach((clip) => {
        if (
          clip.mediaType === 'text' &&
          currentTime >= clip.startTime &&
          currentTime <= clip.startTime + clip.duration
        ) {
          textClips.push(clip);
        }
      });
    }
  });

  return textClips;
}

/**
 * Convert position percentage to pixel coordinates
 */
export function positionToPixels(
  position: { x: number; y: number },
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: (position.x / 100) * containerWidth,
    y: (position.y / 100) * containerHeight,
  };
}

/**
 * Get text alignment CSS value
 */
export function getTextAlign(alignment?: string): 'left' | 'center' | 'right' {
  if (alignment === 'left' || alignment === 'right') {
    return alignment;
  }
  return 'center';
}

