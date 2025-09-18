'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/utils/supabase';
import { toast } from 'react-toastify';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed. Please try again.');
          router.push('/');
          return;
        }

        if (data.session) {
          toast.success('Successfully signed in with Google!');
          // Redirect to the originally intended page or trending topics
          const redirectTo = sessionStorage.getItem('authRedirectTo') || '/trending-topics';
          sessionStorage.removeItem('authRedirectTo');
          router.push(redirectTo);
        } else {
          // No session found, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected auth error:', error);
        toast.error('An unexpected error occurred');
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#121212',
        color: 'white',
        gap: 3,
      }}
    >
      <CircularProgress
        size={48}
        sx={{
          color: '#C6ACFD',
        }}
      />
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Completing sign in...
      </Typography>
      <Typography variant="body1" sx={{ color: '#9ca3af', textAlign: 'center', maxWidth: 400 }}>
        Please wait while we complete your Google sign in and redirect you to the application.
      </Typography>
    </Box>
  );
}
