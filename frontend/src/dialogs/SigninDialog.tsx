'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton, CircularProgress, Stack, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import { getSupabase } from '../utils/supabase';
import { toast } from 'react-toastify';

type SigninDialogProps = { isOpen: boolean; onClose: () => void; onSuccess?: () => void };

const SigninDialog: React.FC<SigninDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Redirecting to Google...');
        onSuccess && onSuccess();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start Google Sign in';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
    };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: 8,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(6px)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
          py: 1.5,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.18)',
              borderRadius: '8px'
            }}
            aria-hidden
          >
            <GoogleIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            Sign in to VlogHub
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close sign in dialog" sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={5.5} alignItems="stretch">

          <Divider sx={{ my: 3.5 }} />

          {/* Google button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            fullWidth
            variant="contained"
            color="primary"
            startIcon={!googleLoading ? <GoogleIcon /> : undefined}
            sx={{
              py: 1.2,
              textTransform: 'none',
              fontWeight: 600,
              letterSpacing: 0.2,
              boxShadow: (theme) => `0 6px 18px ${theme.palette.primary.main}33`
            }}
            aria-label="Continue with Google"
          >
            {googleLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Connecting…</span>
              </Box>
            ) : (
              'Continue with Google'
            )}
          </Button>

          {/* Terms */}
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Stack>
      </DialogContent>
      
    </Dialog>
  );
};

export default SigninDialog;
