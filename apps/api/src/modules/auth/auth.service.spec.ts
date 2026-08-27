import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function buildService() {
  const userTable = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { user: userTable };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn((_key: string, fallback: string) => fallback),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const service = new AuthService(
    prisma as never,
    jwtService as never,
    configService as never,
  );
  return { service, prisma, jwtService };
}

describe('AuthService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('loginStaff', () => {
    it('rejects an unknown email without revealing that the account does not exist', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.loginStaff('nobody@cgautomarket.local', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a customer account even if it somehow had a password hash', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'customer',
        email: 'customer@example.com',
        passwordHash: 'hashed',
      });

      await expect(
        service.loginStaff('customer@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'admin',
        email: 'admin@cgautomarket.local',
        passwordHash: 'hashed',
        name: 'Admin',
      });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.loginStaff('admin@cgautomarket.local', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('issues a token pair and stores the hashed refresh token on success', async () => {
      const { service, prisma, jwtService } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'admin',
        email: 'admin@cgautomarket.local',
        passwordHash: 'hashed',
        name: 'Admin',
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('hashed-refresh-token' as never);

      const result = await service.loginStaff(
        'admin@cgautomarket.local',
        'correct-password',
      );

      expect(result.user).toMatchObject({ id: 'admin-1', role: 'admin' });
      expect(result.tokens.accessToken).toBe('signed.jwt.token');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { refreshTokenHash: 'hashed-refresh-token' },
      });
    });
  });

  describe('refresh', () => {
    it('rejects a token that fails signature/expiry verification', async () => {
      const { service, jwtService } = buildService();
      jwtService.verifyAsync.mockRejectedValue(new Error('expired'));

      await expect(service.refresh('bad.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an access token presented as a refresh token', async () => {
      const { service, jwtService } = buildService();
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'admin-1',
        role: 'admin',
        type: 'access',
      });

      await expect(service.refresh('an.access.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a refresh token that does not match the stored session', async () => {
      const { service, prisma, jwtService } = buildService();
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'admin-1',
        role: 'admin',
        type: 'refresh',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        refreshTokenHash: 'stored-hash',
      });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.refresh('stale.refresh.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rotates the session on a valid refresh token', async () => {
      const { service, prisma, jwtService } = buildService();
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'admin-1',
        role: 'admin',
        type: 'refresh',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        refreshTokenHash: 'stored-hash',
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('new-hashed-refresh-token' as never);

      const tokens = await service.refresh('current.refresh.token');

      expect(tokens.accessToken).toBe('signed.jwt.token');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { refreshTokenHash: 'new-hashed-refresh-token' },
      });
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token hash', async () => {
      const { service, prisma } = buildService();

      await service.logout('admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { refreshTokenHash: null },
      });
    });
  });
});
