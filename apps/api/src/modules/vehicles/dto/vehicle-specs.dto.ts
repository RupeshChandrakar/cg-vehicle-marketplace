import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
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
  areaText?: string;

  @IsOptional()
  @IsIn(PREFERRED_CONTACT_METHODS)
  preferredContact?: PreferredContactMethod;
}
