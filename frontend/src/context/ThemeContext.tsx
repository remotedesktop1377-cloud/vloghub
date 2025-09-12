'use client';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { PRIMARY, SECONDARY, BACKGROUND } from '../styles/colors';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: PRIMARY.main,
      light: PRIMARY.light,
      dark: PRIMARY.dark,
      contrastText: PRIMARY.contrastText
    },
    secondary: { 
      main: SECONDARY.main,
      light: SECONDARY.light,
      dark: SECONDARY.dark,
      contrastText: SECONDARY.contrastText
    },
    background: { 
      default: BACKGROUND.default, 
      paper: BACKGROUND.paper
    }
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BACKGROUND.default,
          color: '#ffffff',
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

