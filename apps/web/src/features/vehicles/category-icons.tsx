import {
  Car,
  Motorbike,
  Scooter,
  Tractor,
  Bus,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

// Categories trimmed to 5 (2026-08-30, PO request) — Auto-rickshaws/
// Pickups/Trucks/Other Vehicles no longer exist as categories, so their
// icon/emoji entries were removed rather than left mapping to nothing. Both
// lookups already fall back gracefully for any slug not listed here.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cars: Car,
  bikes: Motorbike,
  scooters: Scooter,
  tractors: Tractor,
  'commercial-vehicles': Bus,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? MoreHorizontal;
}

/**
 * A soft pastel tint per category tile, at rest (2026-08-31) — purely
 * decorative variety, not tied to the brand/semantic palette (primary/
 * success/gold keep their own real meanings elsewhere). Modeled on a
 * reference native app's own service-tile pattern the PO pointed to: a
 * distinct color per tile reads as more "real app," a uniform gray/white
 * chip for every category reads flatter. Tractors reuses the real
 * --color-success green (agriculture association fits, and it's a
 * meaningful tie-in rather than one more arbitrary hue); the rest are
 * plain Tailwind pastels chosen only for variety.
 */
const CATEGORY_TINT: Record<string, string> = {
  cars: 'bg-blue-50',
  bikes: 'bg-orange-50',
  scooters: 'bg-purple-50',
  tractors: 'bg-success/10',
  'commercial-vehicles': 'bg-rose-50',
};

export function getCategoryTint(slug: string): string {
  return CATEGORY_TINT[slug] ?? 'bg-line/40';
}

/**
 * The icon's own color, paired one-to-one with getCategoryTint (2026-08-31)
 * — matches the reference app's own convention exactly: each tile's icon is
 * colored to match its background tint (a blue icon on light blue, not a
 * flat black icon on a colored chip), not just the background varying.
 */
const CATEGORY_ICON_COLOR: Record<string, string> = {
  cars: 'text-blue-600',
  bikes: 'text-orange-600',
  scooters: 'text-purple-600',
  tractors: 'text-success',
  'commercial-vehicles': 'text-rose-600',
};

export function getCategoryIconColor(slug: string): string {
  return CATEGORY_ICON_COLOR[slug] ?? 'text-muted';
}
