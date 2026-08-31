import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const INDIAN_MOBILE_PATTERN = /^\+91[6-9]\d{9}$/;

export class CreateFinanceEnquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100) // matches CreateVehicleDto.sellerName's bound
  name!: string;

  @Matches(INDIAN_MOBILE_PATTERN, {
    message: 'phone must be a valid Indian mobile number, e.g. +919876543210',
  })
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  /** Public sequential ID, same convention as Favorites/Enquiries/Analytics
   *  — resolved to the internal id server-side. Absent for a generic
   *  finance enquiry not tied to any one vehicle. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehiclePublicId?: number;
}
