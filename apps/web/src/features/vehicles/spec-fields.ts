import { Cylinder, Settings2, Users, Weight, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { VehicleSpecs } from '@/types/vehicle';

/**
 * Single source of truth for "which technical spec fields apply to which
 * vehicle category, in what order, with what label/unit/icon" — reused by
 * the vehicle detail page (display), the sell wizard, and the edit-listing
 * form (data entry), so the three never drift out of sync with each other.
 *
 * A tractor and a hatchback don't share a meaningful spec sheet — showing
 * "Seating Capacity" on a tractor or "PTO Horsepower" on a car would read
 * as filler, not depth. Field choices and per-category groupings are
 * grounded in what every major Indian vehicle marketplace (Cars24,
 * CarDekho, OLX Autos for cars/bikes; khetigaadi.com/TractorJunction for
 * tractors, already reviewed once this project — see docs/ARCHITECTURE.md
 * "Competitive review — khetigaadi.com") actually shows on a listing.
 */

export type SpecFieldKey =
  | 'seatingCapacity'
  | 'ptoHp'
  | 'liftingCapacityKg'
  | 'loadCapacityKg'
  | 'numberOfCylinders'
  | 'numberOfGears';

export interface SpecFieldConfig {
  key: SpecFieldKey;
  label: string;
  unit?: string;
  icon: LucideIcon;
  /** Numeric vs. freeform text input, for forms. */
  inputType: 'number' | 'text';
  /** A headline spec — shown bigger/first on the detail page. */
  highlight?: boolean;
}

interface FieldDef {
  label: string;
  unit?: string;
  icon: LucideIcon;
  inputType: 'number' | 'text';
}

const FIELD_DEFS: Record<SpecFieldKey, FieldDef> = {
  seatingCapacity: { label: 'Seating', unit: 'seats', icon: Users, inputType: 'number' },
  ptoHp: { label: 'PTO Power', unit: 'HP', icon: Zap, inputType: 'number' },
  liftingCapacityKg: { label: 'Lifting Capacity', unit: 'kg', icon: Weight, inputType: 'number' },
  loadCapacityKg: { label: 'Load Capacity', unit: 'kg', icon: Weight, inputType: 'number' },
  numberOfCylinders: { label: 'Cylinders', icon: Cylinder, inputType: 'number' },
  numberOfGears: { label: 'Gears', icon: Settings2, inputType: 'text' },
};

interface CategoryFieldEntry {
  key: SpecFieldKey;
  highlight?: boolean;
  /** Only tractors call power "HP" rather than "BHP" — same field, different conventional unit name. */
  unitOverride?: string;
}

const CATEGORY_SPECS: Record<string, CategoryFieldEntry[]> = {
  cars: [
    { key: 'seatingCapacity' },
  ],
  bikes: [],
  scooters: [],
  tractors: [
    { key: 'liftingCapacityKg', highlight: true },
    { key: 'ptoHp' },
    { key: 'numberOfCylinders' },
    { key: 'numberOfGears' },
  ],
  'commercial-vehicles': [
    { key: 'loadCapacityKg', highlight: true },
    { key: 'seatingCapacity' },
    { key: 'numberOfGears' },
  ],
};

/** All fields this category can capture/show, in display order. */
export function getSpecFieldsForCategory(categorySlug: string): SpecFieldConfig[] {
  const entries = CATEGORY_SPECS[categorySlug] ?? [];
  return entries.map(({ key, highlight, unitOverride }) => ({
    key,
    ...FIELD_DEFS[key],
    unit: unitOverride ?? FIELD_DEFS[key].unit,
    highlight,
  }));
}

/** Same fields, but only the ones actually filled in on this vehicle —
 *  for display, so an unfilled field never renders as an empty row. */
export function getFilledSpecFields(
  categorySlug: string,
  specs: VehicleSpecs,
): Array<SpecFieldConfig & { value: string | number }> {
  return getSpecFieldsForCategory(categorySlug)
    .map((field) => ({ field, value: specs[field.key] }))
    .filter(
      (entry): entry is { field: SpecFieldConfig; value: string | number } =>
        entry.value !== undefined && entry.value !== null && entry.value !== '',
    )
    .map(({ field, value }) => ({ ...field, value }));
}

/** Form inputs everywhere hold these as plain strings (like every other
 *  numeric field in the sell wizard/edit form, e.g. `year`/`price`); this
 *  converts a category's filled-in string values into the properly-typed
 *  partial VehicleSpecs to merge into the real payload — shared by the
 *  sell wizard and the edit-listing form so the string->number handling
 *  (and which fields are numeric vs. freeform text) lives in one place. */
export function buildTechSpecsPayload(
  categorySlug: string,
  values: Partial<Record<SpecFieldKey, string>>,
): Partial<VehicleSpecs> {
  const payload: Partial<VehicleSpecs> = {};
  for (const field of getSpecFieldsForCategory(categorySlug)) {
    const raw = values[field.key];
    if (raw === undefined || raw.trim() === '') continue;
    if (field.inputType === 'number') {
      const num = Number(raw);
      if (Number.isFinite(num)) (payload as Record<string, unknown>)[field.key] = num;
    } else {
      (payload as Record<string, unknown>)[field.key] = raw;
    }
  }
  return payload;
}
