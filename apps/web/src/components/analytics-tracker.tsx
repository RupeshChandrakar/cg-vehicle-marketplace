'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Mounted once in the root layout — fires an anonymous page-view event on
 * every route change. Vehicle detail pages are deliberately skipped here:
 * VehicleViewTracker on that page reports the same visit tagged with the
 * real vehicleId instead, so a vehicle page produces exactly one event, not
 * two competing ones.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/vehicle/')) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
