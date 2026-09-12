import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null); // { role, username, full_name }
  const [studentRow, setStudentRow] = useState(null); // status, student_id, class, section...
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setStudentRow(null);
      return;
    }
    setLoadingProfile(true);
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(p || null);

    if (p?.role === 'student') {
      const { data: s } = await supabase.from('students').select('*').eq('id', userId).maybeSingle();
      setStudentRow(s || null);
    } else {
      setStudentRow(null);
    }
    setLoadingProfile(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setStudentRow(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshStudentRow = useCallback(async () => {
    if (session?.user?.id) {
      const { data: s } = await supabase.from('students').select('*').eq('id', session.user.id).maybeSingle();
      setStudentRow(s || null);
    }
  }, [session]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    studentRow,
    role: profile?.role ?? null,
    loading: session === undefined || loadingProfile,
    refreshStudentRow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
