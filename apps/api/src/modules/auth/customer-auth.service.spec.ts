import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CustomerAuthService } from './customer-auth.service';

// bcrypt's native bindings make its exports non-configurable, so
// jest.spyOn(bcrypt, 'compare') fails with "Cannot redefine property" —
// auto-mocking the whole module (same pattern as auth.service.spec.ts) is
// the working alternative.
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function buildService() {
  const userTable = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { user: userTable };
  const usersService = { findOrCreateByPhone: jest.fn() };
  const authService = {
    issueTokens: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
  };
  const smsProvider = { sendOtp: jest.fn().mockResolvedValue(undefined) };

  const service = new CustomerAuthService(
    prisma as never,
    usersService as never,
    authService as never,
    smsProvider,
  );
  return { service, prisma };
}

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    phone: '+919876543210',
    role: 'customer',
    name: null,
    otpHash: 'irrelevant-since-we-mock-bcrypt-per-test',
    otpExpiresAt: new Date(Date.now() + 60_000),
    otpAttempts: 0,
    ...overrides,
  };
}

describe('CustomerAuthService.verifyOtp — dev OTP bypass', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('accepts the fixed dev code when NODE_ENV=development', async () => {
    process.env.NODE_ENV = 'development';
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser());
    prisma.user.update.mockResolvedValue(baseUser({ otpHash: null }));
    mockedBcrypt.compare.mockResolvedValue(false as never);

    const result = await service.verifyOtp('+919876543210', '000000');

    expect(result.tokens).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  it('fails safe: the bypass code is rejected when NODE_ENV is anything else', async () => {
    process.env.NODE_ENV = 'production';
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser());
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      service.verifyOtp('+919876543210', '000000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails safe: an unset NODE_ENV also does not enable the bypass', async () => {
    delete process.env.NODE_ENV;
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser());
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      service.verifyOtp('+919876543210', '000000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('the real OTP still works normally in development, via bcrypt', async () => {
    process.env.NODE_ENV = 'development';
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser());
    prisma.user.update.mockResolvedValue(baseUser({ otpHash: null }));
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const result = await service.verifyOtp('+919876543210', '482913');

    expect(result.tokens).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });
});
