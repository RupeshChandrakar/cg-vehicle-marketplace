'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { getNotifications } from './api';

/** Shared by the sidebar nav badge and the top bar bell — same count, two views. */
export function useUnreadNotifications(): number {
  const { accessToken } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    getNotifications(accessToken)
      .then((notifications) => setCount(notifications.filter((n) => !n.isRead).length))
      .catch(() => undefined);
  }, [accessToken]);

  return count;
}
