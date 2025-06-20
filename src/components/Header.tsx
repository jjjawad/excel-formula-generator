'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuthForm from './Auth';

export function Header() {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange will handle setting session to null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6">
              <rect width="256" height="256" fill="none"></rect>
              <path d="M208,88H152a8,8,0,0,1-8-8V24a8,8,0,0,1,8-8h56a8,8,0,0,1,8,8V80A8,8,0,0,1,208,88ZM48,224a8,8,0,0,1-8,8H224a8,8,0,0,0,8-8V176a8,8,0,0,0-8-8H48a8,8,0,0,0-8,8Zm64-80H56a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h56a8,8,0,0,0,8-8V152A8,8,0,0,0,112,144Z" opacity="0.2"></path>
              <path d="M208,88H152a8,8,0,0,1-8-8V24a8,8,0,0,1,8-8h56a8,8,0,0,1,8,8V80A8,8,0,0,1,208,88ZM152,32v48h56V32ZM48,168H224a8,8,0,0,1,8,8v48a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V176A8,8,0,0,1,48,168Zm-8,56H224V176H40ZM112,144H56a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h56a8,8,0,0,0,8-8V152A8,8,0,0,0,112,144Zm-8,48H56V152h48Z" fill="currentColor"></path>
            </svg>
            <span className="font-bold">FormulaGenius</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {!loading && (
              session ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">{session.user.email}</span>
                  <Button variant="secondary" size="sm" onClick={handleSignOut}>Sign Out</Button>
                </>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">Sign In</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Sign In / Sign Up</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">Sign in to get 5 free credits and save your formula history.</p>
                    <AuthForm />
                  </DialogContent>
                </Dialog>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
} 