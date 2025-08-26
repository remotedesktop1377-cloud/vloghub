import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { useContext } from 'react';
import { ColorModeContext } from '../../../pages/_app';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const colorMode = useContext(ColorModeContext);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ px: 3, py: 1 }}>
          {/* Left Section - Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #FFFFFF, #FFFFFF)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}
            >
              Topics Script Generation
            </Typography>
          </Box>

          {/* Center Section - Search Bar */}
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            mx: 4
          }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 500,
                height: 40,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                px: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                🔍 Search trending topics...
              </Typography>
            </Box>
          </Box>

          {/* Right Section - Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Tooltip title={`Switch to ${colorMode.mode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton color="inherit" onClick={colorMode.toggle} size="small">
                {colorMode.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
