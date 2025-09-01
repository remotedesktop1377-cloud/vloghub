export const API_ENDPOINTS = {
  // Trending Topics (Gemini only)
  GEMINI_TRENDING_TOPICS: '/api/gemini-trending-topics',

  // Content Generation
  GENERATE_SCRIPT: '/api/generate-script',
  GENERATE_IMAGES: '/api/generate-images',
  
  // Google Image Search
  GOOGLE_IMAGE_SEARCH: '/api/google-image-search',
  
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]; 