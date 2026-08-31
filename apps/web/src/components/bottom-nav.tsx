'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, CirclePlus, MessageCircle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAutoHideOnScroll } from '@/hooks/use-auto-hide-on-scroll';

// Mobile-only primary navigation (SiteHeader shrinks to a logo-only bar
// below the `sm` breakpoint — see site-header.tsx). Modeled on Uber's real,
// live-production bottom nav (Home/Services/Activity/Account, confirmed via
// TechCrunch's Feb 2023 coverage + Uber's own Base design-system docs): flat,
// equal-weight tabs, NO raised/floating center button — the research behind
// this found neither Uber nor Ola actually ships a FAB-style center action,
// despite that being the common assumption. "Sell" gets a flat accent-color
// icon fill instead, for visual prominence without a floating element.
//
// Floating-pill shape + auto-hide-on-scroll (2026-08-31): a reference native
// app the PO pointed to made the flush full-width bar this used to be feel
// distinctly "web," not "app" — real ride-hailing/service apps consistently
// float their bottom bar off the edges with real margin, blur, and shadow,
// and hide it while the user is mid-scroll rather than leaving it pinned.
const TABS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Favorites', href: '/favorites', icon: Heart },
  { label: 'Sell', href: '/sell', icon: CirclePlus },
  { label: 'Enquiries', href: '/my-enquiries', icon: MessageCircle },
  { label: 'Account', href: '/account', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const visible = useAutoHideOnScroll();

  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-4 z-30 flex items-center justify-around rounded-[28px] bg-background/95 px-1 py-2 shadow-float backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-[calc(100%+1.5rem)]'
      }`}
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        const isSell = tab.label === 'Sell';
        const emphasized = isActive || isSell;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="press-text flex flex-1 flex-col items-center gap-1 px-1"
          >
            <span
              className={`flex h-8 w-11 items-center justify-center rounded-2xl ${
                isSell ? 'bg-gold' : isActive ? 'bg-primary-light' : ''
              }`}
            >
              <tab.icon
                className={`h-5 w-5 ${emphasized ? 'text-primary-dark' : 'text-muted'}`}
                strokeWidth={1.75}
              />
            </span>
            <span className={`text-[10px] font-medium ${emphasized ? 'text-primary-dark' : 'text-muted'}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
