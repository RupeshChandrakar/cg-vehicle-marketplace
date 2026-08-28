'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useUnreadNotifications } from '@/lib/use-unread-notifications';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/queue': 'Vehicle Queue',
  '/enquiries': 'Enquiries',
  '/finance-leads': 'Finance Leads',
  '/analytics': 'Analytics',
  '/notifications': 'Notifications',
};

export function TopBar() {
  const pathname = usePathname();
  const unreadCount = useUnreadNotifications();

  const title =
    PAGE_TITLES[pathname] ?? (pathname.startsWith('/enquiries/') ? 'Enquiry Details' : 'Admin');

  return (
    <header className="flex items-center justify-between border-b border-line bg-background px-6 py-4">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <Link href="/notifications" aria-label="Notifications" className="relative text-foreground">
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
