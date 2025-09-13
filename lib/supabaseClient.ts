import { createClient } from '@supabase/supabase-js'
import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from './env';

// The supabase client is initialized with either the real environment variables
// or the mock values from env.ts. This ensures the app can run without crashing
// in a preview environment where these variables might not be set.
export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
