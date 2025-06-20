'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabaseClient';

export default function AuthForm() {
  const supabase = createClient();

  return (
    <div className="w-full max-w-md mx-auto">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
        theme="light"
        redirectTo="https://excel-formula-generator-sigma.vercel.app/"
      />
    </div>
  );
} 