import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              <Typography sx={{ fontSize: '1.1rem' }}>⚙️</Typography>
            </Box>

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
