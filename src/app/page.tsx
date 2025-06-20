'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import AuthForm from '@/components/Auth';
import { Header } from '@/components/Header';
import { FormulaGenerator } from '@/components/FormulaGenerator';

interface Profile {
  usage_count: number;
  plan_type: string;
}

export default function HomePage() {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async (user: User) => {
    try {
      const { data, error, status } = await supabase.from('profiles').select(`usage_count, plan_type`).eq('id', user.id).single();
      if (error && status !== 406) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading user data!');
    }
  }, [supabase]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) await getProfile(session.user);
      setLoading(false);
    };
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, getProfile]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const handleGenerationSuccess = () => {
    setProfile(prev => prev ? { ...prev, usage_count: prev.usage_count + 1 } : null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header session={session} onSignOut={handleSignOut} />
      <main className="flex-1">
        {!session ? (
          <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
            <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl">
                Generate Excel & Google Sheets formulas <br className="hidden sm:inline" />
                in seconds with AI.
              </h1>
              <p className="max-w-[700px] text-lg text-muted-foreground">
                Stop wasting time searching for the right formula. Just describe what you need, and let AI handle the rest.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm">
                <AuthForm />
            </div>
          </section>
        ) : (
          <FormulaGenerator 
            profile={profile} 
            onGenerationSuccess={handleGenerationSuccess} 
          />
        )}
      </main>
    </div>
  );
} 