


import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
// Fix: Removed unused and non-exported types from '@supabase/supabase-js'.
import { Session, User, AuthError, SignUpWithPasswordCredentials, AuthResponse, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { IS_MOCK_MODE } from '../lib/env';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<AuthResponse>;
  logIn: (credentials: SignInWithPasswordCredentials) => Promise<{ session: Session | null, error: AuthError | null }>;
  logOut: () => Promise<{ error: AuthError | null }>;
  demoLogin: () => Promise<{ session: Session | null, error: AuthError | null }>;
  resendSignUpConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updateUserPassword: (password: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Mock Data for Previewing Dashboard ---
const mockUser: User = {
    id: 'mock-user-id-123',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { first_name: 'Luc', email: 'lucchettan@gmail.com' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'lucchettan@gmail.com',
};

const mockSession: Session = {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    user: mockUser,
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
};
// --- End Mock Data ---


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In mock mode, we don't fetch a real session. We just finish loading.
    // Auth state will be handled by mock signUp/logIn functions.
    if (IS_MOCK_MODE) {
        setLoading(false);
        return;
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> => {
    if (IS_MOCK_MODE) {
        // Fix: Use type guard to safely access email or phone property for logging.
        console.log(`%c[Auth MOCK]%c signUp called for ${'email' in credentials ? credentials.email : credentials.phone}. Logging in as mock user 'lucchettan@gmail.com'.`, 'color: purple; font-weight: bold;', 'color: inherit;');
        setSession(mockSession);
        setUser(mockUser);
        // Fix: Corrected the mock response to match the AuthResponse type.
        const mockAuthResponse: AuthResponse = {
            data: {
                session: mockSession,
                user: mockUser
            },
            error: null
        };
        return mockAuthResponse;
    }

    const response = await supabase.auth.signUp(credentials);
    if (response.data.session) {
      setSession(response.data.session);
      setUser(response.data.session.user);
    }
    return response;
  };

  const logIn = async (credentials: SignInWithPasswordCredentials) => {
    if (IS_MOCK_MODE) {
        // Fix: Use type guard to safely access email or phone property for logging.
        console.log(`%c[Auth MOCK]%c logIn called for ${'email' in credentials ? credentials.email : credentials.phone}.`, 'color: purple; font-weight: bold;', 'color: inherit;');
        // Fix: Use type guard to safely access email property for comparison.
        if ('email' in credentials && credentials.email === 'lucchettan@gmail.com' && credentials.password === 'Potager12') {
            setSession(mockSession);
            setUser(mockUser);
            return { session: mockSession, error: null };
        } else {
            return { session: null, error: { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 } as AuthError };
        }
    }
      
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    // FIX: Use optional chaining (`data?.session`) to prevent a crash when `data` is null on login error.
    return { session: data?.session || null, error };
  };

  const logOut = async () => {
     if (IS_MOCK_MODE) {
        console.log(`%c[Auth MOCK]%c logOut called.`, 'color: purple; font-weight: bold;', 'color: inherit;');
        setSession(null);
        setUser(null);
        return { error: null };
     }
      
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
    }
    return { error };
  };

  const demoLogin = () => logIn({
    email: 'lucchettan@gmail.com',
    password: 'Potager12',
  });

  const resendSignUpConfirmation = async (email: string) => {
    if (IS_MOCK_MODE) {
        console.log(`%c[Auth MOCK]%c resendSignUpConfirmation called for ${email}.`, 'color: purple; font-weight: bold;', 'color: inherit;');
        return { error: null };
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    if (IS_MOCK_MODE) {
        console.log(`%c[Auth MOCK]%c resetPasswordForEmail called for ${email}.`, 'color: purple; font-weight: bold;', 'color: inherit;');
        return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error };
  };
  
  const updateUserPassword = async (password: string) => {
    if (IS_MOCK_MODE) {
      console.log(`%c[Auth MOCK]%c updateUserPassword called.`, 'color: purple; font-weight: bold;', 'color: inherit;');
      return { error: null };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };


  const value = {
    session,
    user,
    loading,
    signUp,
    logIn,
    logOut,
    demoLogin,
    resendSignUpConfirmation,
    resetPasswordForEmail,
    updateUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
