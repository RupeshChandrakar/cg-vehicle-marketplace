import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @Post('staff/login')
  login(
    @Body() dto: StaffLoginDto,
  ): Promise<{ user: AuthenticatedStaff; tokens: TokenPair }> {
    return this.authService.loginStaff(dto.email, dto.password);
  }

  @Post('customer/otp/request')
  requestOtp(@Body() dto: RequestOtpDto): Promise<{ message: string }> {
    return this.customerAuthService.requestOtp(dto.phone, dto.referralCode);
  }

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
