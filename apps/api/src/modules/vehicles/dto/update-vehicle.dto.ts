import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  FuelType,
  Transmission,
  VehicleCondition,
} from '../../../generated/prisma/client';
import { VehicleSpecsDto } from './vehicle-specs.dto';

const OLDEST_ACCEPTED_YEAR = 1980;

/**
 * Admin/agent edit of an existing listing — every field is optional so a
 * caller can send just what changed. Deliberately excludes categorySlug/
 * locationSlug relation swaps beyond what's listed below, and always
 * excludes seller identity (sellerName/sellerPhone) — reassigning a listing
 * to a different seller is a different, unsupported operation. `specs` is
 * merged onto the existing JSON blob by the service rather than replacing
 * it wholesale, so a partial specs update doesn't wipe untouched fields.
 */
export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  locationSlug?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(OLDEST_ACCEPTED_YEAR)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmDriven?: number;

  @IsOptional()
  @IsIn(Object.values(FuelType))
  fuelType?: FuelType;

  @IsOptional()
  @IsIn(Object.values(Transmission))
  transmission?: Transmission;

  @IsOptional()
  @IsIn(Object.values(VehicleCondition))
  condition?: VehicleCondition;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleSpecsDto)
  specs?: VehicleSpecsDto;
}
