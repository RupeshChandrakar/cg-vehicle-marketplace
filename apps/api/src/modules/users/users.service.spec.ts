import { UsersService } from './users.service';

interface UpsertArgs {
  where: { phone: string };
  update: Record<string, unknown>;
  create: { phone: string; name?: string; referredById?: string };
}

function buildService() {
  const userTable = {
    upsert: jest.fn<undefined, [UpsertArgs]>(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };
  const prisma = { user: userTable };
  const service = new UsersService(prisma as never);
  return { service, prisma };
}

describe('UsersService', () => {
  describe('findOrCreateByPhone', () => {
    it('attributes a brand-new signup to the referrer behind a valid code', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'referrer-1',
        phone: '+919000000001',
      });

      await service.findOrCreateByPhone('+919999999999', undefined, 'ABCD1234');

      const [[upsertArgs]] = prisma.user.upsert.mock.calls;
      expect(upsertArgs.create).toMatchObject({
        phone: '+919999999999',
        referredById: 'referrer-1',
      });
    });

    it('ignores an unknown/stale referral code rather than failing signup', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue(null);

      await service.findOrCreateByPhone('+919999999999', undefined, 'DEADCODE');

      const [[upsertArgs]] = prisma.user.upsert.mock.calls;
      expect(upsertArgs.create.referredById).toBeUndefined();
    });

    it('refuses to attribute a user to themselves', async () => {
      const { service, prisma } = buildService();
      // The "referrer" found is actually the same phone signing up.
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: '+919999999999',
      });

      await service.findOrCreateByPhone('+919999999999', undefined, 'OWNCODE1');

      const [[upsertArgs]] = prisma.user.upsert.mock.calls;
      expect(upsertArgs.create.referredById).toBeUndefined();
    });

    it('does not touch referral attribution when no code is given', async () => {
      const { service, prisma } = buildService();

      await service.findOrCreateByPhone('+919999999999');

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      const [[upsertArgs]] = prisma.user.upsert.mock.calls;
      expect(upsertArgs.create.referredById).toBeUndefined();
    });
  });

  describe('getReferralInfo', () => {
    it('returns an already-assigned referral code without generating a new one', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        referralCode: 'EXISTING1',
      });
      prisma.user.count.mockResolvedValue(3);

      const info = await service.getReferralInfo('user-1');

      expect(info).toEqual({ referralCode: 'EXISTING1', totalReferred: 3 });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('lazily assigns a referral code the first time it is requested', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        referralCode: null,
      });
      prisma.user.update.mockResolvedValue({});
      prisma.user.count.mockResolvedValue(0);

      const info = await service.getReferralInfo('user-1');

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(info.referralCode).toHaveLength(8);
      expect(info.totalReferred).toBe(0);
    });
  });
});
