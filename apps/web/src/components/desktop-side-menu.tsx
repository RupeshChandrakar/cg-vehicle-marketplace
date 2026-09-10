'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PanelLeftClose,
  PanelLeftOpen,
  CarFront,
  CircleDollarSign,
  Heart,
  House,
  MessageCircleMore,
  Search,
  Tags,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MENU_ITEMS: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}> = [
  {
    label: 'Home',
    href: '/',
    icon: House,
    match: (pathname) => pathname === '/',
  },
  {
    label: 'Browse Vehicles',
    href: '/?sort=newest',
    icon: Search,
    match: (pathname) => pathname === '/',
  },
  {
    label: 'Sell Your Vehicle',
    href: '/sell',
    icon: CircleDollarSign,
    match: (pathname) => pathname.startsWith('/sell'),
  },
  {
    label: 'Favorites',
    href: '/favorites',
    icon: Heart,
    match: (pathname) => pathname.startsWith('/favorites'),
  },
  {
    label: 'My Enquiries',
    href: '/my-enquiries',
    icon: MessageCircleMore,
    match: (pathname) => pathname.startsWith('/my-enquiries') || pathname.startsWith('/enquiry/'),
  },
  {
    label: 'My Listings',
    href: '/my-listings',
    icon: CarFront,
    match: (pathname) => pathname.startsWith('/my-listings'),
  },
  {
    label: 'Refer & Earn',
    href: '/refer',
    icon: Tags,
    match: (pathname) => pathname.startsWith('/refer'),
  },
  {
    label: 'My Account',
    href: '/account',
    icon: User,
    match: (pathname) => pathname.startsWith('/account') || pathname.startsWith('/login'),
  },
];

export function DesktopSideMenu() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`w-full transition-[width] duration-200 ease-out lg:hidden ${
        collapsed ? 'max-w-20' : 'max-w-none'
      }`}
    >
      <div className="rounded-[28px] border border-line bg-background p-4 shadow-card">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Marketplace
            </p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="press-icon rounded-2xl border border-line bg-primary-light p-2 text-foreground hover:bg-primary-light/80"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.9} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.9} />
            )}
          </button>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Mobile marketplace menu">
          {MENU_ITEMS.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`press flex shrink-0 items-center rounded-2xl px-3 py-3 text-sm transition ${
                  collapsed ? 'justify-center' : 'gap-3'
                } ${
                  isActive
                    ? 'bg-primary text-white shadow-btn'
                    : 'text-foreground hover:bg-primary-light'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-5 rounded-3xl bg-primary-light p-4">
            <p className="text-sm font-semibold text-foreground">Quick tip</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Photos, district selection, and a clear asking price help listings sell faster.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}