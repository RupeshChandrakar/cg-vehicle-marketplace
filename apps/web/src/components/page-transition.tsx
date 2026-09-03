'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Next.js's App Router swaps route content instantly with no transition at
 * all by default — one of the more concrete "this is a webpage" signals
 * found in the mobile-app-feel audit (2026-09-03). Keying by pathname
 * forces a fresh mount per navigation, which the .page-transition
 * animation (globals.css) then fades/slides in — a deliberately small,
 * fast effect (220ms) meant to read as "the next screen," not a loading
 * spinner. Wraps only the per-page content in layout.tsx, not SiteHeader/
 * BottomNav, which are persistent chrome and should never re-animate.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
