import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SMS_PROVIDER, type SmsProvider } from '../../infra/sms/sms.provider';
import { AuthService, type TokenPair } from './auth.service';
import { UserRole } from '../../generated/prisma/client';

const OTP_TTL_SECONDS = 5 * 60;
const MIN_RESEND_INTERVAL_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;
const OTP_HASH_ROUNDS = 10;

export interface AuthenticatedCustomer {
  id: string;
  name: string | null;
  phone: string;
  role: UserRole;
}

/** Customer login — phone + OTP, no password (see User model comment).
 *  Reuses AuthService.issueTokens so staff and customer sessions share
 *  identical token issuance/rotation behavior. */
@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  async requestOtp(
    phone: string,
    referralCode?: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOrCreateByPhone(
      phone,
      undefined,
      referralCode,
    );

    if (user.otpExpiresAt) {
      const secondsUntilExpiry =
        (user.otpExpiresAt.getTime() - Date.now()) / 1000;
      const secondsSinceIssued = OTP_TTL_SECONDS - secondsUntilExpiry;
      if (secondsSinceIssued < MIN_RESEND_INTERVAL_SECONDS) {
        const wait = Math.ceil(
          MIN_RESEND_INTERVAL_SECONDS - secondsSinceIssued,
        );
        throw new BadRequestException(
          `Please wait ${wait}s before requesting another OTP`,
        );
      }
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, OTP_HASH_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
        otpAttempts: 0,
      },
    });

    await this.smsProvider.sendOtp(phone, otp);
    return { message: 'OTP sent' };
  }

  async verifyOtp(
    phone: string,
    otp: string,
    name?: string,
  ): Promise<{ user: AuthenticatedCustomer; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user?.otpHash || !user.otpExpiresAt) {
      throw new UnauthorizedException('Request a new OTP first');
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired — request a new one');
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new UnauthorizedException(
        'Too many incorrect attempts — request a new OTP',
      );
    }

    const matches = await bcrypt.compare(otp, user.otpHash);
    if (!matches) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        name: name ?? user.name,
      },
    });

    const tokens = await this.authService.issueTokens(updated.id, updated.role);
    return {
      user: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        role: updated.role,
      },
      tokens,
    };
  }
}

function generateOtp(): string {
  // 6-digit, cryptographically random — never Math.random() for an auth secret.
  return String(randomInt(100000, 1000000));
}
