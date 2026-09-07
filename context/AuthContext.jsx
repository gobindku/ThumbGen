// File: context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (err) {
        console.error('Error fetching auth session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for changes on auth state (signed in, signed out, user updated)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [configured]);

  // Sign up with Email & Password
  const signUp = async ({ email, password, fullName }) => {
    if (!configured) {
      throw new Error('Supabase is not configured yet. Please add your credentials in .env.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });
    if (error) throw error;
    return data;
  };

  // Sign in with Email & Password
  const signIn = async ({ email, password }) => {
    if (!configured) {
      throw new Error('Supabase is not configured yet. Please add your credentials in .env.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // Sign out
  const signOut = async () => {
    if (!configured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Reset password
  const resetPassword = async (email) => {
    if (!configured) {
      throw new Error('Supabase is not configured yet. Please add your credentials in .env.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
    });
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    isConfigured: configured,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
