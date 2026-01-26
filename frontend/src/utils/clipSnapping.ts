import { Clip, EditorProject } from '@/types/videoEditor';
import { snapToFrame, getFrameRate, frameToTime } from '@/utils/videoEditorUtils';

export interface SnapResult {
  snapped: boolean;
  snapTime: number | null;
  snapDistance: number;
  snapType?: 'clip-start' | 'clip-end' | 'playhead' | 'zero';
}

export interface SnapPoint {
  time: number;
  type: 'clip-start' | 'clip-end' | 'playhead' | 'zero';
  clipId?: string;
}

const SNAP_THRESHOLD_PIXELS = 10; // Pixels within which to snap

/**
 * Calculate snap position for a clip being moved
 * @param clipTime - The time position of the clip being moved
 * @param allClips - All clips in all tracks (for snapping)
 * @param excludeClipId - ID of clip being moved (to exclude from snap targets)
 * @param pixelsPerSecond - Pixels per second for conversion
 * @param project - Optional project for frame snapping
 * @param snapToFrames - Whether to snap to frames
 * @returns SnapResult indicating if and where to snap
 */
export function calculateSnapPosition(
  clipTime: number,
  allClips: Clip[],
  excludeClipId: string,
  pixelsPerSecond: number,
  project?: EditorProject,
  snapToFrames: boolean = false
): SnapResult {
  // Convert threshold to seconds
  const thresholdSeconds = SNAP_THRESHOLD_PIXELS / pixelsPerSecond;

  // If frame snapping is enabled, snap to nearest frame first
  if (snapToFrames && project) {
    const frameRate = getFrameRate(project);
    const snappedTime = snapToFrame(clipTime, frameRate);
    const frameDistance = Math.abs(clipTime - snappedTime);
    
    // If close enough to a frame, use frame snapping
    if (frameDistance < thresholdSeconds) {
      return {
        snapped: true,
        snapTime: snappedTime,
        snapDistance: frameDistance * pixelsPerSecond,
        snapType: 'playhead', // Use playhead type for frame snaps
      };
    }
  }

  // Get all snap points (start and end of clips, plus 0)
  const snapPoints = getSnapPoints(allClips, excludeClipId, undefined, project, snapToFrames);

  // Find closest snap point
  let closestSnap: SnapPoint | null = null;
  let minDistance = thresholdSeconds;

  for (const snapPoint of snapPoints) {
    const distance = Math.abs(clipTime - snapPoint.time);
    if (distance < minDistance) {
      minDistance = distance;
      closestSnap = snapPoint;
    }
  }

  return {
    snapped: closestSnap !== null,
    snapTime: closestSnap?.time ?? null,
    snapDistance: minDistance * pixelsPerSecond, // Convert back to pixels for visual feedback
    snapType: closestSnap?.type,
  };
}

/**
 * Calculate snap position for trimming (start or end edge)
 * @param trimTime - The trim time position
 * @param allClips - All clips in all tracks
 * @param currentClipId - ID of clip being trimmed
 * @param pixelsPerSecond - Pixels per second for conversion
 * @returns SnapResult
 */
export function calculateTrimSnapPosition(
  trimTime: number,
  allClips: Clip[],
  currentClipId: string,
  pixelsPerSecond: number
): SnapResult {
  const thresholdSeconds = SNAP_THRESHOLD_PIXELS / pixelsPerSecond;
  const snapPoints: SnapPoint[] = [{ time: 0, type: 'zero' }];

  allClips.forEach((clip) => {
    if (clip.id !== currentClipId) {
      snapPoints.push({ time: clip.startTime, type: 'clip-start', clipId: clip.id });
      snapPoints.push({ time: clip.startTime + clip.duration, type: 'clip-end', clipId: clip.id });
    } else {
      // For the clip being trimmed, snap to its other edge
      const currentClip = clip;
      snapPoints.push({ time: currentClip.startTime, type: 'clip-start', clipId: clip.id });
      snapPoints.push({ time: currentClip.startTime + currentClip.duration, type: 'clip-end', clipId: clip.id });
    }
  });

  // Remove duplicates by time
  const uniqueSnapPoints = Array.from(
    new Map(snapPoints.map(sp => [sp.time, sp])).values()
  ).sort((a, b) => a.time - b.time);

  let closestSnap: SnapPoint | null = null;
  let minDistance = thresholdSeconds;

  for (const snapPoint of uniqueSnapPoints) {
    const distance = Math.abs(trimTime - snapPoint.time);
    if (distance < minDistance) {
      minDistance = distance;
      closestSnap = snapPoint;
    }
  }

  return {
    snapped: closestSnap !== null,
    snapTime: closestSnap?.time ?? null,
    snapDistance: minDistance * pixelsPerSecond,
    snapType: closestSnap?.type,
  };
}

