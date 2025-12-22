'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../utils/supabase';
import { SupabaseHelpers } from '../utils/SupabaseHelpers';
import { HelperFunctions } from '../utils/helperFunctions';
import { toast } from 'react-toastify';
import { ROUTES_KEYS } from '@/data/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ensureProfile = async (u: User | null | undefined) => {
      try {
        if (!u) return;
        await SupabaseHelpers.saveUserProfile(u);
      } catch (error) {
        console.log('Error ensuring profile:', error);
      }
    };

    // Initialize auth state on mount
    const initAuth = async () => {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Error getting session:', error);
        }
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await ensureProfile(initialSession.user);
        }
      } catch (error) {
        console.log('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();

    // Safety fallback: if auth doesn't resolve within 8s, stop loading to avoid UI lock
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setIsInitialized(true);
    }, 10000);

    // Listen for auth changes
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        
        // Handle auth events
        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              await ensureProfile(newSession.user);
              // Don't redirect if we're on the callback page - let the callback page handle it
              // Only redirect if not already on trending topics page or callback page
              if (typeof window !== 'undefined' 
                  && !window.location.pathname.includes('trending-topics')
                  && !window.location.pathname.includes('auth/callback')) {
                try { 
                  router.push(ROUTES_KEYS.TRENDING_TOPICS); 
                } catch (error) {
                  console.log('Error redirecting:', error);
                }
              }
            }
            break;
          case 'SIGNED_OUT':
            setUser(null);
            setSession(null);
            break;
          case 'PASSWORD_RECOVERY':
            toast.success('Password recovery email sent!');
            break;
          case 'TOKEN_REFRESHED':
            // Token refreshed, session is still valid
            break;
          case 'USER_UPDATED':
            if (newSession?.user) {
              await ensureProfile(newSession.user);
            }
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Check your email for verification link!');
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        console.log('Error signing out:', error);
        return { error } as any;
      }
      // Clear local secure storage and caches
      try { HelperFunctions.clearSecureStorage(); } catch {
        console.log('Error clearing secure storage:', error);
      }
      return { error: null } as any;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { error } as any;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Password reset email sent!');
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  // Prevent hydration mismatch by not rendering until initialized
  if (!isInitialized) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
