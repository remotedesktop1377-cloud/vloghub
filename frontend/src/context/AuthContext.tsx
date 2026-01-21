'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut, signIn as nextAuthSignIn } from 'next-auth/react';
import { SupabaseHelpers } from '../utils/SupabaseHelpers';
import { HelperFunctions } from '../utils/helperFunctions';
import { toast } from 'react-toastify';
import { ROUTES_KEYS } from '@/data/constants';
import { getSupabase } from '../utils/supabase';
import { DB_TABLES } from '@/config/DbTables';

interface AuthContextType {
  user: any | null;
  session: any | null;
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
  const { data: nextAuthSession, status } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  const ensureProfileInSupabase = async (sessionUser: any) => {
    if (!sessionUser || !sessionUser.email || !sessionUser.id) return;

    try {
      const supabase = getSupabase();
      
      const existingProfileResult: any = await supabase
        .from(DB_TABLES.PROFILES)
        .select('id, created_at')
        .eq('email', sessionUser.email)
        .maybeSingle();

      const updatePayload: any = {
        email: sessionUser.email || '',
        full_name: sessionUser.name || sessionUser.full_name || null,
        provider: sessionUser.provider || 'google',
        picture: sessionUser.image || sessionUser.picture || null,
        updated_at: new Date().toISOString(),
      };

      if (existingProfileResult?.data && !existingProfileResult?.error) {
        const existingId = existingProfileResult.data.id;
        const existingCreatedAt = existingProfileResult.data.created_at;
        
        if (existingId === sessionUser.id) {
          const { error: updateError } = await (supabase
            .from(DB_TABLES.PROFILES) as any)
            .update(updatePayload)
            .eq('id', existingId)
            .select();

          if (updateError) {
            console.log('Error updating profile in Supabase:', updateError);
          }
        } else {
          console.log(`Profile ID mismatch: Existing ID (${existingId}) differs from Session ID (${sessionUser.id}). Using existing profile ID.`);
          
          const { error: updateError } = await (supabase
            .from(DB_TABLES.PROFILES) as any)
            .update(updatePayload)
            .eq('id', existingId)
            .select();

          if (updateError) {
            console.log('Error updating profile in Supabase:', updateError);
          }
        }
      } else {
        const insertPayload: any = {
          ...updatePayload,
          id: sessionUser.id,
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await (supabase
          .from(DB_TABLES.PROFILES) as any)
          .insert(insertPayload)
          .select();

        if (insertError) {
          if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
            const retryResult: any = await supabase
              .from(DB_TABLES.PROFILES)
              .select('id, created_at')
              .eq('email', sessionUser.email)
              .maybeSingle();
            
            if (retryResult?.data?.id) {
              const retryId = retryResult.data.id;
              
              const { error: retryUpdateError } = await (supabase
                .from(DB_TABLES.PROFILES) as any)
                .update(updatePayload)
                .eq('id', retryId)
                .select();

              if (retryUpdateError) {
                console.log('Error updating profile on retry:', retryUpdateError);
              }
            }
          } else {
            console.log('Error inserting profile to Supabase:', insertError);
          }
        }
      }
    } catch (error) {
      console.log('Error ensuring profile in Supabase:', error);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (nextAuthSession?.user) {
      ensureProfileInSupabase(nextAuthSession.user);
    }

    setIsInitialized(true);
  }, [nextAuthSession, status]);

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
      await nextAuthSignOut({ redirect: false });
      const supabase = getSupabase();
      await supabase.auth.signOut();
      
      try { 
        HelperFunctions.clearSecureStorage(); 
      } catch (error) {
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
    user: nextAuthSession?.user || null,
    session: nextAuthSession,
    loading: status === 'loading',
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  if (!isInitialized) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
