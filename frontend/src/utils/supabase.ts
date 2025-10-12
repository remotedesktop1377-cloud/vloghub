import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseSingleton: ReturnType<typeof createClient<Database>> | null = null;

// Lazy getter to avoid throwing during Next.js prerender/build
export const getSupabase = () => {
  if (!supabaseSingleton) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseSingleton = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseSingleton;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Helper function to sign out
export const signOut = async () => {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  return { error };
};
