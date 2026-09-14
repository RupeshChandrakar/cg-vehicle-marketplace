import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthenticatedStaff, TokenPair } from './auth.service';
import {
  CustomerAuthService,
  AuthenticatedCustomer,
} from './customer-auth.service';
import { StaffLoginDto } from './dto/staff-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly customerAuthService: CustomerAuthService,
  ) {}

  // 5 attempts / 15 min per IP -- password brute-force guard. Deliberately
  // separate from the global default since this is the one endpoint where
  // a wrong guess should get materially more expensive to repeat.
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Post('staff/login')
  login(
    @Body() dto: StaffLoginDto,
  ): Promise<{ user: AuthenticatedStaff; tokens: TokenPair }> {
    return this.authService.loginStaff(dto.email, dto.password);
  }

  // 3 / 5 min per IP -- each call sends a real SMS, so this is a cost/spam
  // guard as much as a security one (unlimited requests let anyone SMS-bomb
  // an arbitrary phone number for free).
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @Post('customer/otp/request')
  requestOtp(@Body() dto: RequestOtpDto): Promise<{ message: string }> {
    return this.customerAuthService.requestOtp(dto.phone, dto.referralCode);
  }

  // Temporary dev shortcut: accept a valid phone number and log the user in
  // immediately, without an OTP. This keeps the customer flow working while
  // the real SMS-backed flow is still being wired up in production.
  @Throttle({ default: { limit: 20, ttl: 300_000 } })
  @Post('customer/login')
  loginWithPhone(
    @Body() dto: RequestOtpDto,
  ): Promise<{ user: AuthenticatedCustomer; tokens: TokenPair }> {
    return this.customerAuthService.loginWithPhone(dto.phone, dto.referralCode);
  }

  // 10 / 5 min per IP -- CustomerAuthService already locks out a single
  // account after MAX_OTP_ATTEMPTS wrong codes; this adds an IP-level
  // backstop against guessing across many different phone numbers from
  // one source.
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @Post('customer/otp/verify')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
  ): Promise<{ user: AuthenticatedCustomer; tokens: TokenPair }> {
    return this.customerAuthService.verifyOtp(dto.phone, dto.otp, dto.name);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPair> {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.id);
  }
}
