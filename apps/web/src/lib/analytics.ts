import { API_BASE_URL } from '@/config/api';

const SESSION_ID_STORAGE_KEY = 'cg_session_id';

/**
 * Anonymous per-browser identifier for visit/view analytics — a random
 * UUID persisted in localStorage, never tied to a name/phone/account.
 * Generated client-side (not a cookie from the API) so it works with zero
 * cross-origin cookie configuration between the web app and the API.
 */
export function getOrCreateSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = window.localStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing) return existing;
    const sessionId = crypto.randomUUID();
    window.localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    // Private browsing / storage disabled — analytics just doesn't fire.
    return null;
  }
}

/**
 * Fire-and-forget page-view tracking — must never throw, block navigation,
 * or affect the page in any way if it fails (analytics is not a real
 * feature dependency). vehiclePublicId is the public sequential ID (never
 * the internal id) — same convention as Favorites/Enquiries. See
 * AnalyticsService.trackPageView on the API.
 */
export function trackPageView(path: string, vehiclePublicId?: number): void {
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  void fetch(`${API_BASE_URL}/analytics/page-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, path, vehiclePublicId }),
    keepalive: true,
  }).catch(() => undefined);
}
