'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, CirclePlus, MessageCircle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mobile-only primary navigation (SiteHeader shrinks to a logo-only bar
// below the `sm` breakpoint — see site-header.tsx). Modeled on Uber's real,
// live-production bottom nav (Home/Services/Activity/Account, confirmed via
// TechCrunch's Feb 2023 coverage + Uber's own Base design-system docs): flat,
// equal-weight tabs, NO raised/floating center button — the research behind
// this found neither Uber nor Ola actually ships a FAB-style center action,
// despite that being the common assumption. "Sell" gets a flat accent-color
// icon fill instead, for visual prominence without a floating element.
const TABS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Favorites', href: '/favorites', icon: Heart },
  { label: 'Sell', href: '/sell', icon: CirclePlus },
  { label: 'Enquiries', href: '/my-enquiries', icon: MessageCircle },
  { label: 'Account', href: '/account', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-background pt-2 sm:hidden"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        const isSell = tab.label === 'Sell';
        const emphasized = isActive || isSell;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="press-text flex flex-col items-center gap-1 px-2"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${isSell ? 'bg-gold' : ''}`}
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
