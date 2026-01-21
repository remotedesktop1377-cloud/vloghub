import { API_ENDPOINTS } from '@/config/apiEndpoints';

export const YOUTUBE_OAUTH_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}${API_ENDPOINTS.YOUTUBE_OAUTH_CALLBACK}`,
  SCOPES: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
} as const;

