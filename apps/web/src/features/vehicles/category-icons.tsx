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
 * Colorful vehicle emoji, used where a playful/illustrative look is wanted
 * (home page category tiles, the sell wizard's vehicle-type picker) instead
 * of the monochrome line icons above. Real platform emoji, not a copy of
 * any specific stock illustration set — there's no license to reproduce a
 * purchased icon pack pixel-for-pixel, but native emoji genuinely deliver
 * the same "colorful, instantly recognizable vehicle icon" effect for free.
 */
const CATEGORY_EMOJI: Record<string, string> = {
  cars: '🚗',
  bikes: '🏍️',
  scooters: '🛵',
  tractors: '🚜',
  'commercial-vehicles': '🚌',
};

export function getCategoryEmoji(slug: string): string {
  return CATEGORY_EMOJI[slug] ?? '🚙';
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
