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
        router.push(ROUTES_KEYS.TRENDING_TOPICS);
      } catch {}
    };
    // Get initial session
    const getInitialSession = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          // Ensure profile row exists for already-authenticated user
          await ensureProfile(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    getInitialSession();

    // Safety fallback: if auth doesn't resolve within 8s, stop loading to avoid UI lock
    const safetyTimer = setTimeout(() => {
      if (loading) {
        // console.warn('Auth init timeout fallback triggered');
        setLoading(false);
        setIsInitialized(true);
      }
    }, 8000);

    // Listen for auth changes
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events
        switch (event) {
          case 'SIGNED_IN':
            toast.success('Successfully signed in!');

            await ensureProfile(session?.user ?? null);
            // Redirect to trending topics after successful sign in
            try { router.push(ROUTES_KEYS.TRENDING_TOPICS); } catch {}
            break;
          case 'SIGNED_OUT':
            toast.success('Successfully signed out!');
            console.log('Signed out!');
            // Redirect to home after sign out
            try { router.push(ROUTES_KEYS.HOME); } catch {}
            break;
          case 'PASSWORD_RECOVERY':
            toast.success('Password recovery email sent!');
            break;
          case 'TOKEN_REFRESHED':
            // console.log('Token refreshed');
            break;
          case 'USER_UPDATED':
            toast.success('Profile updated successfully!');
            await ensureProfile(session?.user ?? null);
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

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
