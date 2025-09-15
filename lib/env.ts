// This file centralizes environment variable access and determines if the app is in "mock mode".
// Mock mode is enabled when essential environment variables are not provided,
// allowing the app to run in a preview environment without real backend services.

// Safely access environment variables to prevent crashes if `import.meta.env` is undefined.
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

// Essential keys for the app to function with real services.
const VITE_SUPABASE_URL_VAR = env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY_VAR = env.VITE_SUPABASE_ANON_KEY;
const VITE_STRIPE_PUBLISHABLE_KEY_VAR = env.VITE_STRIPE_PUBLISHABLE_KEY;
const VITE_STRIPE_CLIENT_ID_VAR = env.VITE_STRIPE_CLIENT_ID;

// Mock mode is active if any of the essential keys are missing.
export const IS_MOCK_MODE = !VITE_SUPABASE_URL_VAR || !VITE_SUPABASE_ANON_KEY_VAR || !VITE_STRIPE_PUBLISHABLE_KEY_VAR || !VITE_STRIPE_CLIENT_ID_VAR;

// Provide mock values for Supabase to prevent the client from failing to initialize.
// The anon key is a generic, public key from Supabase examples and is safe to use.
export const VITE_SUPABASE_URL = VITE_SUPABASE_URL_VAR || 'https://mock-url.supabase.co';
export const VITE_SUPABASE_ANON_KEY = VITE_SUPABASE_ANON_KEY_VAR || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Export the Stripe keys. They will be undefined if not set, which is handled by the mock mode check.
export const VITE_STRIPE_PUBLISHABLE_KEY = VITE_STRIPE_PUBLISHABLE_KEY_VAR;
export const VITE_STRIPE_CLIENT_ID = VITE_STRIPE_CLIENT_ID_VAR;


if (IS_MOCK_MODE) {
    const missingKeys = [];
    if (!VITE_SUPABASE_URL_VAR) missingKeys.push('VITE_SUPABASE_URL');
    if (!VITE_SUPABASE_ANON_KEY_VAR) missingKeys.push('VITE_SUPABASE_ANON_KEY');
    if (!VITE_STRIPE_PUBLISHABLE_KEY_VAR) missingKeys.push('VITE_STRIPE_PUBLISHABLE_KEY');
    if (!VITE_STRIPE_CLIENT_ID_VAR) missingKeys.push('VITE_STRIPE_CLIENT_ID');
    
    console.warn(
        `%cRunning in MOCK MODE because the following environment variables are missing: %c${missingKeys.join(', ')}`,
        'color: orange; font-weight: bold;',
        'color: red; font-weight: bold;'
    );
    console.warn("Supabase and Stripe calls will be simulated. To connect to real services, please provide all the keys listed above.");
}