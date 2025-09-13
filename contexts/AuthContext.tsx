import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
// FIX: Removed non-existent 'SignUpWithPasswordlessCredentials' from import.
import { Session, User, AuthError, SignUpWithPasswordCredentials, AuthResponse } from '@supabase/supabase-js';

// Extend the credentials type to allow for additional options like user metadata
// FIX: Changed from an interface extending a type to a simple type alias. The previous
//      `interface extends type` approach caused inheritance issues in some TypeScript
//      setups, leading to properties like `email` and `password` not being recognized.
//      A direct type alias is safer and achieves the same goal.
type SignUpCredentialsWithData = SignUpWithPasswordCredentials;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (credentials: SignUpCredentialsWithData) => Promise<AuthResponse>;
  logIn: (credentials: SignUpWithPasswordCredentials) => Promise<{ session: Session | null, error: AuthError | null }>;
  logOut: () => Promise<{ error: AuthError | null }>;
  resendSignUpConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
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

  const signUp = async (credentials: SignUpCredentialsWithData) => {
    // Destructure to pass credentials and options separately
    const { email, password, options } = credentials;
    const response = await supabase.auth.signUp({ email, password, options });
    return response;
  };

  const logIn = async (credentials: SignUpWithPasswordCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    return { session: data.session, error };
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resendSignUpConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
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
