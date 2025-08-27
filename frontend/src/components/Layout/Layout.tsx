import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip, Button } from '@mui/material';
import { useContext } from 'react';
import { ColorModeContext } from '../../../pages/_app';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const colorMode = useContext(ColorModeContext);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ bgcolor: '#060606', paddingTop: '30px', }}>

          <Box sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',

          }}>

            <Box sx={{
              display: 'flex',
              width: '50%',
              justifyContent: 'space-between',
              alignItems: 'center',
              alignSelf: 'center',
              bgcolor: '#252525',
              borderRadius: '50px',
              paddingLeft: '20px', paddingRight: '10px',
              py: 1,
            }}>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    bgcolor: 'white',
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: 'black',
                      borderRadius: 0.5
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  VlogHub
                </Typography>
              </Box>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                px: 10,
                py: 1,
              }}>
                {['Home', 'Features', 'Examples', 'Blog'].map((item) => (
                  <Typography
                    key={item}
                    component="a"
                    href=""
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      textDecoration: 'none',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.2s'
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>

              <Button
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderRadius: '50px',
                  fontWeight: 500,
                  fontSize: '14px',
                  background: 'linear-gradient(180deg, #6D28D9 0%, #9333EA 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 0 30px rgba(124,58,237,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #6D28D9 0%, #6D28D9 100%)',
                    color: '#FFFFFF'
                  }
                }}
                onClick={() => {
                  router.push('/trending-topics');
                }}
              >
                ✨ Generate Now
              </Button>
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
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
