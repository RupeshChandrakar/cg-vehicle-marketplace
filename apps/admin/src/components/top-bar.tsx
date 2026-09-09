'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useUnreadNotifications } from '@/lib/use-unread-notifications';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/queue': 'Vehicle Queue',
  '/sellers': 'Sellers',
  '/enquiries': 'Enquiries',
  '/finance-leads': 'Finance Leads',
  '/analytics': 'Analytics',
  '/notifications': 'Notifications',
};

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const unreadCount = useUnreadNotifications();

  const title =
    PAGE_TITLES[pathname] ?? (pathname.startsWith('/enquiries/') ? 'Enquiry Details' : 'Admin');

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-line p-2 text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
      </div>
      <Link href="/notifications" aria-label="Notifications" className="relative shrink-0 text-foreground">
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}
