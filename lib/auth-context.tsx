'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from './types';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { DEFAULT_USER } from './storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSupabaseActive: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>;
  updateProfile: (data: Partial<User>) => Promise<{ error?: string; success?: boolean }>;
  consumeCredit: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'purecut_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: profile?.full_name || session.user.user_metadata?.full_name || 'PureCut User',
              avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url,
              credits: profile?.credits ?? 10,
              maxCredits: profile?.max_credits ?? 10,
              plan: profile?.plan || 'free',
              createdAt: session.user.created_at,
            });
          }

          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const { data: profile } = await supabase!
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              setUser({
                id: session.user.id,
                email: session.user.email || '',
                fullName: profile?.full_name || session.user.user_metadata?.full_name || 'PureCut User',
                avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url,
                credits: profile?.credits ?? 10,
                maxCredits: profile?.max_credits ?? 10,
                plan: profile?.plan || 'free',
                createdAt: session.user.created_at,
              });
            } else {
              setUser(null);
            }
          });

          return () => subscription.unsubscribe();
        } else {
          // Local fallback mode
          const saved = localStorage.getItem(LOCAL_USER_KEY);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            // Default active demo user session so dashboard & studio work instantly
            setUser(DEFAULT_USER);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(DEFAULT_USER));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const signIn = async (email: string, password: string, remember: boolean = true) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return {};
      }

      // Local simulated authentication
      if (!email || !password) {
        return { error: 'Please enter both email and password.' };
      }
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long.' };
      }

      // Check for demo account or existing local accounts
      const loggedUser: User = {
        ...DEFAULT_USER,
        email,
        fullName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      };

      setUser(loggedUser);
      if (remember) {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(loggedUser));
      }
      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return { error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) return { error: error.message };
        return { success: true };
      }

      if (!email || !password || !fullName) {
        return { error: 'Please fill in all required fields.' };
      }
      if (password.length < 8) {
        return { error: 'Password must be at least 8 characters long.' };
      }

      const newUser: User = {
        id: `usr_${Date.now()}`,
        email,
        fullName,
        credits: 10,
        maxCredits: 10,
        plan: 'free',
        createdAt: new Date().toISOString(),
      };

      setUser(newUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      return { error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const resetPassword = async (email: string) => {
    if (!email || !email.includes('@')) {
      return { error: 'Please provide a valid email address.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
    }

    return { success: true };
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { error: 'Not authenticated' };

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          avatar_url: data.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) return { error: error.message };
    } else {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
    }

    return { success: true };
  };

  const consumeCredit = (): boolean => {
    if (!user) return false;
    if (user.credits <= 0) return false;

    const newCredits = user.credits - 1;
    const updated = { ...user, credits: newCredits };
    setUser(updated);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id)
        .then();
    } else {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseActive: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        consumeCredit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
