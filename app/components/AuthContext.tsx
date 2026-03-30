'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/config/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { logError } from '../../lib/utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check active sessions and sets the user
    // Added safety timeout to ensure application doesn't hang indefinitely if network/Supabase responds slowly
    const initTimeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(initTimeout);
      } catch (err: unknown) {
        logError('Failed to get auth session:', err);
        setLoading(false);
        clearTimeout(initTimeout);
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(initTimeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(initTimeout);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === '/login' || pathname?.startsWith('/qa');

    if (!user && !isPublicPage) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data.session) {
      setSession(result.data.session);
      setUser(result.data.session.user);
      setLoading(false);
    }
    return { error: result.error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      router.push('/login');
    } catch (err: unknown) {
      logError('Failed to sign out:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
