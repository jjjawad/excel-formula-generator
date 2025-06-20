'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { getGuestUsage, incrementGuestUsage, hasGuestCredits } from '@/lib/guest-usage';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Stars } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuthForm from './Auth';

interface Profile {
  usage_count: number;
  plan_type: string;
}

// Define credit limits
const GUEST_LIMIT = 2;
const FREE_LIMIT = 5;

export function FormulaGenerator() {
  const supabase = createClient();

  // Component State
  const [platform, setPlatform] = useState('excel');
  const [prompt, setPrompt] = useState('');
  const [formula, setFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auth & Profile State
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestUsage, setGuestUsage] = useState(0);

  // State Management
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch user profile
  const getProfile = useCallback(async (user: User) => {
    try {
      const { data, error, status } = await supabase.from('profiles').select(`usage_count, plan_type`).eq('id', user.id).single();
      if (error && status !== 406) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading user data!', error);
    }
  }, [supabase]);

  // Effect to load initial session, profile, and guest usage
  useEffect(() => {
    setGuestUsage(getGuestUsage());
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) getProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getProfile(session.user);
      } else {
        setProfile(null); // Clear profile on logout
      }
      setShowAuthModal(false); // Close modal on auth change
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth, getProfile]);

  const handleUpgrade = async () => {
    if (!session) return setShowAuthModal(true);
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST' });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      toast.error('Could not start the upgrade process.');
    } finally {
      setIsUpgrading(false);
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt) {
      toast.error('Please enter a description first.');
      return;
    }

    // Determine current user status and check credits
    let canGenerate = false;
    if (session) {
      if (profile?.plan_type === 'pro' || (profile && profile.usage_count < FREE_LIMIT)) {
        canGenerate = true;
      }
    } else {
      if (hasGuestCredits()) {
        canGenerate = true;
      }
    }

    if (!canGenerate) {
      toast.error("You've run out of credits. Please sign in or upgrade.");
      if (!session) setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    setFormula('');
    setExplanation('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: `For ${platform}: ${prompt}` }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      setFormula(data.formula);
      setExplanation(data.explanation);
      toast.success('Formula generated!');

      // Increment usage count
      if (session && profile) {
        setProfile({ ...profile, usage_count: profile.usage_count + 1 });
      } else {
        const newUsage = incrementGuestUsage();
        setGuestUsage(newUsage);
      }
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
  };

  const getCreditStatus = () => {
    if (session) {
      if (profile?.plan_type === 'pro') return 'You have unlimited generations on the Pro plan.';
      const creditsLeft = FREE_LIMIT - (profile?.usage_count ?? 0);
      return `You have ${creditsLeft} / ${FREE_LIMIT} free credits remaining.`;
    }
    const creditsLeft = GUEST_LIMIT - guestUsage;
    return `You have ${creditsLeft} / ${GUEST_LIMIT} guest credits remaining. Sign up for more.`;
  };

  const hasCredits = session ? (profile?.plan_type === 'pro' || (profile && profile.usage_count < FREE_LIMIT)) : hasGuestCredits();

  return (
    <>
      {/* This Dialog is used to show the AuthForm when needed */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Sign In to Continue</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Sign in or create an account to get more free credits and save your formula history.</p>
          <AuthForm />
        </DialogContent>
      </Dialog>
    
      <section className="container py-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Your AI Formula Assistant
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl mt-4">
              Describe your goal in plain English. We&apos;ll generate the formula and explain how it works.
            </p>
        </div>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Generator</CardTitle>
            <CardDescription>{getCreditStatus()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={platform} onValueChange={setPlatform} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="excel">Excel</TabsTrigger>
                <TabsTrigger value="google-sheets">Google Sheets</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid w-full gap-4 mt-4">
              <Textarea
                placeholder={`e.g., Sum values in column B if column A is "Completed"`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center">
                  <Button onClick={handleGenerate} disabled={isLoading || !hasCredits}>
                    <Stars className="mr-2 h-4 w-4" />
                    {isLoading ? 'Generating...' : 'Generate'}
                  </Button>
                  {prompt && <Button variant="ghost" onClick={() => setPrompt('')} disabled={isLoading}>Clear</Button>}
              </div>
            </div>
            
            {!hasCredits && (
              <div className="mt-6 text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h3 className="font-semibold text-destructive">You've reached your credit limit.</h3>
                  <p className="text-sm text-muted-foreground mt-1">{session ? 'Please upgrade to continue generating formulas.' : 'Please sign in for more free credits.'}</p>
                  <Button onClick={session ? handleUpgrade : () => setShowAuthModal(true)} disabled={isUpgrading} className="mt-4">
                      {session ? (isUpgrading ? 'Redirecting...' : 'Upgrade to Pro ($7/mo)') : 'Sign In'}
                  </Button>
              </div>
            )}

            {(formula || explanation) && (
              <div className="mt-6 space-y-6">
                {formula && (
                  <div className="space-y-2">
                      <h3 className="font-semibold">Generated Formula</h3>
                      <div className="p-4 rounded-md bg-muted flex items-center justify-between">
                          <pre className="text-sm whitespace-pre-wrap font-mono"><code>{formula}</code></pre>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(formula)}><Copy className="h-4 w-4" /></Button>
                      </div>
                  </div>
                )}
                {explanation && (
                   <div className="space-y-2">
                      <h3 className="font-semibold">Explanation</h3>
                      <div className="p-4 rounded-md bg-muted/50 border text-sm"><p>{explanation}</p></div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
} 