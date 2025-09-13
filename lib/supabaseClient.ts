import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing. Please create a .env.local file in the root of your project and add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project dashboard.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);