'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../../../src/utils/supabase';
import { toast } from 'react-toastify';
import { Box, Typography, CircularProgress } from '@mui/material';
import { ROUTES_KEYS } from '@/data/constants';

const getPostAuthRedirect = (): string => {
  if (typeof window === 'undefined') return ROUTES_KEYS.TRENDING_TOPICS;
  const stored = sessionStorage.getItem('authRedirectTo');
  if (stored) {
    sessionStorage.removeItem('authRedirectTo');
    return stored;
  }
  return ROUTES_KEYS.TRENDING_TOPICS;
};

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const supabase = getSupabase();
    let timeoutId: NodeJS.Timeout;
    let authStateSubscription: { unsubscribe: () => void } | null = null;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth callback - state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('Successfully signed in with Google!');
          setStatus('success');
          toast.success('Successfully signed in with Google!');
          
          // Clear any timeout
          if (timeoutId) clearTimeout(timeoutId);
          
          // Wait a moment for AuthContext to update, then redirect
          const redirectTarget = getPostAuthRedirect();
          setTimeout(() => {
            router.push(redirectTarget);
          }, 1500);
        } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          setStatus('error');
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => {
            router.push(ROUTES_KEYS.HOME);
          }, 2000);
        }
      }
    );

    authStateSubscription = subscription;

    // Also try to get session immediately as a fallback
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.log('Error getting session:', error);
        }
        
        if (session) {
          console.log('Session found immediately');
          setStatus('success');
          toast.success('Successfully signed in with Google!');
          
          if (authStateSubscription) {
            authStateSubscription.unsubscribe();
          }
          
          const redirectTarget = getPostAuthRedirect();
          setTimeout(() => {
            router.push(redirectTarget);
          }, 1500);
        } else {
          // Set a timeout to show error if no session after 10 seconds
          timeoutId = setTimeout(() => {
            setStatus('error');
            toast.error('Authentication timed out. Please try again.');
            setTimeout(() => {
              router.push(ROUTES_KEYS.HOME);
            }, 2000);
          }, 10000);
        }
      } catch (error) {
        console.log('Unexpected auth error:', error);
        setStatus('error');
        toast.error('An unexpected error occurred');
        setTimeout(() => {
          router.push(ROUTES_KEYS.HOME);
        }, 2000);
      }
    };

    checkSession();

    return () => {
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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
        {status === 'loading' && 'Completing sign in...'}
        {status === 'success' && 'Sign in successful!'}
        {status === 'error' && 'Sign in failed'}
      </Typography>
      <Typography variant="body1" sx={{ color: '#9ca3af', textAlign: 'center', maxWidth: 400 }}>
        {status === 'loading' && 'Please wait while we complete your Google sign in and redirect you to the application.'}
        {status === 'success' && 'Redirecting you to the application...'}
        {status === 'error' && 'Please try signing in again.'}
      </Typography>
    </Box>
  );
}
