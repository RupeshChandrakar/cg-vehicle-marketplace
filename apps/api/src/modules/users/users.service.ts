import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { AdminSellerQueryDto } from './dto/admin-seller-query.dto';
import {
  Prisma,
  User,
  UserRole,
  VehicleStatus,
} from '../../generated/prisma/client';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_MAX_ATTEMPTS = 5;

export interface ReferralInfo {
  referralCode: string;
  totalReferred: number;
}

/** Shape returned to the customer for their own account — deliberately the
 *  same four fields as the web app's client-side CustomerUser, so the
 *  frontend can refresh its cache directly from either GET or PATCH
 *  /users/me without a shape mismatch. No email/avatar/lastLoginAt here —
 *  none of that was asked for; add fields only when a feature needs them. */
export interface SelfProfile {
  id: string;
  name: string | null;
  phone: string;
  role: UserRole;
}

export interface AdminSeller {
  id: string;
  name: string | null;
  phone: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  totalListings: number;
  statusBreakdown: Partial<Record<VehicleStatus, number>>;
}

type SellerWithVehicleStatuses = User & {
  vehiclesSold: Array<{ status: VehicleStatus }>;
};

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

  // --- Customer self-service: own profile. ---

  async getSelf(userId: string): Promise<SelfProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.toSelfProfile(user);
  }

  /** Name-only by design — see UpdateProfileDto's comment for why phone
   *  isn't here. Never spreads the raw DTO into `data`, so this can't
   *  become a privilege-escalation vector even if the global ValidationPipe
   *  were ever loosened. */
  async updateProfile(userId: string, name: string): Promise<SelfProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });
    return this.toSelfProfile(user);
  }

  private toSelfProfile(user: User): SelfProfile {
    return { id: user.id, name: user.name, phone: user.phone, role: user.role };
  }

  // --- Admin: sellers/dealers directory. ---

  /** Customers with at least one vehicle they've ever listed — i.e. actual
   *  sellers/dealers, not every browsing customer. `meta.total` is the
   *  genuine "how many sellers/dealers are there" count, independent of
   *  the page being viewed. */
  async findSellersForAdmin(
    query: AdminSellerQueryDto,
  ): Promise<PaginatedResult<AdminSeller>> {
    const where: Prisma.UserWhereInput = {
      role: UserRole.customer,
      vehiclesSold: { some: {} },
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { vehiclesSold: { select: { status: true } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.toAdminSeller(user)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  private toAdminSeller(user: SellerWithVehicleStatuses): AdminSeller {
    const statusBreakdown = user.vehiclesSold.reduce<
      Partial<Record<VehicleStatus, number>>
    >((breakdown, vehicle) => {
      breakdown[vehicle.status] = (breakdown[vehicle.status] ?? 0) + 1;
      return breakdown;
    }, {});

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      totalListings: user.vehiclesSold.length,
      statusBreakdown,
    };
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
