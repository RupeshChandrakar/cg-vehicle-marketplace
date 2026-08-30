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
