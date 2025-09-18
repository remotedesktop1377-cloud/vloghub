'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../utils/supabase';
import { toast } from 'react-toastify';

type SigninDialogProps = { isOpen: boolean; onClose: () => void; onSuccess?: () => void };

const SigninDialog: React.FC<SigninDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
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
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Sign in to continue</Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close sign in dialog">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            By continuing you agree to our Terms and Privacy Policy.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SigninDialog;
