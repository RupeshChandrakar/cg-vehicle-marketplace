import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Prisma, User } from '../../generated/prisma/client';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_MAX_ATTEMPTS = 5;

export interface ReferralInfo {
  referralCode: string;
  totalReferred: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phone number is the durable identity, matching the eventual OTP login
   * flow. `referralCode` is only ever consulted here, at first contact —
   * it resolves to a referrer and is stored on `referredById` at creation
   * time only, never touched again on a returning user's later logins.
   */
  async findOrCreateByPhone(
    phone: string,
    name?: string,
    referralCode?: string,
  ): Promise<User> {
    let referredById: string | undefined;
    if (referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode },
      });
      // A stale/unknown code shouldn't block signup, and a code can't
      // attribute a user to themselves.
      if (referrer && referrer.phone !== phone) {
        referredById = referrer.id;
      }
    }

    return this.prisma.user.upsert({
      where: { phone },
      update: name ? { name } : {},
      create: { phone, name, referredById },
    });
  }

  /**
   * Referral codes are generated lazily on first request rather than
   * backfilled for every existing user — avoids a unique-column backfill
   * migration for a feature most existing rows will never need touched.
   */
  async getReferralInfo(userId: string): Promise<ReferralInfo> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const referralCode =
      user.referralCode ?? (await this.assignReferralCode(userId));
    const totalReferred = await this.prisma.user.count({
      where: { referredById: userId },
    });

    return { referralCode, totalReferred };
  }

  private async assignReferralCode(userId: string): Promise<string> {
    for (let attempt = 0; attempt < REFERRAL_CODE_MAX_ATTEMPTS; attempt++) {
      const code = randomUUID()
        .replace(/-/g, '')
        .slice(0, REFERRAL_CODE_LENGTH)
        .toUpperCase();
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
        });
        return code;
      } catch (error) {
        const isCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === UNIQUE_CONSTRAINT_VIOLATION;
        // Unique constraint collision (astronomically unlikely at 8 hex
        // chars) — try again with a fresh code. Anything else (DB down,
        // etc.) should surface immediately, not be masked by a retry loop.
        if (!isCollision) throw error;
      }
    }
    throw new Error('Could not generate a unique referral code');
  }
}
