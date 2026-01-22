import { useCallback } from 'react';
import { EditorProject, Clip, Track } from '@/types/videoEditor';

export interface ClipOperations {
  deleteClip: (clipId: string) => EditorProject;
  duplicateClip: (clipId: string, trackId?: string) => EditorProject;
  splitClip: (clipId: string, splitTime: number) => EditorProject;
  moveClip: (clipId: string, newStartTime: number, newTrackId?: string) => EditorProject;
  trimClip: (clipId: string, trimIn: number, trimOut: number, newStartTime?: number, newDuration?: number) => EditorProject;
}

export function useClipOperations() {
  const deleteClip = useCallback((project: EditorProject, clipId: string): EditorProject => {
    return {
      ...project,
      timeline: project.timeline.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => clip.id !== clipId),
      })),
    };
  }, []);

  const duplicateClip = useCallback(
    (project: EditorProject, clipId: string, targetTrackId?: string): EditorProject => {
      // Find the clip to duplicate
      let sourceClip: Clip | null = null;
      let sourceTrack: Track | null = null;

      for (const track of project.timeline) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          sourceClip = clip;
          sourceTrack = track;
          break;
        }
      }

      if (!sourceClip || !sourceTrack) {
        return project; // Clip not found
      }

      // Create duplicate with new ID
      const duplicate: Clip = {
        ...sourceClip,
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: sourceClip.startTime + sourceClip.duration, // Place after original
      };

      // Determine target track
      const finalTargetTrackId = targetTrackId || sourceTrack.id;
      const targetTrack = project.timeline.find((t) => t.id === finalTargetTrackId);

      if (!targetTrack) {
        return project; // Target track not found
      }

      // Add duplicate to target track
      return {
        ...project,
        timeline: project.timeline.map((track) =>
          track.id === finalTargetTrackId
            ? {
                ...track,
                clips: [...track.clips, duplicate].sort((a, b) => a.startTime - b.startTime),
              }
            : track
        ),
      };
    },
    []
  );

  const splitClip = useCallback(
    (project: EditorProject, clipId: string, splitTime: number): EditorProject => {
      return {
        ...project,
        timeline: project.timeline.map((track) => {
          const clipIndex = track.clips.findIndex((c) => c.id === clipId);
          if (clipIndex === -1) {
            return track;
          }

          const clip = track.clips[clipIndex];
          const clipStart = clip.startTime;
          const clipEnd = clip.startTime + clip.duration;

          // Validate split time is within clip bounds
          if (splitTime <= clipStart || splitTime >= clipEnd) {
            return track;
          }

          // Calculate trim values
          const firstDuration = splitTime - clipStart;
          const secondDuration = clipEnd - splitTime;

          // First clip (trimmed end)
          const firstClip: Clip = {
            ...clip,
            duration: firstDuration,
            trimOut: clip.trimOut + (clip.duration - firstDuration), // Adjust trimOut
          };

          // Second clip (trimmed start)
          const secondClip: Clip = {
            ...clip,
            id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            startTime: splitTime,
            duration: secondDuration,
            trimIn: clip.trimIn + firstDuration, // Adjust trimIn
          };

          // Replace original clip with two new clips
          const newClips = [...track.clips];
          newClips.splice(clipIndex, 1, firstClip, secondClip);

          return {
            ...track,
            clips: newClips.sort((a, b) => a.startTime - b.startTime),
          };
        }),
      };
    },
    []
  );

  const moveClip = useCallback(
    (project: EditorProject, clipId: string, newStartTime: number, newTrackId?: string): EditorProject => {
      // Find the clip
      let sourceClip: Clip | null = null;
      let sourceTrackId: string | null = null;

      for (const track of project.timeline) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          sourceClip = clip;
          sourceTrackId = track.id;
          break;
        }
      }

      if (!sourceClip || !sourceTrackId) {
        return project;
      }

      // If moving to different track
      if (newTrackId && newTrackId !== sourceTrackId) {
        return {
          ...project,
          timeline: project.timeline.map((track) => {
            if (track.id === sourceTrackId) {
              // Remove from source track
              return {
                ...track,
                clips: track.clips.filter((c) => c.id !== clipId),
              };
            } else if (track.id === newTrackId) {
              // Add to target track
              return {
                ...track,
                clips: [...track.clips, { ...sourceClip!, startTime: newStartTime }].sort(
                  (a, b) => a.startTime - b.startTime
                ),
              };
            }
            return track;
          }),
        };
      } else {
        // Move within same track
        return {
          ...project,
          timeline: project.timeline.map((track) =>
            track.id === sourceTrackId
              ? {
                  ...track,
                  clips: track.clips
                    .map((clip) => (clip.id === clipId ? { ...clip, startTime: Math.max(0, newStartTime) } : clip))
                    .sort((a, b) => a.startTime - b.startTime),
                }
              : track
          ),
        };
      }
    },
    []
  );

  const trimClip = useCallback(
    (
      project: EditorProject,
      clipId: string,
      trimIn: number,
      trimOut: number,
      newStartTime?: number,
      newDuration?: number
    ): EditorProject => {
      return {
        ...project,
        timeline: project.timeline.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== clipId) {
              return clip;
            }

            const updatedClip: Clip = {
              ...clip,
              trimIn: Math.max(0, trimIn),
              trimOut: Math.max(0, trimOut),
            };

            if (newStartTime !== undefined) {
              updatedClip.startTime = Math.max(0, newStartTime);
            }

            if (newDuration !== undefined) {
              updatedClip.duration = Math.max(0.1, newDuration); // Minimum duration 0.1s
            }

            return updatedClip;
          }),
        })),
      };
    },
    []
  );

  return {
    deleteClip,
    duplicateClip,
    splitClip,
    moveClip,
    trimClip,
  };
}

