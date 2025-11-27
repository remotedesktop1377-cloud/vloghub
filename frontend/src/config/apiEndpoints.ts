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
  API_GOOGLE_DRIVE_UPLOAD: '/api/google-drive-upload', // to upload project config json to drive
  API_GOOGLE_DRIVE_SCENE_UPLOAD: '/api/google-drive-scene-upload', // to update scene json on drive
  API_GOOGLE_DRIVE_FOLDERS: '/api/google-drive-folders', // to get all folders on drive
  API_GOOGLE_DRIVE_GENERATE_SCENE_FOLDERS: '/api/google-drive-generate-scene-folders', // to generate scene folders on drive
  API_GOOGLE_DRIVE_LIBRARY: '/api/google-drive-library?category=all', // to get all library files on drive
  API_GOOGLE_DRIVE_MEDIA: '/api/google-drive-media?id=', // to get a media file from drive
  API_GOOGLE_DRIVE_MEDIA_UPLOAD: '/api/google-drive-media-upload', // to upload a media file to drive
  API_GOOGLE_DRIVE_IMAGE_UPLOAD: '/api/google-drive-image-upload', // to upload an image to drive
  API_TRANSCRIBE_VIDEO: '/api/transcribe', // to transcribe a video file
  API_GOOGLE_DRIVE_GENERATE_FOLDER: '/api/google-drive-generate-folder', // to generate a folder on drive
  API_GAMMA_GENERATE: '/api/gamma-generate', // to generate a gamma video
  GAMMA_API_GENERATION_API: 'https://public-api.gamma.app/v0.2/generations', // to call gamma api generation api

} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]; 