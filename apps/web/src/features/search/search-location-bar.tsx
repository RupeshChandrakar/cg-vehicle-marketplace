'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import type { Location } from '@/types/vehicle';
import { detectLocation } from '@/lib/api';

// Once we've either resolved a location or the user has made a manual
// choice, don't ask for geolocation permission again on every visit.
const LOCATION_SETUP_DONE_KEY = 'locationSetupDone';

interface SearchLocationBarProps {
  locations: Location[];
  activeDistrictSlug?: string;
  initialQuery?: string;
  /** 'floating' sits over the hero panel and carries the stronger elevated
   *  shadow; 'inline' is the plain in-flow version used once filters are
   *  active and there's no hero panel to float over. */
  variant?: 'floating' | 'inline';
}

// The single merged search + location control — Aangan's signature "floating
// pill overlapping the hero" device, doubling as the plain search bar once
// filters are active. Kept as one component (rather than two side-by-side
// ones) so the location segment and the search segment always read as one
// considered control, not two separate boxes.
export function SearchLocationBar({
  locations,
  activeDistrictSlug,
  initialQuery,
  variant = 'inline',
}: SearchLocationBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery ?? '');

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

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    router.push(`/?${params.toString()}`);
  }

  const activeDistrict = locations.find((location) => location.slug === activeDistrictSlug);

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-full border border-line bg-background ${
        variant === 'floating' ? 'shadow-float' : 'shadow-card'
      }`}
    >
      <div className="relative flex shrink-0 items-center gap-2 py-2.5 pr-4 pl-5">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">
            {activeDistrict?.district ?? 'All Chhattisgarh'}
          </p>
          <p className="text-xs text-muted">Chhattisgarh</p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        <select
          aria-label="District"
          value={activeDistrictSlug ?? ''}
          onChange={(event) => navigateToDistrict(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          <option value="">All Chhattisgarh</option>
          {locations.map((location) => (
            <option key={location.id} value={location.slug}>
              {location.district}
            </option>
          ))}
        </select>
      </div>

      <span className="my-2 w-px shrink-0 bg-line" aria-hidden="true" />

      <form onSubmit={handleSubmit} className="relative flex flex-1 items-center">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Car, Bike, Tractor ya Auto search karein"
          className="w-full bg-transparent py-2.5 pr-4 pl-10 text-sm text-foreground focus:outline-none"
        />
      </form>
    </div>
  );
}
