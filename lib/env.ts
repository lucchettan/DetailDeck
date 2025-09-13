// This file centralizes environment variable access and determines if the app is in "mock mode".
// Mock mode is enabled when essential environment variables are not provided,
// allowing the app to run in a preview environment without real backend services.

// Safely access environment variables to prevent crashes if `import.meta.env` is undefined.
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

export const IS_MOCK_MODE = !env.VITE_SUPABASE_URL;

// Provide mock values for Supabase to prevent the client from failing to initialize.
// The anon key is a generic, public key from Supabase examples and is safe to use.
export const VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://mock-url.supabase.co';
export const VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Stripe key can be undefined in mock mode.
export const VITE_STRIPE_PUBLISHABLE_KEY = env.VITE_STRIPE_PUBLISHABLE_KEY;

if (IS_MOCK_MODE) {
    console.warn(
        "Running in MOCK MODE. Supabase and Stripe calls will be simulated. " +
        "To connect to real services, provide VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_STRIPE_PUBLISHABLE_KEY environment variables."
    );
}
