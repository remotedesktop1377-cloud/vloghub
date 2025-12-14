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
  API_GOOGLE_DRIVE_UPLOAD: '/api/google-drive-upload',
  API_GOOGLE_DRIVE_SCENE_UPLOAD: '/api/google-drive-scene-upload',
  API_GOOGLE_DRIVE_FOLDERS: '/api/google-drive-folders',
  API_GOOGLE_DRIVE_GENERATE_SCENE_FOLDERS: '/api/google-drive-generate-scene-folders',
  API_GOOGLE_DRIVE_LIBRARY: '/api/google-drive-library?category=all',
  API_GOOGLE_DRIVE_MEDIA: '/api/google-drive-media?id=',
  API_GOOGLE_DRIVE_MEDIA_UPLOAD: '/api/google-drive-media-upload',
  API_GOOGLE_DRIVE_IMAGE_UPLOAD: '/api/google-drive-image-upload',
  API_GOOGLE_DRIVE_OUTPUT_VIDEOS: '/api/google-drive-output',
  API_TRANSCRIBE_VIDEO: '/api/transcribe',
  API_GOOGLE_DRIVE_GENERATE_FOLDER: '/api/google-drive-generate-folder',
  API_GAMMA_GENERATE: '/api/gamma-generate',
  GAMMA_API_GENERATION_API: 'https://public-api.gamma.app/v0.2/generations',
  ENHANCE_TITLE_FOR_THUMBNAIL: '/api/enhance-title-for-thumbnail',
  GENERATE_THUMBNAIL: '/api/generate-thumbnail',

} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]; 