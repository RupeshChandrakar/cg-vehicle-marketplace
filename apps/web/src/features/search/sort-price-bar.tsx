'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, ChevronDown, Wallet, X } from 'lucide-react';
import type { Category, Location } from '@/types/vehicle';
import type { VehicleSortOption } from '@/lib/api';
import { formatPrice } from '@/lib/format';

const SORT_OPTIONS: Array<{ value: VehicleSortOption; label: string }> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// Preset bands rather than a free min/max panel — same "no custom
// dropdown/bottom-sheet" constraint the rest of this app already follows
// (native <select>s styled as pills), and presets are the faster tap on
// mobile anyway. Values in rupees.
const PRICE_BANDS: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'Any Price' },
  { label: 'Under ₹1 Lakh', max: 100000 },
  { label: '₹1 – 3 Lakh', min: 100000, max: 300000 },
  { label: '₹3 – 5 Lakh', min: 300000, max: 500000 },
  { label: '₹5 – 10 Lakh', min: 500000, max: 1000000 },
  { label: 'Above ₹10 Lakh', min: 1000000 },
];

/**
 * Sort + Price Range — the two real "quick win" filters that already had
 * full backend support (VehicleQueryDto's sort/minPrice/maxPrice) but no
 * frontend control at all (see docs/ARCHITECTURE.md's gap-analysis
 * quick-wins section). Added as part of a PO-referenced Spinny-style
 * listing redesign (2026-09-04) — category and district already have
 * their own established controls elsewhere on this page (the category
 * tiles, SearchLocationBar's district picker), so this deliberately
 * doesn't duplicate them into a second set of pills; it only adds what
 * was genuinely missing. Uses the same invisible-native-<select>-over-a-
 * styled-pill trick SearchLocationBar's district picker already
 * established, rather than a new custom dropdown component.
 */
export function SortPriceBar({
  categories,
  locations,
}: {
  categories: Category[];
  locations: Location[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = (searchParams.get('sort') as VehicleSortOption) || 'newest';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const categorySlug = searchParams.get('category');
  const districtSlug = searchParams.get('district');
  const query = searchParams.get('q');

  const activeBandIndex = PRICE_BANDS.findIndex(
    (band) =>
      String(band.min ?? '') === (minPrice ?? '') && String(band.max ?? '') === (maxPrice ?? ''),
  );
  const activeBand = PRICE_BANDS[activeBandIndex > -1 ? activeBandIndex : 0];

  function updateParams(next: Record<string, string | undefined>): void {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  }

  function handleSortChange(value: string): void {
    updateParams({ sort: value === 'newest' ? undefined : value });
  }

  function handlePriceChange(index: string): void {
    const band = PRICE_BANDS[Number(index)];
    updateParams({
      minPrice: band.min ? String(band.min) : undefined,
      maxPrice: band.max ? String(band.max) : undefined,
    });
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const activeDistrict = locations.find((l) => l.slug === districtSlug);

  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (query) chips.push({ key: 'q', label: `"${query}"`, onRemove: () => updateParams({ q: undefined }) });
  if (activeCategory) {
    chips.push({
      key: 'category',
      label: activeCategory.name,
      onRemove: () => updateParams({ category: undefined }),
    });
  }
  if (activeDistrict) {
    chips.push({
      key: 'district',
      label: activeDistrict.district,
      onRemove: () => updateParams({ district: undefined }),
    });
  }
  if (minPrice || maxPrice) {
    chips.push({
      key: 'price',
      label:
        minPrice && maxPrice
          ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
          : minPrice
            ? `Above ${formatPrice(minPrice)}`
            : `Under ${formatPrice(maxPrice as string)}`,
      onRemove: () => updateParams({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  if (sort !== 'newest') {
    chips.push({
      key: 'sort',
      label: SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort,
      onRemove: () => updateParams({ sort: undefined }),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Pill>
          <ArrowUpDown className="h-3.5 w-3.5" />
          {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort'}
          <ChevronDown className="h-3.5 w-3.5" />
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Pill>

        <Pill>
          <Wallet className="h-3.5 w-3.5" />
          {activeBand.label}
          <ChevronDown className="h-3.5 w-3.5" />
          <select
            aria-label="Price Range"
            value={String(activeBandIndex > -1 ? activeBandIndex : 0)}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {PRICE_BANDS.map((band, index) => (
              <option key={band.label} value={index}>
                {band.label}
              </option>
            ))}
          </select>
        </Pill>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="press-chip flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-line"
            >
              {chip.label}
              <X className="h-3 w-3 text-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="press-chip relative flex items-center gap-1.5 rounded-full border border-line bg-background px-3.5 py-2 text-xs font-medium text-foreground shadow-card">
      {children}
    </span>
  );
}
