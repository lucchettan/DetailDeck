
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
// FIX: Removed non-existent 'SignUpWithPasswordlessCredentials' from import.
import { Session, User, AuthError, SignUpWithPasswordCredentials, AuthResponse, SignInWithPasswordCredentials } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<AuthResponse>;
  logIn: (credentials: SignInWithPasswordCredentials) => Promise<{ session: Session | null, error: AuthError | null }>;
  logOut: () => Promise<{ error: AuthError | null }>;
  resendSignUpConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    const response = await supabase.auth.signUp(credentials);
    // If sign up is successful and returns a session (i.e., email confirmation is disabled),
    // immediately set the session state to log the user in.
    if (response.data.session) {
      setSession(response.data.session);
      setUser(response.data.session.user);
    }
    return response;
  };

  const logIn = async (credentials: SignInWithPasswordCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    // Explicitly set the session on successful login to ensure immediate UI update.
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    return { session: data.session, error };
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    // Explicitly clear the session on successful logout.
    if (!error) {
      setSession(null);
      setUser(null);
    }
    return { error };
  };

  const resendSignUpConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error };
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    logIn,
    logOut,
    resendSignUpConfirmation,
    resetPasswordForEmail,
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
