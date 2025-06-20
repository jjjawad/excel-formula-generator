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
        redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`}
      />
    </div>
  );
} 