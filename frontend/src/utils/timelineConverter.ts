import { SceneData } from '@/types/sceneData';
import { EditorProject, Track, Clip, ClipProperties } from '@/types/videoEditor';

/**
 * Convert SceneData array to EditorProject timeline structure
 */
export function scenesDataToEditorProject(
  scenesData: SceneData[],
  narratorVideoUrl?: string
): EditorProject {
  const tracks: Track[] = [];
  let totalDuration = 0;
  let currentTime = 0;

  // Create video track for narrator video (if provided)
  const videoTrack: Track = {
    id: 'track-narrator-video',
    type: 'video',
    clips: [],
  };

  // Create overlay track for images/text
  const overlayTrack: Track = {
    id: 'track-overlay',
    type: 'overlay',
    clips: [],
  };

  // Create audio track for background music
  const audioTrack: Track = {
    id: 'track-audio',
    type: 'audio',
    clips: [],
  };

  // Process each scene
  scenesData.forEach((scene, index) => {
    const sceneDuration = scene.durationInSeconds || 0;
    const sceneStartTime = scene.startTime || currentTime;

    // Add narrator video clip for this scene (if narrator video exists)
    // Only add one narrator video track that spans all scenes
    if (narratorVideoUrl && index === 0 && sceneDuration > 0) {
      // Calculate total duration for narrator video
      const totalNarratorDuration = scenesData.reduce((sum, s) => sum + (s.durationInSeconds || 0), 0);
      
      const narratorClip: Clip = {
        id: 'clip-narrator-main',
        mediaId: narratorVideoUrl,
        mediaType: 'video',
        startTime: 0,
        duration: totalNarratorDuration,
        trimIn: 0,
        trimOut: totalNarratorDuration,
        properties: {
          volume: 1,
          opacity: 1,
        },
        sceneId: 'narrator-main',
      };
      videoTrack.clips.push(narratorClip);
    }

    // Track current time offset for this scene to prevent overlaps
    let sceneClipOffset = 0;
    const offsetIncrement = 0.1; // 0.1 second offset between clips

    // Add background images from scene assets
    if (scene.assets?.images && scene.assets.images.length > 0) {
      scene.assets.images.forEach((imageUrl, imgIndex) => {
        const imageClip: Clip = {
          id: `clip-image-${scene.id || index}-${imgIndex}`,
          mediaId: imageUrl,
          mediaType: 'image',
          startTime: sceneStartTime + sceneClipOffset,
          duration: sceneDuration,
          trimIn: 0,
          trimOut: sceneDuration,
          properties: {
            opacity: 1,
          },
          sceneId: scene.id,
        };
        overlayTrack.clips.push(imageClip);
        // Stagger next clip to prevent visual overlap
        sceneClipOffset += offsetIncrement;
      });
    }

    // Add video clips from scene assets
    if (scene.assets?.clips && scene.assets.clips.length > 0) {
      scene.assets.clips.forEach((videoClip, clipIndex) => {
        const clipDuration = videoClip.duration || sceneDuration;
        const clip: Clip = {
          id: `clip-video-${scene.id || index}-${clipIndex}`,
          mediaId: videoClip.url,
          mediaType: 'video',
          startTime: sceneStartTime + sceneClipOffset,
          duration: clipDuration,
          trimIn: 0,
          trimOut: clipDuration,
          properties: {
            volume: 1,
            opacity: 1,
          },
          sceneId: scene.id,
        };
        videoTrack.clips.push(clip);
        // Stagger next clip to prevent visual overlap
        sceneClipOffset += Math.max(clipDuration, offsetIncrement);
      });
    }

    // Add background music from scene settings
    if (scene.sceneSettings?.videoBackgroundMusic?.webViewLink) {
      // Note: We don't know the exact duration of background music, so we'll use scene duration
      // In a real implementation, you'd need to fetch the audio duration
      const musicClip: Clip = {
        id: `clip-music-${scene.id || index}`,
        mediaId: scene.sceneSettings.videoBackgroundMusic.webViewLink,
        mediaType: 'audio',
        startTime: sceneStartTime,
        duration: sceneDuration,
        trimIn: 0,
        trimOut: sceneDuration,
        properties: {
          volume: 0.5, // Default volume for background music
        },
        sceneId: scene.id,
      };
      audioTrack.clips.push(musicClip);
    }

    // Update total duration
    const sceneEndTime = sceneStartTime + sceneDuration;
    totalDuration = Math.max(totalDuration, sceneEndTime);
    currentTime = sceneEndTime;
  });

  // Sort all clips by startTime to ensure proper ordering
  videoTrack.clips.sort((a, b) => a.startTime - b.startTime);
  overlayTrack.clips.sort((a, b) => a.startTime - b.startTime);
  audioTrack.clips.sort((a, b) => a.startTime - b.startTime);

  // Add tracks only if they have clips
  if (videoTrack.clips.length > 0) {
    tracks.push(videoTrack);
  }
  if (overlayTrack.clips.length > 0) {
    tracks.push(overlayTrack);
  }
  if (audioTrack.clips.length > 0) {
    tracks.push(audioTrack);
  }

  return {
    timeline: tracks,
    playheadTime: 0,
    aspectRatio: '16:9',
    totalDuration: totalDuration || 0,
  };
}