/**
 * Get all snap points for visual rendering
 * @param allClips - All clips in all tracks
 * @param excludeClipId - Optional clip ID to exclude from snap points
 * @param playheadTime - Optional playhead time to include as snap point
 * @param project - Optional project for frame snapping
 * @param snapToFrames - Whether to include frame snap points
 * @returns Array of snap points
 */
export function getSnapPoints(
  allClips: Clip[],
  excludeClipId?: string,
  playheadTime?: number,
  project?: EditorProject,
  snapToFrames: boolean = false
): SnapPoint[] {
  const snapPoints: SnapPoint[] = [{ time: 0, type: 'zero' }];

  // Add playhead as snap point if provided
  if (playheadTime !== undefined && playheadTime > 0) {
    snapPoints.push({ time: playheadTime, type: 'playhead' });
  }

  // Add clip start and end points
  allClips.forEach((clip) => {
    if (clip.id !== excludeClipId) {
      snapPoints.push({ time: clip.startTime, type: 'clip-start', clipId: clip.id });
      snapPoints.push({ time: clip.startTime + clip.duration, type: 'clip-end', clipId: clip.id });
    }
  });

  // Add frame snap points if enabled
  if (snapToFrames && project && playheadTime !== undefined) {
    const frameRate = getFrameRate(project);
    const frameDuration = 1 / frameRate;
    const currentFrame = Math.floor(playheadTime * frameRate);
    
    // Add nearby frames as snap points
    for (let i = -2; i <= 2; i++) {
      const frameTime = frameToTime(currentFrame + i, frameRate);
      if (frameTime >= 0 && frameTime <= (allClips.length > 0 ? Math.max(...allClips.map(c => c.startTime + c.duration)) : 0)) {
        snapPoints.push({ time: frameTime, type: 'playhead' });
      }
    }
  }

  // Remove duplicates by time and sort
  const uniqueSnapPoints = Array.from(
    new Map(snapPoints.map(sp => [sp.time, sp])).values()
  ).sort((a, b) => a.time - b.time);

  return uniqueSnapPoints;
}

/**
 * Check if position should show snap indicator (for visual feedback)
 * @param clipTime - The time position being checked
 * @param allClips - All clips in all tracks
 * @param pixelsPerSecond - Pixels per second for conversion
 * @param excludeClipId - Optional clip ID to exclude
 * @param playheadTime - Optional playhead time
 * @returns SnapResult with visual feedback info
 */
export function shouldShowSnapIndicator(
  clipTime: number,
  allClips: Clip[],
  pixelsPerSecond: number,
  excludeClipId?: string,
  playheadTime?: number
): SnapResult {
  const thresholdSeconds = SNAP_THRESHOLD_PIXELS / pixelsPerSecond;
  const snapPoints = getSnapPoints(allClips, excludeClipId, playheadTime);

  let closestSnap: SnapPoint | null = null;
  let minDistance = thresholdSeconds;

  for (const snapPoint of snapPoints) {
    const distance = Math.abs(clipTime - snapPoint.time);
    if (distance < minDistance) {
      minDistance = distance;
      closestSnap = snapPoint;
    }
  }

  return {
    snapped: closestSnap !== null,
    snapTime: closestSnap?.time ?? null,
    snapDistance: minDistance * pixelsPerSecond,
    snapType: closestSnap?.type,
  };
}

