'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { FormulaGenerator } from '@/components/FormulaGenerator';
import AuthForm from '@/components/Auth';
import Header from '@/components/Header';

interface Profile {
  usage_count: number;
  plan_type: string;
}

export default function HomePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async (user: User) => {
    if (!supabase) return;
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`usage_count, plan_type`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading user data!');
    }
  }, [supabase]);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        await getProfile(session.user);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getProfile(session.user);
      } else {
        setProfile(null); // Clear profile on logout
      }
    });

    return () => subscription?.unsubscribe();
  }, [supabase, getProfile]);

  const USAGE_LIMIT = 10;

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header session={session} onSignOut={() => supabase?.auth.signOut()} />
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
      </div>
      
      <main className="flex-1">
        {!session ? (
          <div className="container flex h-[calc(100vh-4rem)] items-center justify-center">
            <section className="grid items-center gap-6 pb-8 text-center">
              <div className="mx-auto flex max-w-[980px] flex-col items-start gap-2">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Generate Excel & Google Sheets formulas <br className="hidden sm:inline" />
                  in seconds with AI.
                </h1>
                <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
                  Stop wasting time searching for the right formula. Just describe what you need, and let AI handle the rest.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm pt-4">
                <AuthForm />
              </div>
            </section>
          </div>
        ) : (
          <FormulaGenerator 
            profile={profile} 
            onGenerationSuccess={() => setProfile(prev => prev ? { ...prev, usage_count: prev.usage_count + 1 } : null)} 
          />
        )}
      </main>
    </div>
  );
} 