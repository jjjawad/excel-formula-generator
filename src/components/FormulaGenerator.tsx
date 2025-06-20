'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Stars } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  usage_count: number;
  plan_type: string;
}

interface FormulaGeneratorProps {
  profile: Profile | null;
  onGenerationSuccess: () => void;
}

export function FormulaGenerator({ profile, onGenerationSuccess }: FormulaGeneratorProps) {
  const [platform, setPlatform] = useState('excel');
  const [prompt, setPrompt] = useState('');
  const [formula, setFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST' });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      toast({
        title: "Error",
        description: "Could not start the upgrade process.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a description first.');
      return;
    }
    setIsLoading(true);
    setError('');
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
      onGenerationSuccess(); // Notify parent component to update usage count
      toast({
        title: "Success!",
        description: "Formula generated successfully.",
      });

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied!",
      description: "Formula copied to clipboard.",
    });
  };

  const USAGE_LIMIT = 10;
  const limitReached = profile?.plan_type === 'free' && profile.usage_count >= USAGE_LIMIT;

  if (!profile) {
    return <div className="text-center p-8">Loading profile...</div>;
  }
  
  return (
    <section className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Formula Generator</CardTitle>
          {profile.plan_type === 'pro' ? (
            <p className="text-green-600">Pro Plan: Unlimited generations</p>
          ) : (
            <p className="text-muted-foreground">
              You have used {profile.usage_count} of {USAGE_LIMIT} free generations.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={platform} onValueChange={setPlatform} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="excel">Excel</TabsTrigger>
              <TabsTrigger value="google-sheets">Google Sheets</TabsTrigger>
            </TabsList>
            <TabsContent value="excel">
            </TabsContent>
            <TabsContent value="google-sheets">
            </TabsContent>
          </Tabs>

          <div className="grid w-full gap-4 mt-4">
            <Textarea
              placeholder={`e.g., Sum values in column B if column A is "Completed"`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isLoading || limitReached}
            />
            <div className="flex justify-between items-center">
                <Button onClick={handleGenerate} disabled={isLoading || limitReached}>
                  <Stars className="mr-2 h-4 w-4" />
                  {isLoading ? 'Generating...' : 'Generate'}
                </Button>
                <Button variant="ghost" onClick={() => setPrompt('')} disabled={isLoading}>Clear</Button>
            </div>
          </div>
          
          {limitReached && (
            <div className="mt-6 text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <h3 className="font-semibold text-destructive">You&apos;ve reached your free limit.</h3>
                <p className="text-sm text-muted-foreground mt-1">Please upgrade to continue generating formulas.</p>
                <Button onClick={handleUpgrade} disabled={isUpgrading} className="mt-4">
                    {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro ($7/mo)'}
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
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(formula)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              )}
              {explanation && (
                 <div className="space-y-2">
                    <h3 className="font-semibold">Explanation</h3>
                    <div className="p-4 rounded-md bg-muted/50 border text-sm">
                        <p>{explanation}</p>
                    </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
} 