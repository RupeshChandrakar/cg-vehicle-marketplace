import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtPayload } from './types/jwt-payload.type';
import { UserRole } from '../../generated/prisma/client';

const REFRESH_TOKEN_HASH_ROUNDS = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedStaff {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginStaff(
    email: string,
    password: string,
  ): Promise<{ user: AuthenticatedStaff; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same message whether the email doesn't exist or the password is wrong
    // — a login form shouldn't reveal which accounts exist. Customers have
    // no password at all and can never log in here.
    if (
      !user ||
      !user.passwordHash ||
      !user.email ||
      user.role === UserRole.customer
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.role);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyToken(refreshToken, 'refresh');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    const matchesCurrentSession = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!matchesCurrentSession) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    return this.issueTokens(user.id, user.role);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  /** Issuing a new pair always overwrites the stored hash, so refreshing
   *  rotates the session. Public — CustomerAuthService reuses this exact
   *  logic for OTP login rather than duplicating token issuance. */
  async issueTokens(userId: string, role: UserRole): Promise<TokenPair> {
    const accessToken = await this.signToken(
      userId,
      role,
      'access',
      'JWT_ACCESS_TOKEN_TTL',
      '15m',
    );
    const refreshToken = await this.signToken(
      userId,
      role,
      'refresh',
      'JWT_REFRESH_TOKEN_TTL',
      '30d',
    );

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      REFRESH_TOKEN_HASH_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: userId },
      // lastLoginAt updates on every token issuance (login *and* refresh),
      // not just the initial sign-in — a session being refreshed is itself
      // evidence of genuine recent activity.
      data: { refreshTokenHash, lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken };
  }

  private signToken(
    userId: string,
    role: UserRole,
    type: JwtPayload['type'],
    ttlConfigKey: string,
    ttlDefault: string,
  ): Promise<string> {
    const payload: JwtPayload = { sub: userId, role, type };
    const ttl = this.configService.get<string>(ttlConfigKey, ttlDefault);
    return this.jwtService.signAsync(payload, {
      // `ms`-style duration strings ("15m", "30d") aren't a plain `string`
      // in @nestjs/jwt's types; our config values are always in that shape.
      expiresIn: ttl as NonNullable<
        Parameters<JwtService['signAsync']>[1]
      >['expiresIn'],
    });
  }

  private async verifyToken(
    token: string,
    expectedType: JwtPayload['type'],
  ): Promise<JwtPayload> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type !== expectedType) {
      throw new UnauthorizedException('Invalid token');
    }
    return payload;
  }
}
