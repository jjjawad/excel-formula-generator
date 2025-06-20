'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function AuthForm() {
  const supabase = createClient();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <LogIn className="h-5 w-5" />
          Sign In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                }
              }
            }
          }}
          providers={['google']}
          theme="light"
          redirectTo={process.env.NEXT_PUBLIC_BASE_URL}
        />
      </CardContent>
    </Card>
  );
} 