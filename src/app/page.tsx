'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import Generator from '@/components/Generator';
import AuthForm from '@/components/Auth';

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

    return () => subscription.unsubscribe();
  }, [supabase, getProfile]);

  const USAGE_LIMIT = 10;

  const renderUsageCounter = () => {
    if (!profile) return null;
    if (profile.plan_type !== 'free') return <p>You are on the Pro plan. Unlimited generations!</p>;

    return (
      <p className="text-sm text-gray-600">
        You have used {profile.usage_count} of {USAGE_LIMIT} free generations.
      </p>
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-24 bg-gray-50">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          AI-Powered Excel Formula Generator
        </h1>
        <p className="mt-2 text-center text-lg text-gray-600">
          Turn your plain English instructions into powerful Excel and Google Sheets formulas.
        </p>
      </div>

      <div className="mt-12 w-full">
        {!session ? (
          <AuthForm />
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-3xl flex justify-between items-center mb-4">
              <span className="text-gray-700">Logged in as: <strong>{session.user.email}</strong></span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Sign Out
              </button>
            </div>
            <div className="w-full max-w-3xl text-center mb-6">
              {renderUsageCounter()}
            </div>
            <Generator />
          </div>
        )}
      </div>
    </main>
  );
} 