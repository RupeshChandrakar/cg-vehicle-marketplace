import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const PREFERRED_CONTACT_METHODS = ['call', 'chat', 'both'] as const;
export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];

/**
 * Supplementary listing details kept inside `Vehicle.specs` (a flexible JSON
 * column) rather than as dedicated table columns — cheap to add, easy to
 * promote to real columns later if we ever need to filter/sort on them.
 *
 * `registrationNumber` is the one field here that's genuinely sensitive —
 * VehiclesService strips it out before building a public-facing response.
 */
export class VehicleSpecsDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  registrationNumber?: string;

  @IsOptional()
  @IsBoolean()
  rcAvailable?: boolean;

  @IsOptional()
  @IsISO8601()
  insuranceValidUntil?: string;

  @IsOptional()
  @IsBoolean()
  noChallan?: boolean;

  @IsOptional()
  @IsBoolean()
  nonAccident?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ownerCount?: number;

  /** Free-text area/city/village — supplements the district-level Location relation. */
  @IsOptional()
  @IsString()
  @MaxLength(150)
  areaText?: string;

  @IsOptional()
  @IsIn(PREFERRED_CONTACT_METHODS)
  preferredContact?: PreferredContactMethod;

  // --- Technical specifications (2026-09-03) ---------------------------
  // Which of these are relevant/shown is a per-category decision made on
  // the frontend (see apps/web/src/features/vehicles/spec-fields.ts) — all
  // optional here since not every field applies to every category, and
  // older listings predate this entirely. Ranges are generous real-world
  // bounds (defense against garbage input), not a claim every value in
  // range is realistic for every category.

  /** Engine displacement — cars, bikes, scooters, commercial vehicles. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  engineCc?: number;

  /** Max power. Labeled "BHP" for cars/bikes/commercial, "HP" for
   *  tractors on the frontend — same underlying number, different
   *  conventional unit name by category. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2000)
  powerBhp?: number;

  /** Fuel efficiency — cars, bikes, scooters. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  mileageKmpl?: number;

  /** Cars, commercial vehicles (passenger variants). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  seatingCapacity?: number;

  /** Cars. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  groundClearanceMm?: number;

  /** Cars, bikes, scooters, tractors, commercial vehicles. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  fuelTankCapacityL?: number;

  /** PTO (power take-off) horsepower — tractors only. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  ptoHp?: number;

  /** Hydraulic lifting capacity — tractors only. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20000)
  liftingCapacityKg?: number;

  /** Rated load capacity — commercial vehicles only. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50000)
  loadCapacityKg?: number;

  /** Tractors, and optionally cars/commercial vehicles. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(16)
  numberOfCylinders?: number;

  /** Freeform since the real-world format varies widely (e.g. "8F + 2R",
   *  "5-speed manual") — tractors, and optionally cars/bikes. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  numberOfGears?: string;
}
