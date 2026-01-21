import { API_ENDPOINTS } from '@/config/apiEndpoints';

export const FACEBOOK_OAUTH_CONFIG = {
  APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
  APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  REDIRECT_URI: `${typeof window !== 'undefined' ? window.location.origin : ''}${API_ENDPOINTS.FACEBOOK_OAUTH_CALLBACK}`,
  SCOPES: [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'public_profile',
  ],
  AUTH_URL: 'https://www.facebook.com/v18.0/dialog/oauth',
  TOKEN_URL: 'https://graph.facebook.com/v18.0/oauth/access_token',
  GRAPH_API_BASE: 'https://graph.facebook.com/v18.0',
} as const;

