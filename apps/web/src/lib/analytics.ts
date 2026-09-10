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

  const search = typeof window !== 'undefined' ? window.location.search : '';
  const pageUrl = typeof window !== 'undefined' ? new URL(window.location.href) : null;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : undefined;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : undefined;
  const colorScheme =
    typeof window !== 'undefined' &&
    'matchMedia' in window &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  const reducedMotion =
    typeof window !== 'undefined' &&
    'matchMedia' in window &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : undefined;
  const deviceMemory =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory)
      : undefined;
  const hardwareConcurrency =
    typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator
      ? navigator.hardwareConcurrency
      : undefined;
  const connectionType =
    typeof navigator !== 'undefined' && 'connection' in navigator
      ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
          ?.effectiveType
      : undefined;
  const utmSource = pageUrl?.searchParams.get('utm_source') ?? undefined;
  const utmMedium = pageUrl?.searchParams.get('utm_medium') ?? undefined;
  const utmCampaign = pageUrl?.searchParams.get('utm_campaign') ?? undefined;
  const language = typeof navigator !== 'undefined' ? navigator.language : undefined;
  const timezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
      : undefined;
  const screenWidth = typeof window !== 'undefined' ? window.screen.width : undefined;
  const screenHeight = typeof window !== 'undefined' ? window.screen.height : undefined;

  void fetch(`${API_BASE_URL}/analytics/page-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      path: `${path}${search}`,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      utmSource,
      utmMedium,
      utmCampaign,
      language,
      timezone,
      screenWidth,
      screenHeight,
        viewportWidth,
        viewportHeight,
        colorScheme,
        reducedMotion,
        touchPoints,
        deviceMemory,
        hardwareConcurrency,
        connectionType,
      vehiclePublicId,
    }),
    keepalive: true,
  }).catch(() => undefined);
}
