'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Generator from '@/components/Generator';
import AuthForm from '@/components/Auth';

export default function HomePage() {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);


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
            <p className="mb-4">Logged in as: <strong>{session.user.email}</strong></p>
            <button
              onClick={() => supabase.auth.signOut()}
              className="mb-8 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Sign Out
            </button>
            <Generator />
          </div>
        )}
      </div>
    </main>
  );
} 