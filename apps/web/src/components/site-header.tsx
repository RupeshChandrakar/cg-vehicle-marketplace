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
    // safe-top reserves real device inset space now that layout.tsx's
    // viewport export sets viewportFit: 'cover' — without it this bar would
    // sit directly under a notch/Dynamic Island. Border/backdrop-blur are
    // desktop-only (sm:) below: on mobile a hard divider line under a
    // repeated brand-name bar is exactly the "website header" pattern a
    // live audit flagged — real app screens don't re-announce their own
    // name on every single tab, they rely on the OS chrome (icon, splash)
    // for that once installed, and BottomNav (already the primary mobile
    // nav) plus each page's own heading for in-app wayfinding.
    <header className="safe-top sticky top-0 z-20 bg-background sm:border-b sm:border-line sm:bg-background/95 sm:backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-foreground sm:text-lg"
        >
          {brand.name}
        </Link>

        {/* Mobile (<sm): logo only — BottomNav is the primary nav there
            (Home/Favorites/Sell/Enquiries/Account), and Notifications/My
            Listings/Invite Friends live inside the Account tab's hub
            instead. Desktop (>=sm): unchanged full nav — no bottom nav
            renders there, matching Uber's own real split between its
            top-nav website and bottom-tab native app. */}
        <div className="hidden items-center gap-4 sm:flex">
          {user && (
            <>
              <Link
                href="/favorites"
                aria-label="Favorites"
                className="press-icon text-foreground"
              >
                <Heart className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="press-icon relative text-foreground"
              >
                <Bell className="h-5 w-5" strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                My Account
              </Link>
              <Link
                href="/my-listings"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                My Listings
              </Link>
              <Link
                href="/my-enquiries"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                My Enquiries
              </Link>
              <Link
                href="/refer"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                Invite Friends
              </Link>
            </>
          )}

          <Link
            href="/sell"
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark hover:shadow-btn-hover-primary active:scale-[0.97]"
          >
            Sell Your Vehicle
          </Link>

          {user ? (
            <button
              onClick={logout}
              className="press rounded-lg border border-line px-3 py-2 text-sm text-foreground transition hover:bg-primary-light"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="press rounded-lg border border-line px-3 py-2 text-sm text-foreground transition hover:bg-primary-light"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
