'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Location } from '@/types/vehicle';
import { detectLocation } from '@/lib/api';

// Once we've either resolved a location or the user has made a manual
// choice, don't ask for geolocation permission again on every visit.
const LOCATION_SETUP_DONE_KEY = 'locationSetupDone';

export function LocationSelector({
  locations,
  activeDistrictSlug,
}: {
  locations: Location[];
  activeDistrictSlug?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (activeDistrictSlug || localStorage.getItem(LOCATION_SETUP_DONE_KEY)) {
      return;
    }
    if (!('geolocation' in navigator)) {
      localStorage.setItem(LOCATION_SETUP_DONE_KEY, 'true');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void resolveDistrict(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Denied, unavailable, or timed out — fall back to manual selection
        // and don't prompt again this browser.
        localStorage.setItem(LOCATION_SETUP_DONE_KEY, 'true');
      },
      { timeout: 8000 },
    );
    // Only run once per page load; navigating manually afterward shouldn't re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resolveDistrict(latitude: number, longitude: number): Promise<void> {
    localStorage.setItem(LOCATION_SETUP_DONE_KEY, 'true');
    try {
      const result = await detectLocation(latitude, longitude);
      navigateToDistrict(result.matched.slug);
    } catch {
      // Detection failed — the manual selector is always available as a fallback.
    }
  }

  function navigateToDistrict(districtSlug: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (districtSlug) {
      params.set('district', districtSlug);
    } else {
      params.delete('district');
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="district-select" className="text-muted">
        Location
      </label>
      <select
        id="district-select"
        value={activeDistrictSlug ?? ''}
        onChange={(event) => navigateToDistrict(event.target.value)}
        className="border border-line px-2 py-1.5 text-foreground"
      >
        <option value="">All Chhattisgarh</option>
        {locations.map((location) => (
          <option key={location.id} value={location.slug}>
            {location.district}
          </option>
        ))}
      </select>
    </div>
  );
}
