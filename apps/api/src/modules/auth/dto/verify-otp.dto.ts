import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

const INDIAN_MOBILE_PATTERN = /^\+91[6-9]\d{9}$/;

export class VerifyOtpDto {
  @Matches(INDIAN_MOBILE_PATTERN, {
    message: 'phone must be a valid Indian mobile number, e.g. +919876543210',
  })
  phone!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;

  // Lets a first-time customer set their name at the moment they verify,
  // instead of a separate profile-update step.
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
