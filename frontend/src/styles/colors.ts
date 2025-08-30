// Color palette for the YouTube Clone application
// All hardcoded colors from the codebase are organized here for consistency

// Primary Colors
export const PRIMARY = {
  main: '#1976d2',
  light: '#1565c0',
  dark: '#0d47a1',
  contrastText: '#ffffff'
};

// Secondary Colors
export const SECONDARY = {
  main: '#dc004e',
  light: '#ff5983',
  dark: '#9a0036'
};

// Success Colors
export const SUCCESS = {
  main: '#4caf50',
  light: '#66bb6a',
  dark: '#388e3c',
  contrastText: '#ffffff'
};

// Warning Colors
export const WARNING = {
  main: '#ff9800',
  light: '#ffb74d',
  dark: '#f57c00',
  contrastText: '#ffffff'
};

// Error Colors
export const ERROR = {
  main: '#ef4444',
  light: '#f87171',
  dark: '#cc0000',
  contrastText: '#ffffff'
};

// Info Colors
export const INFO = {
  main: '#1DA1F2',
  light: '#4db5f7',
  dark: '#0d8bd9',
  contrastText: '#ffffff'
};

// Purple Colors (for gradients and accents)
export const PURPLE = {
  main: '#6D28D9',
  light: '#9333EA',
  dark: '#5B21B6',
  gradient: {
    primary: 'linear-gradient(180deg, #6D28D9 0%, #9333EA 100%)',
    secondary: 'linear-gradient(90deg, #6D28D9 0%, #6D28D9 100%)',
    blue: 'linear-gradient(135deg, #5b76ff, #9b8cff)',
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
};

// Neutral Colors
export const NEUTRAL = {
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

// Background Colors
export const BACKGROUND = {
  default: '#060606',
  paper: '#060606',
  secondary: '#252525',
  tertiary: '#121212',
  quaternary: '#1a1a1a',
  light: '#fafafa',
  overlay: {
    light: 'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.7)',
    darkest: 'rgba(0, 0, 0, 0.8)',
    black: 'rgba(0, 0, 0, 0.9)'
  }
};

// Text Colors
export const TEXT = {
  primary: '#ffffff',
  secondary: 'rgba(255, 255, 255, 0.7)',
  muted: '#7C7C7C',
  light: '#e0e0e0',
  dark: '#666666',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#ef4444',
  info: '#1DA1F2'
};

// Border Colors
export const BORDER = {
  light: '#e0e0e0',
  medium: '#ccc',
  dark: '#e9ecef',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#ef4444',
  info: '#1DA1F2',
  selected: '#1976d2'
};

// Status Colors (for rankings, achievements, etc.)
export const STATUS = {
  gold: '#FFD700',      // #1 ranking
  silver: '#C0C0C0',    // #2 ranking
  bronze: '#CD7F32',    // #3 ranking
  blue: '#4A90E2'       // other rankings
};

// Shadow Colors
export const SHADOW = {
  primary: 'rgba(124, 58, 237, 0.35)',
  secondary: 'rgba(108, 56, 243, 0.1)',
  tertiary: 'rgba(108, 56, 243, 0.08)',
  quaternary: 'rgba(108, 56, 243, 0.06)',
  quinary: 'rgba(108, 56, 243, 0.04)',
  senary: 'rgba(108, 56, 243, 0.02)',
  black: 'rgba(0, 0, 0, 0.1)',
  dark: 'rgba(0, 0, 0, 0.2)',
  darker: 'rgba(0, 0, 0, 0.3)',
  darkest: 'rgba(0, 0, 0, 0.4)'
};

// Hover Colors
export const HOVER = {
  success: 'rgba(76, 175, 80, 0.1)',
  warning: 'rgba(255, 152, 0, 0.1)',
  info: 'rgba(29, 161, 242, 0.1)',
  infoLight: 'rgba(29, 161, 242, 0.08)',
  infoLighter: 'rgba(29, 161, 242, 0.06)',
  infoLightest: 'rgba(29, 161, 242, 0.02)',
  error: 'rgba(255, 68, 68, 0.1)',
  light: '#f9fafb'
};

// Special Colors
export const SPECIAL = {
  blue: '#2196f3',
  purple: '#9c27b0',
  lightBlue: '#e3f2fd',
  lightGray: '#f9f9f9'
};

// Export all colors as a single object for easy access
export const COLORS = {
  PRIMARY,
  SECONDARY,
  SUCCESS,
  WARNING,
  ERROR,
  INFO,
  PURPLE,
  NEUTRAL,
  BACKGROUND,
  TEXT,
  BORDER,
  STATUS,
  SHADOW,
  HOVER,
  SPECIAL
};

// Default export for convenience
export default COLORS;
