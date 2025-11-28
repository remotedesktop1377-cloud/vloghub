'use client';

import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { BACKGROUND, TEXT, PURPLE, SHADOW, NEUTRAL } from '../../../styles/colors';
import { ROUTES_KEYS } from '../../../data/constants';
import { AuthenticatedButton } from '../../auth/AuthenticatedButton';

interface LayoutProps {
  children: React.ReactNode;
  showToolbar?: boolean;
}

const LandingToolbar: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {(
        <AppBar position="static" sx={{ display: { xs: 'none', md: 'block' } }}>
          <Toolbar sx={{ bgcolor: BACKGROUND.default, py: 2 }}>
            <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', px: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, bgcolor: BACKGROUND.secondary, borderRadius: '9999px', px: 3, py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 18, height: 18, bgcolor: NEUTRAL.white, borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: NEUTRAL.black, borderRadius: 0.5 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT.primary }}>VlogHub</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {['Home', 'Features', 'Examples', 'Blog'].map((item) => (
                    <Typography key={item} component="a" href="#" sx={{ color: TEXT.secondary, textDecoration: 'none', '&:hover': { color: TEXT.primary }, transition: 'color 0.2s' }}>{item}</Typography>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AuthenticatedButton 
                    targetRoute={ROUTES_KEYS.DASHBOARD}
                    variant="outlined" 
                    sx={{ 
                      px: 2, 
                      py: 1.2, 
                      borderRadius: '999px', 
                      fontSize: '13px', 
                      textTransform: 'none',
                      borderColor: TEXT.secondary,
                      color: TEXT.secondary,
                      '&:hover': { 
                        borderColor: TEXT.primary,
                        color: TEXT.primary,
                        backgroundColor: 'rgba(148, 163, 184, 0.12)'
                      } 
                    }}
                    requireAuth={true}
                    authenticatedLabel="Dashboard"
                    guestLabel="Dashboard"
                  >
                    Dashboard
                  </AuthenticatedButton>
                  <AuthenticatedButton 
                    targetRoute={ROUTES_KEYS.TRENDING_TOPICS}
                    variant="contained" 
                    sx={{ 
                      px: 2.5, 
                      py: 1.5, 
                      borderRadius: '50px', 
                      fontSize: '14px', 
                      textTransform: 'none', 
                      background: PURPLE.gradient.primary, 
                      color: TEXT.primary, 
                      boxShadow: `0 0 30px ${SHADOW.primary}`, 
                      '&:hover': { 
                        background: PURPLE.gradient.secondary, 
                        color: TEXT.primary 
                      } 
                    }}
                    requireAuth={true}
                    authenticatedLabel="✨ Generate Now"
                    guestLabel="Login"
                  >
                    ✨ Generate Now
                  </AuthenticatedButton>
                </Box>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
        }}
      >
        {children}
      </Box>

     
    </Box>
  );
};

export default LandingToolbar;
