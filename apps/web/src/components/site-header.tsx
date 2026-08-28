'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Bell } from 'lucide-react';
import { brand } from '@cg/shared-config';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getNotifications } from '@/lib/api';

export function SiteHeader() {
  const { user, accessToken, logout } = useCustomerAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCount(0);
      return;
    }
    getNotifications(accessToken)
      .then((notifications) => setUnreadCount(notifications.filter((n) => !n.isRead).length))
      .catch(() => undefined);
  }, [accessToken]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          {brand.name}
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link href="/favorites" aria-label="Favorites" className="text-foreground">
                <Heart className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative text-foreground"
              >
                <Bell className="h-5 w-5" strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/my-enquiries"
                className="hidden text-sm font-medium text-foreground sm:inline"
              >
                My Enquiries
              </Link>
              <Link
                href="/refer"
                className="hidden text-sm font-medium text-foreground sm:inline"
              >
                Invite Friends
              </Link>
            </>
          )}

          <Link
            href="/sell"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] hover:shadow-btn-hover-primary active:scale-[0.97]"
          >
            Sell Your Vehicle
          </Link>

          {user ? (
            <button
              onClick={logout}
              className="rounded-lg border border-line px-3 py-2 text-sm text-foreground transition hover:bg-primary-light"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-line px-3 py-2 text-sm text-foreground transition hover:bg-primary-light"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
