export const API_ENDPOINTS = {
  // Trending Topics
  TRENDING_TOPICS: '/api/trending-topics',
  
  // Topic Management
  TOPIC_SUGGESTIONS: '/api/get-topic-suggestions',
  HYPOTHESIS_SUGGESTIONS: '/api/get-hypothesis-suggestions',
  
  // Content Enhancement
  ENHANCE_TOPIC_DETAILS: '/api/enhance-topic-details',
  ENHANCE_HYPOTHESIS: '/api/enhance-hypothesis',
  
  // Content Generation
  GENERATE_CHAPTERS: '/api/generate-chapters',
  GENERATE_IMAGES: '/api/generate-images',
  
  // Narration
  NARRATION_VARIATIONS: '/api/get-narration-variations',
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]; 