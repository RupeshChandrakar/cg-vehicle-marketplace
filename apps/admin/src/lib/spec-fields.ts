import { Cylinder, Settings2, Users, Weight, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { VehicleSpecs } from '@/types/vehicle';

/**
 * Mirrors apps/web/src/features/vehicles/spec-fields.ts exactly (same
 * field defs, same per-category mapping) — duplicated rather than shared
 * for now, same "hand-written until a second consumer needs it" call
 * apps/admin's own types/vehicle.ts already made for the base Vehicle
 * shapes. Keep both files in sync if either changes.
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
  inputType: 'number' | 'text';
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

export function getSpecFieldsForCategory(categorySlug: string): SpecFieldConfig[] {
  const entries = CATEGORY_SPECS[categorySlug] ?? [];
  return entries.map(({ key, highlight, unitOverride }) => ({
    key,
    ...FIELD_DEFS[key],
    unit: unitOverride ?? FIELD_DEFS[key].unit,
    highlight,
  }));
}

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