/**
 * Convert EditorProject timeline back to SceneData array
 */
export function editorProjectToScenesData(
  project: EditorProject,
  originalScenesData: SceneData[]
): SceneData[] {
  const updatedScenes: SceneData[] = [];

  // Group clips by sceneId
  const clipsByScene = new Map<string, Clip[]>();
  project.timeline.forEach((track) => {
    track.clips.forEach((clip) => {
      if (clip.sceneId) {
        if (!clipsByScene.has(clip.sceneId)) {
          clipsByScene.set(clip.sceneId, []);
        }
        clipsByScene.get(clip.sceneId)!.push(clip);
      }
    });
  });

  // Update each scene based on clips
  originalScenesData.forEach((originalScene) => {
    const sceneClips = clipsByScene.get(originalScene.id) || [];
    
    // Find the main video clip for this scene (narrator video)
    const narratorClip = sceneClips.find(
      (clip) => clip.id.startsWith('clip-narrator-') && clip.mediaType === 'video'
    );

    // Find image clips for this scene
    const imageClips = sceneClips.filter(
      (clip) => clip.mediaType === 'image'
    );

    // Find video clips (non-narrator) for this scene
    const videoClips = sceneClips.filter(
      (clip) => clip.mediaType === 'video' && !clip.id.startsWith('clip-narrator-')
    );

    // Find audio clips for this scene
    const audioClips = sceneClips.filter(
      (clip) => clip.mediaType === 'audio'
    );

    // Update scene duration based on clips
    let sceneDuration = originalScene.durationInSeconds;
    if (narratorClip) {
      sceneDuration = narratorClip.duration;
    }

    // Update scene start/end times
    const sceneStartTime = narratorClip?.startTime || originalScene.startTime;
    const sceneEndTime = sceneStartTime + sceneDuration;

    // Update assets
    const updatedAssets = {
      images: imageClips.map((clip) => clip.mediaId),
      clips: videoClips.map((clip) => ({
        id: clip.id,
        name: clip.id,
        url: clip.mediaId,
        duration: clip.duration,
      })),
    };

    // Update scene settings if audio clip exists
    let updatedSceneSettings = originalScene.sceneSettings;
    if (audioClips.length > 0 && updatedSceneSettings) {
      updatedSceneSettings = {
        ...updatedSceneSettings,
        videoBackgroundMusic: {
          webViewLink: audioClips[0].mediaId,
          webContentLink: audioClips[0].mediaId,
        },
      };
    }

    const updatedScene: SceneData = {
      ...originalScene,
      startTime: sceneStartTime,
      endTime: sceneEndTime,
      durationInSeconds: sceneDuration,
      duration: `${Math.floor(sceneDuration / 60)}:${Math.floor(sceneDuration % 60).toString().padStart(2, '0')}`,
      assets: updatedAssets,
      sceneSettings: updatedSceneSettings,
    };

    updatedScenes.push(updatedScene);
  });

  return updatedScenes;
}

/**
 * Extract narrator video URL from ScriptData
 */
export function getNarratorVideoUrl(scriptData: any): string | undefined {
  return scriptData?.narrator_chroma_key_link;
}

