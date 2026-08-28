'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { brand } from '@cg/shared-config';
import { useAuth } from '@/lib/auth-context';
import { getNotifications } from '@/lib/api';

export function SiteHeader() {
  const { user, accessToken, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    getNotifications(accessToken)
      .then((notifications) => setUnreadCount(notifications.filter((n) => !n.isRead).length))
      .catch(() => undefined);
  }, [accessToken]);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-foreground">
          {brand.name} Admin
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/queue" className="text-foreground">
              Vehicle Queue
            </Link>
            <Link href="/enquiries" className="text-foreground">
              Enquiries
            </Link>
            <Link href="/notifications" className="text-foreground">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Link>
            <span className="text-muted">{user.name ?? user.email}</span>
            <button onClick={logout} className="border border-line px-3 py-1.5 text-foreground">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
