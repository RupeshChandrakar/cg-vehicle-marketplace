import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
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
const INDIAN_MOBILE_PATTERN = /^\+91[6-9]\d{9}$/;

export class CreateVehicleDto {
  @IsString()
  categorySlug!: string;

  @IsString()
  locationSlug!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  brand!: string;

  @IsString()
  model!: string;

  @Type(() => Number)
  @IsInt()
  @Min(OLDEST_ACCEPTED_YEAR)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmDriven!: number;

  @IsIn(Object.values(FuelType))
  fuelType!: FuelType;

  @IsIn(Object.values(Transmission))
  transmission!: Transmission;

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

  @IsString()
  sellerName!: string;

  @Matches(INDIAN_MOBILE_PATTERN, {
    message:
      'sellerPhone must be a valid Indian mobile number, e.g. +919876543210',
  })
  sellerPhone!: string;
}
