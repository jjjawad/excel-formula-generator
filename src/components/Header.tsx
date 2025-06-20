'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';

export function Header({ session, onSignOut }: { session: Session | null, onSignOut: () => void }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">FormulaGenius</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {session ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">{session.user.email}</span>
                <button
                  onClick={onSignOut}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href={pathname} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
} 