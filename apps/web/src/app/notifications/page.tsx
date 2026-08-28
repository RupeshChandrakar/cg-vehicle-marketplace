'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@/lib/api';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useCustomerAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login?next=/notifications');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getNotifications(accessToken)
      .then(setNotifications)
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

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

  if (isAuthLoading || !user) return null;

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        {hasUnread && (
          <button
            onClick={() => void handleMarkAllRead()}
            className="text-sm font-medium text-primary"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="rounded-2xl bg-primary-light px-4 py-16 text-center text-sm text-muted shadow-card">
          Koi notification nahi hai.
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => !notification.isRead && void handleMarkRead(notification.id)}
              className={`w-full space-y-1 rounded-xl p-4 text-left shadow-card transition ${
                notification.isRead ? 'bg-background' : 'bg-primary-light'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{notification.title}</p>
              <p className="text-sm text-muted">{notification.body}</p>
              <p className="text-xs text-muted">
                {new Date(notification.createdAt).toLocaleString('en-IN')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
