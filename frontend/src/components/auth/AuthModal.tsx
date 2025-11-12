'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { getSupabase } from '../../utils/supabase';
import './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin' 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      switch (mode) {
        case 'signin':
          const { error: signInError } = await signIn(email, password);
          if (!signInError) {
            onClose();
          }
          break;
        case 'signup':
          const { error: signUpError } = await signUp(email, password, fullName);
          if (!signUpError) {
            setMode('signin');
          }
          break;
        case 'reset':
          const { error: resetError } = await resetPassword(email);
          if (!resetError) {
            setMode('signin');
          }
          break;
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Redirecting to Google...');
        // The redirect will happen automatically
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-header-content">
            <div className="auth-logo">
              <div className="logo-icon">
                <div className="logo-inner"></div>
              </div>
              <span className="logo-text">VlogHub</span>
            </div>
            <h2 className="auth-title">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset your password'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'signin' && 'Sign in to your account to continue'}
              {mode === 'signup' && 'Join thousands of creators using VlogHub'}
              {mode === 'reset' && 'Enter your email to reset your password'}
            </p>
          </div>
          <button className="auth-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Google Sign In Button (only for signin and signup) */}
        {mode !== 'reset' && (
          <div className="auth-google-section">
            <button 
              type="button"
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <div className="google-loading">
                  <div className="spinner"></div>
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="auth-divider">
              <div className="divider-line"></div>
              <span className="divider-text">or</span>
              <div className="divider-line"></div>
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="auth-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="auth-input"
            />
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="auth-input"
              />
              {mode === 'signup' && (
                <div className="password-hint">
                  Password must be at least 6 characters long
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <div className="auth-loading">
                <div className="spinner"></div>
                <span>
                  {mode === 'signin' && 'Signing in...'}
                  {mode === 'signup' && 'Creating account...'}
                  {mode === 'reset' && 'Sending email...'}
                </span>
              </div>
            ) : (
              <>
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'reset' && 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="auth-footer">
          {mode === 'signin' && (
            <div className="auth-links">
              <p>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  className="auth-link-btn"
                  onClick={() => switchMode('signup')}
                >
                  Sign up
                </button>
              </p>
              <p>
                <button 
                  type="button" 
                  className="auth-link-btn forgot-link"
                  onClick={() => switchMode('reset')}
                >
                  Forgot your password?
                </button>
              </p>
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-links">
              <p>
                Already have an account?{' '}
                <button 
                  type="button" 
                  className="auth-link-btn"
                  onClick={() => switchMode('signin')}
                >
                  Sign in
                </button>
              </p>
              <p className="terms-text">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          )}

          {mode === 'reset' && (
            <div className="auth-links">
              <p>
                Remember your password?{' '}
                <button 
                  type="button" 
                  className="auth-link-btn"
                  onClick={() => switchMode('signin')}
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
