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
