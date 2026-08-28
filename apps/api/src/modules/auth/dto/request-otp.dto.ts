import { IsOptional, IsString, Matches } from 'class-validator';

const INDIAN_MOBILE_PATTERN = /^\+91[6-9]\d{9}$/;

export class RequestOtpDto {
  @Matches(INDIAN_MOBILE_PATTERN, {
    message: 'phone must be a valid Indian mobile number, e.g. +919876543210',
  })
  phone!: string;

  /** Present only when this visit came in via a `?ref=<code>` referral
   *  link — consulted only if this phone turns out to be a brand-new
   *  signup (see UsersService.findOrCreateByPhone). */
  @IsOptional()
  @IsString()
  referralCode?: string;
}
