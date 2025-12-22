'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  authenticatedLabel?: React.ReactNode;
  guestLabel?: React.ReactNode;
  showClickLoading?: boolean;
  loadingText?: React.ReactNode;
}

export const AuthenticatedButton: React.FC<AuthenticatedButtonProps> = ({
  targetRoute,
  children,
  variant = 'contained',
  sx = {},
  className = '',
  onClick,
  requireAuth = true,
  authenticatedLabel,
  guestLabel,
  showClickLoading = false,
  loadingText,
}) => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If custom onClick provided, call it first
    if (onClick) {
      onClick();
    }

    // If authentication is not required, navigate directly
    if (!requireAuth) {
      if (showClickLoading) {
        setButtonLoading(true);
      }
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
    if (showClickLoading) {
      setButtonLoading(true);
    }
    router.push(targetRoute);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const renderLabel = () => {
    if (loading) return 'Loading...';
    if (buttonLoading) return loadingText ?? children;
    if (user) {
      return authenticatedLabel ?? children;
    }
    return guestLabel ?? children;
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
        {renderLabel()}
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
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
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
