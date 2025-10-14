export const USE_HARDCODED = false;
export const HARDCODED_TOPIC = "Nelson Mandela's legacy in Pakistan: Examining his impact on anti-apartheid movements and social justice.";
export const HARDCODED_HYPOTHESIS = "Mandela's anti-apartheid struggle resonated deeply within Pakistan's own fight against oppression, inspiring local activism.";
export const DEFAULT_AI_PROMPT = "Today, I'm giving you a quick tutorial on Nelson Mandela's incredible life.";

// LocalStorage keys
export const LOCAL_STORAGE_KEYS = {
  APPROVED_SCRIPT: 'approvedScript',
  SCRIPT_METADATA: 'scriptMetadata'
} as const; 

// Routes keys
export const ROUTES_KEYS = {
  HOME: '/',
  TRENDING_TOPICS: '/trending-topics',
  SCRIPT_PRODUCTION: '/script-production'
} as const; 

export const SCRIPT_STATUS = {
  GENERATED: 'generated',
  APPROVED: 'approved',
  UPLOADED: 'uploaded'
} as const; 