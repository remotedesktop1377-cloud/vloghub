'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../../../src/utils/supabase';
import { toast } from 'react-toastify';
import { Box, Typography, CircularProgress } from '@mui/material';
import { ROUTES_KEYS } from '@/data/constants';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await getSupabase().auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed. Please try again.');
          router.push(ROUTES_KEYS.HOME);
          return;
        }

        if (data.session) {
          console.log('Successfully signed in with Google!');
          toast.success('Successfully signed in with Google!');
          
          router.push(ROUTES_KEYS.TRENDING_TOPICS);
        } else {
          // No session found, redirect to home
          router.push(ROUTES_KEYS.HOME);
        }
      } catch (error) {
        console.error('Unexpected auth error:', error);
        toast.error('An unexpected error occurred');
        router.push(ROUTES_KEYS.HOME);
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
