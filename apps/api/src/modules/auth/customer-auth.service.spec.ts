import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CustomerAuthService } from './customer-auth.service';

// bcrypt's native bindings make its exports non-configurable, so
// jest.spyOn(bcrypt, 'compare') fails with "Cannot redefine property" —
// auto-mocking the whole module (same pattern as auth.service.spec.ts) is
// the working alternative.
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

interface UpdateArgs {
  where: { id: string };
  data: { name?: string | null };
}

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

describe('CustomerAuthService.verifyOtp — name write on login', () => {
  afterEach(() => jest.clearAllMocks());

  it('sets the name on a brand-new account with none yet', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser({ name: null }));
    prisma.user.update.mockResolvedValue(baseUser({ name: 'Rahul' }));
    mockedBcrypt.compare.mockResolvedValue(true as never);

    await service.verifyOtp('+919876543210', '482913', 'Rahul');

    const [[updateArgs]] = prisma.user.update.mock.calls as [UpdateArgs][];
    expect(updateArgs.data.name).toBe('Rahul');
  });

  it('never overwrites a name the user already has, even if the login form sends one', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(
      baseUser({ name: 'Existing Name' }),
    );
    prisma.user.update.mockResolvedValue(baseUser({ name: 'Existing Name' }));
    mockedBcrypt.compare.mockResolvedValue(true as never);

    // Simulates a returning user who (accidentally or otherwise) types
    // something into the login screen's optional name field on a later
    // login, after already having set their name via PATCH /users/me.
    await service.verifyOtp('+919876543210', '482913', 'Someone Else');

    const [[updateArgs]] = prisma.user.update.mock.calls as [UpdateArgs][];
    expect(updateArgs.data.name).toBe('Existing Name');
  });

  it('leaves the name null when none is set and none is provided', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser({ name: null }));
    prisma.user.update.mockResolvedValue(baseUser({ name: null }));
    mockedBcrypt.compare.mockResolvedValue(true as never);

    await service.verifyOtp('+919876543210', '482913');

    const [[updateArgs]] = prisma.user.update.mock.calls as [UpdateArgs][];
    expect(updateArgs.data.name).toBeNull();
  });
});
