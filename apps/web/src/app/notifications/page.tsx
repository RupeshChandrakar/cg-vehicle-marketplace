'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight text-foreground">Notifications</h1>
        {hasUnread && (
          <button
            onClick={() => void handleMarkAllRead()}
            className="press-text text-sm font-medium text-primary"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton skeleton-circle h-10 w-10" />
              <div className="flex-1 space-y-2">
                <div className="skeleton skeleton-title w-2/3" />
                <div className="skeleton skeleton-text w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Bell className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">Koi notification nahi hai.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => !notification.isRead && void handleMarkRead(notification.id)}
              className={`press-card w-full space-y-1 rounded-xl p-4 text-left shadow-card transition ${
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
