export const BACKGROUNDS_CACHE_MAX_AGE_LOCAL = 1 * 60 * 60 * 1000; // 1 hours in milliseconds
export const DRIVE_CLIENT_CREDENTIALS_FILE_NAME = 'gen-lang-client-0211941879-57f306607431.json';
export const PDF_TO_IMAGES_INTERVAL = 5000; // 5 seconds

// LocalStorage keys
export const LOCAL_STORAGE_KEYS = {
  APPROVED_SCRIPT: 'approvedScript',
  SCRIPT_METADATA: 'scriptMetadata'
} as const; 

// Routes keys
export const ROUTES_KEYS = {
  HOME: '/',
  TRENDING_TOPICS: '/trending-topics',
  SCRIPT_PRODUCTION: '/script-production',
  DASHBOARD: '/dashboard',
  SOCIAL_MEDIA: '/social-media'
} as const; 

export const SCRIPT_STATUS = {
  GENERATED: 'generated',
  APPROVED: 'approved',
  UPLOADED: 'uploaded'
} as const; 