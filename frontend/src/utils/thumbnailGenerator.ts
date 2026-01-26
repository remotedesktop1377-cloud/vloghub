/**
 * Generate thumbnail from video at specific time
 */
export async function generateVideoThumbnail(
  videoUrl: string,
  timeInSeconds: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.currentTime = timeInSeconds;
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration || 0);
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = (error) => {
      reject(new Error(`Failed to load video: ${error}`));
    };
    
    video.src = videoUrl;
  });
}

/**
 * Generate thumbnail from image (resize to thumbnail size)
 */
export async function generateImageThumbnail(
  imageUrl: string,
  maxWidth: number = 200,
  maxHeight: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        
        // Calculate thumbnail dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      reject(new Error(`Failed to load image: ${error}`));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Generate thumbnail for a clip
 */
export async function generateClipThumbnail(
  clip: { mediaId: string; mediaType: 'video' | 'image' | 'audio' | 'text'; startTime?: number },
  timeInSeconds: number = 0
): Promise<string | null> {
  try {
    if (clip.mediaType === 'video') {
      return await generateVideoThumbnail(clip.mediaId, timeInSeconds || clip.startTime || 0);
    } else if (clip.mediaType === 'image') {
      return await generateImageThumbnail(clip.mediaId);
    }
    // Audio and text clips don't have visual thumbnails
    return null;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
}

