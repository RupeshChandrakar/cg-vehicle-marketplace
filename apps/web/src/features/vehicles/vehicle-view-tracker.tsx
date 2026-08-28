'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/** Reports a vehicle detail page view tagged with the vehicle's public ID,
 *  for the admin "Most Viewed Vehicles" leaderboard. Rendered inside the
 *  (server-component) vehicle detail page — see AnalyticsTracker for why
 *  the generic site-wide tracker skips this route instead of double-firing. */
export function VehicleViewTracker({ vehiclePublicId }: { vehiclePublicId: number }) {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname, vehiclePublicId);
  }, [pathname, vehiclePublicId]);

  return null;
}
