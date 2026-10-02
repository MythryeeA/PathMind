import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Live production credentials with safe fallbacks
const FALLBACK_SUPABASE_URL = 'https://nchoalhcumzykgqauyjd.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaG9hbGhjdW16eWtncWF1eWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MjcyNDcsImV4cCI6MjEwNjUwMzI0N30.He__9Yk-tFtT9L8QhmVTmT4sBg4TA3t-oGAH2zgZdqU';

// Sanitize inputs: strip whitespace and trailing slashes
const rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.SUPABASE_URL as string) ||
  FALLBACK_SUPABASE_URL;

const rawKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.SUPABASE_ANON_KEY as string) ||
  FALLBACK_SUPABASE_ANON_KEY;

export const supabaseUrl = rawUrl.trim().replace(/\/+$/, '');
export const supabaseAnonKey = rawKey.trim();

// Initialise Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Helper to retrieve the singleton Supabase client (useful outside React) */
export function getSupabase() {
  return supabase;
}

/** React hook returning the current authenticated user (or null) */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Initial fetch
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Supabase auth getSession warning:', err);
        setLoading(false);
      });

    return () => subscription?.unsubscribe();
  }, []);

  return { user, loading };
}
