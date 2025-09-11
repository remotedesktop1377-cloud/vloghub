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
  
  // Google Drive APIs
  GOOGLE_DRIVE_UPLOAD: '/api/google-drive-upload',
  GOOGLE_DRIVE_FOLDERS: '/api/google-drive-folders',
  
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]; 