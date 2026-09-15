'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  MessageCircle,
  Bell,
  LogOut,
  Clapperboard,
  BarChart3,
  Wallet,
  Users,
  X,
} from 'lucide-react';
import { brand } from '@cg/shared-config';
import { useAuth } from '@/lib/auth-context';
import { getAdminEnquiries } from '@/lib/api';
import { useUnreadNotifications } from '@/lib/use-unread-notifications';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: 'enquiries' | 'notifications';
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/queue', label: 'Vehicle Queue', icon: Car },
  { href: '/sellers', label: 'Sellers', icon: Users },
  { href: '/enquiries', label: 'Enquiries', icon: MessageCircle, badge: 'enquiries' },
  { href: '/finance-leads', label: 'Finance Leads', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/reels', label: 'Reel Studio', icon: Clapperboard },
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, accessToken, logout } = useAuth();
  const [openEnquiries, setOpenEnquiries] = useState(0);
  const unreadNotifications = useUnreadNotifications();

  useEffect(() => {
    if (!accessToken) return;
    getAdminEnquiries(accessToken, 'open')
      .then((result) => setOpenEnquiries(result.meta.total))
      .catch(() => undefined);
  }, [accessToken]);

  const badgeCounts = { enquiries: openEnquiries, notifications: unreadNotifications };

  return (
    <>
      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[88vw] shrink-0 flex-col bg-foreground text-white transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex items-center justify-between gap-2.5 px-5 py-6 lg:justify-start">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
          <Car className="h-5 w-5 text-white" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-base leading-tight font-bold text-white">{brand.name}</p>
          <p className="text-xs text-white/50">Admin Panel</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="press-icon rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const count = item.badge ? badgeCounts[item.badge] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`press flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                {item.label}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? user?.email}</p>
            <p className="text-xs text-white/50 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="press flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Log out
        </button>
      </div>
    </aside>
    </>
  );
}
