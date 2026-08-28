import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { EnquiryChannel } from '../../../generated/prisma/client';

const INDIAN_MOBILE_PATTERN = /^\+91[6-9]\d{9}$/;

export class CreateEnquiryDto {
  // The customer only ever sees a vehicle's public ID, never its internal
  // DB id — the service resolves this to the real vehicle server-side.
  @Type(() => Number)
  @IsInt()
  vehiclePublicId!: number;

  @IsIn(Object.values(EnquiryChannel))
  channel!: EnquiryChannel;

  @IsString()
  @MinLength(2)
  customerName!: string;

  @Matches(INDIAN_MOBILE_PATTERN, {
    message:
      'customerPhone must be a valid Indian mobile number, e.g. +919876543210',
  })
  customerPhone!: string;

  @IsOptional()
  @IsString()
  message?: string;
}
