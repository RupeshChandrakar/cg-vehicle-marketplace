import {
  Car,
  Motorbike,
  Scooter,
  Tractor,
  CarTaxiFront,
  Van,
  Truck,
  Bus,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cars: Car,
  bikes: Motorbike,
  scooters: Scooter,
  tractors: Tractor,
  'auto-rickshaws': CarTaxiFront,
  pickups: Van,
  trucks: Truck,
  'commercial-vehicles': Bus,
  'other-vehicles': MoreHorizontal,
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
  'auto-rickshaws': '🛺',
  pickups: '🛻',
  trucks: '🚛',
  'commercial-vehicles': '🚌',
  'other-vehicles': '🚙',
};

export function getCategoryEmoji(slug: string): string {
  return CATEGORY_EMOJI[slug] ?? '🚙';
}
