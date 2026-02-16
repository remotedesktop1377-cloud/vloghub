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
  GAMMA_API_GENERATION_API: 'https://public-api.gamma.app/v1.0/generations/',
  ENHANCE_TITLE_FOR_THUMBNAIL: '/api/enhance-title-for-thumbnail',

  YOUTUBE_PUBLISH: '/api/youtube-publish',
  FACEBOOK_PUBLISH: '/api/facebook-publish',
  FACEBOOK_SELECT_PAGE: '/api/facebook-select-page',
  GET_NARRATION_VARIATIONS: '/api/get-narration-variations',

  PUBLISHED_VIDEOS: '/api/published-videos',
  YOUTUBE_DELETE: '/api/youtube-delete',

  YOUTUBE_OAUTH_INITIATE: '/api/youtube-oauth/initiate',
  FACEBOOK_OAUTH_INITIATE: '/api/facebook-oauth/initiate',
  YOUTUBE_OAUTH_CALLBACK: '/api/youtube-oauth/callback',
  FACEBOOK_OAUTH_CALLBACK: '/api/facebook-oauth/callback',

  GOOGLE_DRIVE_MEDIA_BASE: '/api/google-drive-media',
  SERVE_CLIP_BASE: '/api/serve-clip',
  PROGRESS: '/api/progress',

  GAMMA_PDF: '/api/gamma-pdf',

  PYTHON_COMPRESS_VIDEO: '/api/compress-video',
  API_TRANSCRIBE_AUDIO: '/api/transcribe-audio',
  PLAN_SCENES: '/api/plan-scenes',
  CUT_CLIPS: '/api/cut-clips',
  GENERATE_SCENE_BACKGROUNDS: '/api/generate-scene-backgrounds',
  CLEANUP_EXPORTS: '/api/cleanup-exports',

  LAMBDA_DEPLOY_FUNCTION: '/api/lambda/deploy-function',
  LAMBDA_DEPLOY_SITE: '/api/lambda/deploy-site',
  LAMBDA_RENDER: '/api/lambda/render',
  LAMBDA_RENDER_PROGRESS: '/api/lambda/render-progress',
  LAMBDA_GET_FUNCTIONS: '/api/lambda/get-functions',
  LAMBDA_QUOTAS: '/api/lambda/quotas',
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS]; 