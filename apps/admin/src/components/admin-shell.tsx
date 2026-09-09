'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

/** The login page (and the brief pre-hydration/logged-out window) render
 *  with no chrome at all — the sidebar/top bar only make sense once there's
 *  a real session to show inside them. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (pathname === '/login' || !user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
