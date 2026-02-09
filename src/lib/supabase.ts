import { createClient } from '@supabase/supabase-js';

// These environment variables must be set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('⚠️ VITE_SUPABASE_URL is missing! Check your .env file.');
}
if (!supabaseAnonKey) {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY is missing! Check your .env file.');
}

// Create a single supabase client for interacting with your database
// Use fallback values to prevent null errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Helper to get the current user's JWT token for backend requests
export const getAuthToken = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};
