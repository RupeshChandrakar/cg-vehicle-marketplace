'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  ApiError,
} from '@/lib/api';
import type { AppNotification } from '@/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setNotifications(await getNotifications(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleMarkRead(id: string): Promise<void> {
    if (!accessToken) return;
    await markNotificationRead(accessToken, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function handleMarkAllRead(): Promise<void> {
    if (!accessToken) return;
    await markAllNotificationsRead(accessToken);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  if (isAuthLoading || !user) {
    return null;
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        {hasUnread && (
          <button
            onClick={() => void handleMarkAllRead()}
            className="ml-auto text-sm font-medium text-primary"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="rounded-2xl bg-background px-4 py-12 text-center text-sm text-muted shadow-card">
          No notifications.
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => !notification.isRead && void handleMarkRead(notification.id)}
              className={`block w-full rounded-2xl p-4 text-left text-sm shadow-card transition ${
                notification.isRead ? 'bg-background' : 'bg-primary-light'
              }`}
            >
              <p className="font-medium text-foreground">{notification.title}</p>
              <p className="text-muted">{notification.body}</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(notification.createdAt).toLocaleString('en-IN')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
