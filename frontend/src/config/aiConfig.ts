export const AI_CONFIG = {
  // Gemini AI Configuration
  GEMINI: {
    MODEL: 'gemini-2.5-flash',
    TEMPERATURE: 0.8,
    MAX_RETRIES: 6,
    INITIAL_DELAY: 400, // ms
    BACKOFF_MULTIPLIER: 2,
    JITTER_FACTOR: 0.3,
  },
  
  // API Configuration
  API: {
    TIMEOUT: 30000, // 30 seconds
    MAX_CONTENT_LENGTH: 10000, // 10KB
  },
  
  // Content Generation Settings
  CONTENT: {
    DEFAULT_REGION: 'pakistan',
    MAX_TOPIC_SUGGESTIONS: 5,
    MAX_HYPOTHESIS_SUGGESTIONS: 5,
    TARGET_WORDS: 160,
    MAX_CHAPTERS: 10,
    MAX_IMAGES: 5,
  },
  
  // Retry Configuration for Rate Limiting
  RETRY: {
    STATUS_CODES: [429, 503, 504], // Rate limit, service unavailable, gateway timeout
    MAX_ATTEMPTS: 6,
    INITIAL_DELAY: 400,
    MAX_DELAY: 10000, // 10 seconds max delay
  },
} as const;

export type AiConfig = typeof AI_CONFIG; 