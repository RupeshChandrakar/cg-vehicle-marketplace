'use client';

import Link from 'next/link';
import { brand } from '@cg/shared-config';
import { useAuth } from '@/lib/auth-context';

export function SiteHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-foreground">
          {brand.name} Admin
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">{user.name ?? user.email}</span>
            <button onClick={logout} className="border border-line px-3 py-1.5 text-foreground">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
