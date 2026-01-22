import { useCallback } from 'react';
import { EditorProject, Clip, Track } from '@/types/videoEditor';

export interface AudioEditingActions {
  setClipVolume: (project: EditorProject, clipId: string, volume: number) => EditorProject;
  setClipMuted: (project: EditorProject, clipId: string, muted: boolean) => EditorProject;
  setClipFadeIn: (project: EditorProject, clipId: string, fadeIn: number) => EditorProject;
  setClipFadeOut: (project: EditorProject, clipId: string, fadeOut: number) => EditorProject;
  setClipLoop: (project: EditorProject, clipId: string, loop: boolean) => EditorProject;
  detachAudioFromVideo: (project: EditorProject, clipId: string) => EditorProject;
  attachAudioToVideo: (project: EditorProject, clipId: string) => EditorProject;
  setTrackMuted: (project: EditorProject, trackId: string, muted: boolean) => EditorProject;
  setTrackVolume: (project: EditorProject, trackId: string, volume: number) => EditorProject;
  getEffectiveVolume: (clip: Clip, track: Track) => number;
  getEffectiveMuted: (clip: Clip, track: Track) => boolean;
}

export function useAudioEditing(): AudioEditingActions {
  // Helper to find clip in project
  const findClip = useCallback((project: EditorProject, clipId: string): { clip: Clip; track: Track } | null => {
    for (const track of project.timeline) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) {
        return { clip, track };
      }
    }
    return null;
  }, []);

  // Helper to update clip in project
  const updateClip = useCallback(
    (
      project: EditorProject,
      clipId: string,
      updater: (clip: Clip) => Clip
    ): EditorProject => {
      return {
        ...project,
        timeline: project.timeline.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => (clip.id === clipId ? updater(clip) : clip)),
        })),
      };
    },
    []
  );

  const setClipVolume = useCallback(
    (project: EditorProject, clipId: string, volume: number): EditorProject => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      return updateClip(project, clipId, (clip) => ({
        ...clip,
        properties: {
          ...clip.properties,
          volume: clampedVolume,
        },
      }));
    },
    [updateClip]
  );

  const setClipMuted = useCallback(
    (project: EditorProject, clipId: string, muted: boolean): EditorProject => {
      return updateClip(project, clipId, (clip) => ({
        ...clip,
        properties: {
          ...clip.properties,
          muted,
        },
      }));
    },
    [updateClip]
  );

  const setClipFadeIn = useCallback(
    (project: EditorProject, clipId: string, fadeIn: number): EditorProject => {
      const clampedFadeIn = Math.max(0, fadeIn);
      return updateClip(project, clipId, (clip) => ({
        ...clip,
        properties: {
          ...clip.properties,
          fadeIn: clampedFadeIn,
        },
      }));
    },
    [updateClip]
  );

  const setClipFadeOut = useCallback(
    (project: EditorProject, clipId: string, fadeOut: number): EditorProject => {
      const clampedFadeOut = Math.max(0, fadeOut);
      return updateClip(project, clipId, (clip) => ({
        ...clip,
        properties: {
          ...clip.properties,
          fadeOut: clampedFadeOut,
        },
      }));
    },
    [updateClip]
  );

  const setClipLoop = useCallback(
    (project: EditorProject, clipId: string, loop: boolean): EditorProject => {
      return updateClip(project, clipId, (clip) => ({
        ...clip,
        properties: {
          ...clip.properties,
          loop,
        },
      }));
    },
    [updateClip]
  );

  const detachAudioFromVideo = useCallback(
    (project: EditorProject, clipId: string): EditorProject => {
      const found = findClip(project, clipId);
      if (!found || found.clip.mediaType !== 'video') {
        return project; // Can only detach audio from video clips
      }

      // Create a new audio clip from the video's audio
      const videoClip = found.clip;
      const audioClipId = `audio-${clipId}-${Date.now()}`;
      const audioClip: Clip = {
        id: audioClipId,
        mediaId: videoClip.mediaId, // Same media source
        mediaType: 'audio',
        startTime: videoClip.startTime,
        duration: videoClip.duration,
        trimIn: videoClip.trimIn,
        trimOut: videoClip.trimOut,
        properties: {
          ...videoClip.properties,
          audioDetached: false, // This is the audio clip, not detached
        },
        sceneId: videoClip.sceneId,
      };

      // Mark video clip as having detached audio and store the audio clip ID
      const updatedProject = updateClip(project, clipId, (clip) => ({
        ...clip,
        properties: {
          ...clip.properties,
          audioDetached: true,
          detachedAudioClipId: audioClipId,
        },
      }));

      // Find or create an audio track
      let audioTrack = updatedProject.timeline.find((t) => t.type === 'audio');
      if (!audioTrack) {
        audioTrack = {
          id: `audio-track-${Date.now()}`,
          type: 'audio',
          clips: [],
        };
        updatedProject.timeline.push(audioTrack);
      }

      // Add audio clip to audio track
      audioTrack.clips.push(audioClip);

      return {
        ...updatedProject,
        timeline: updatedProject.timeline.map((track) =>
          track.id === audioTrack!.id ? audioTrack! : track
        ),
      };
    },
    [findClip, updateClip]
  );

  const attachAudioToVideo = useCallback(
    (project: EditorProject, clipId: string): EditorProject => {
      const found = findClip(project, clipId);
      if (!found || found.clip.mediaType !== 'video' || !found.clip.properties.audioDetached) {
        return project; // Can only attach if audio was previously detached
      }

      // Get the detached audio clip ID from the video clip's properties
      const detachedAudioClipId = found.clip.properties.detachedAudioClipId;
      if (!detachedAudioClipId) {
        return project; // No detached audio clip ID found
      }

      // Find and remove the detached audio clip
      const updatedProject = {
        ...project,
        timeline: project.timeline.map((track) => {
          if (track.type === 'audio') {
            const filteredClips = track.clips.filter((clip) => clip.id !== detachedAudioClipId);
            return { ...track, clips: filteredClips };
          }
          return track;
        }),
      };

      // Re-attach audio to video clip
      return updateClip(updatedProject, clipId, (clip) => ({
        ...clip,
        properties: {
          ...clip.properties,
          audioDetached: false,
          detachedAudioClipId: undefined,
        },
      }));
    },
    [findClip, updateClip]
  );

  const setTrackMuted = useCallback(
    (project: EditorProject, trackId: string, muted: boolean): EditorProject => {
      return {
        ...project,
        timeline: project.timeline.map((track) =>
          track.id === trackId ? { ...track, muted } : track
        ),
      };
    },
    []
  );

  const setTrackVolume = useCallback(
    (project: EditorProject, trackId: string, volume: number): EditorProject => {
      // Note: Track-level volume is not in the current type definition
      // This would require extending Track interface, but for now we'll store it
      // in a way that can be accessed. For simplicity, we'll apply volume to all clips in the track.
      const clampedVolume = Math.max(0, Math.min(1, volume));
      return {
        ...project,
        timeline: project.timeline.map((track) =>
          track.id === trackId
            ? {
                ...track,
                clips: track.clips.map((clip) => ({
                  ...clip,
                  properties: {
                    ...clip.properties,
                    volume: clampedVolume,
                  },
                })),
              }
            : track
        ),
      };
    },
    []
  );

  // Calculate effective volume considering both clip and track settings
  const getEffectiveVolume = useCallback((clip: Clip, track: Track): number => {
    const clipVolume = clip.properties.volume ?? 1;
    // If track is muted, volume is 0
    if (track.muted) {
      return 0;
    }
    // If clip is muted, volume is 0
    if (clip.properties.muted) {
      return 0;
    }
    return clipVolume;
  }, []);

  // Calculate effective muted state
  const getEffectiveMuted = useCallback((clip: Clip, track: Track): boolean => {
    return track.muted || clip.properties.muted || false;
  }, []);

  return {
    setClipVolume,
    setClipMuted,
    setClipFadeIn,
    setClipFadeOut,
    setClipLoop,
    detachAudioFromVideo,
    attachAudioToVideo,
    setTrackMuted,
    setTrackVolume,
    getEffectiveVolume,
    getEffectiveMuted,
  };
}

