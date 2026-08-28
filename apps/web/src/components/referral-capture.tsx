'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureReferralCodeFromUrl } from '@/lib/referral';

/**
 * Mounted once in the root layout — remembers a `?ref=<code>` the moment
 * it appears on any page, regardless of which page a shared link lands on.
 * Reads window.location.search directly rather than next/navigation's
 * useSearchParams(), which would force this whole layout (and every page
 * under it) out of static rendering.
 */
export function ReferralCapture() {
  const pathname = usePathname();

  useEffect(() => {
    captureReferralCodeFromUrl();
  }, [pathname]);

  return null;
}
