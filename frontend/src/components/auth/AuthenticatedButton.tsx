'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import SigninDialog from '../../dialogs/SigninDialog';
import { Button } from '@mui/material';
import { toast } from 'react-toastify';

interface AuthenticatedButtonProps {
  targetRoute: string;
  children: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
  sx?: any;
  className?: string;
  onClick?: () => void;
  requireAuth?: boolean;
}

export const AuthenticatedButton: React.FC<AuthenticatedButtonProps> = ({
  targetRoute,
  children,
  variant = 'contained',
  sx = {},
  className = '',
  onClick,
  requireAuth = true,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If custom onClick provided, call it first
    if (onClick) {
      onClick();
    }

    // If authentication is not required, navigate directly
    if (!requireAuth) {
      router.push(targetRoute);
      return;
    }

    // Check if user is authenticated
    if (loading) {
      toast.info('Please wait, checking authentication...');
      return;
    }

    if (!user) {
      // Store the target route for post-auth redirect
      sessionStorage.setItem('authRedirectTo', targetRoute);
      
      // User is not authenticated, show auth modal
      setShowAuthModal(true);
      toast.info('Please sign in to access this feature');
      return;
    }

    // User is authenticated, navigate to target route
    router.push(targetRoute);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast.success('Successfully signed in! Redirecting...');
    
    // Small delay to show success message before navigation
    setTimeout(() => {
      router.push(targetRoute);
    }, 1000);
  };

  return (
    <>
      <Button
        variant={variant}
        sx={sx}
        className={className}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Loading...' : children}
      </Button>

      <SigninDialog
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

// Hook version for more flexibility
export const useAuthenticatedNavigation = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navigateWithAuth = (targetRoute: string, requireAuth: boolean = true) => {
    if (!requireAuth) {
      router.push(targetRoute);
      return;
    }

    if (loading) {
      toast.info('Please wait, checking authentication...');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      toast.info('Please sign in to access this feature');
      return;
    }

    router.push(targetRoute);
  };

  const handleAuthSuccess = (targetRoute: string) => {
    setShowAuthModal(false);
    toast.success('Successfully signed in! Redirecting...');
    
    setTimeout(() => {
      router.push(targetRoute);
    }, 1000);
  };

  return {
    user,
    loading,
    showAuthModal,
    setShowAuthModal,
    navigateWithAuth,
    handleAuthSuccess,
    AuthModal: () => (
      <SigninDialog
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    )
  };
};
