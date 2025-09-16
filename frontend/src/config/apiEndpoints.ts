export const API_ENDPOINTS = {
  // Trending Topics (Gemini only)
  GEMINI_TRENDING_TOPICS: '/api/gemini-trending-topics',

  // Content Generation
  GENERATE_SCRIPT: '/api/generate-script',
  GENERATE_IMAGES: '/api/generate-images',
  GEMINI_HIGHLIGHT_KEYWORDS: '/api/gemini-highlight-keywords',
  
  // Image Search APIs
  GOOGLE_IMAGE_SEARCH: '/api/google-image-search',
  ENVATO_IMAGE_SEARCH: '/api/envato-image-search',
  ENVATO_CLIPS_SEARCH: '/api/envato-clips-search',
  
  // Google Drive APIs
  GOOGLE_DRIVE_UPLOAD: '/api/google-drive-upload',
  GOOGLE_DRIVE_SCENE_UPLOAD: '/api/google-drive-scene-upload',
  GOOGLE_DRIVE_FOLDERS: '/api/google-drive-folders',
  GOOGLE_DRIVE_LIBRARY: '/api/google-drive-library?category=all',
  GOOGLE_DRIVE_MEDIA: '/api/google-drive-media?id=',
  GOOGLE_DRIVE_MEDIA_UPLOAD: '/api/google-drive-media-upload',
  GOOGLE_DRIVE_IMAGE_UPLOAD: '/api/google-drive-image-upload',
  
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]; 