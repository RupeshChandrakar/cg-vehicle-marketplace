import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehicleStatusService } from './vehicle-status.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

function buildDto(overrides: Partial<CreateVehicleDto> = {}): CreateVehicleDto {
  return {
    categorySlug: 'cars',
    locationSlug: 'raipur',
    title: 'Mahindra Bolero B4',
    brand: 'Mahindra',
    model: 'Bolero B4',
    year: 2022,
    price: 785000,
    kmDriven: 62000,
    fuelType: 'diesel',
    transmission: 'manual',
    sellerName: 'Rahul',
    sellerPhone: '+919876543210',
    ...overrides,
  };
}

function record(args: {
  data: Record<string, unknown>;
}): Record<string, unknown> {
  return { id: 'vehicle-1', ...args.data };
}

interface VerificationUpsertArgs {
  create: { vehicleId: string; verifiedBy?: string; notes?: string };
}

interface NotifyArgs {
  userId: string;
  type: string;
  title: string;
  body: string;
  relatedId?: string;
}

function buildService() {
  const vehicleTable = {
    create: jest.fn(record),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn(record),
  };
  const vehicleVerificationTable = {
    upsert: jest.fn<undefined, [VerificationUpsertArgs]>(),
  };

  const queryRaw = jest.fn().mockResolvedValue([{ nextval: BigInt(10000) }]);

  const prisma = {
    category: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cat-1', slug: 'cars' }),
    },
    location: {
      findUnique: jest.fn().mockResolvedValue({ id: 'loc-1', slug: 'raipur' }),
    },
    // findByIdForAdmin()/update() batch-resolve seller name/phone via this
    // rather than a Prisma `include` (see the admin seller-data-leak fix) —
    // defaults empty; tests exercising those paths override with the
    // specific seller row(s) they need.
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    vehicle: vehicleTable,
    vehicleVerification: vehicleVerificationTable,
    $queryRaw: queryRaw,
    $transaction: jest.fn(
      (
        fn: (tx: {
          vehicle: typeof vehicleTable;
          vehicleVerification: typeof vehicleVerificationTable;
          $queryRaw: typeof queryRaw;
        }) => unknown,
      ) =>
        fn({
          vehicle: vehicleTable,
          vehicleVerification: vehicleVerificationTable,
          $queryRaw: queryRaw,
        }),
    ),
  };
  const usersService = {
    findOrCreateByPhone: jest.fn().mockResolvedValue({ id: 'user-1' }),
  };
  const storage = {
    getPublicUrl: jest.fn((key: string) => `https://storage.test/${key}`),
  };
  const notifications = {
    create: jest.fn<undefined, [NotifyArgs]>(),
  };

  const service = new VehiclesService(
    prisma as never,
    usersService as never,
    new VehicleStatusService(),
    storage as never,
    notifications as never,
  );

  return { service, prisma, usersService, storage, notifications };
}

describe('VehiclesService', () => {
  it('creates a vehicle as submitted, resolving category/location by slug', async () => {
    const { service, prisma, usersService } = buildService();

    await service.create(buildDto());

    expect(usersService.findOrCreateByPhone).toHaveBeenCalledWith(
      '+919876543210',
      'Rahul',
    );
    const [[createArgs]] = prisma.vehicle.create.mock.calls;
    expect(createArgs.data).toMatchObject({
      status: 'submitted',
      categoryId: 'cat-1',
      locationId: 'loc-1',
      sellerId: 'user-1',
    });
  });

  it('rejects an unknown category before touching the seller or the database write', async () => {
    const { service, prisma } = buildService();
    prisma.category.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.create(buildDto({ categorySlug: 'spaceships' })),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.vehicle.create).not.toHaveBeenCalled();
  });

  it('approveAndPublish() walks submitted all the way to live in one call', async () => {
    const { service, prisma, notifications } = buildService();
    const baseVehicle = {
      id: 'vehicle-1',
      status: 'submitted',
      title: 'Mahindra Bolero B4',
      sellerId: 'seller-1',
    };
    prisma.vehicle.findUnique.mockResolvedValue(baseVehicle);
    // The real Prisma client always returns the full row from update(), not
    // just the fields in `data` — this mock's default `record()` helper
    // doesn't, so this test overrides it to keep sellerId/title threaded
    // through the transaction's chained status updates.
    prisma.vehicle.update.mockImplementation(
      (args: { data: Record<string, unknown> }) => ({
        ...baseVehicle,
        ...args.data,
      }),
    );

    const result = await service.approveAndPublish(
      'vehicle-1',
      'admin-1',
      'Looks good',
    );

    const [[verificationArgs]] = prisma.vehicleVerification.upsert.mock.calls;
    expect(verificationArgs.create).toEqual({
      vehicleId: 'vehicle-1',
      verifiedBy: 'admin-1',
      notes: 'Looks good',
    });
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'live', publicId: 10000 });
    const [[notifyArgs]] = notifications.create.mock.calls;
    expect(notifyArgs).toMatchObject({
      userId: 'seller-1',
      type: 'vehicle_approved',
    });
  });

  it('approveAndPublish() also works starting from under_review', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'under_review',
    });

    const result = await service.approveAndPublish('vehicle-1', 'admin-1');

    expect(result).toMatchObject({ status: 'live', publicId: 10000 });
  });

  it('approveAndPublish() refuses a vehicle that is not pending review', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'draft',
    });

    await expect(
      service.approveAndPublish('vehicle-1', 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findByPublicId() strips registrationNumber from specs before returning', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findFirst.mockResolvedValue({
      id: 'vehicle-1',
      publicId: 10000,
      specs: { registrationNumber: 'CG 08 AB 1234', rcAvailable: true },
      media: [],
      category: {},
      location: {},
      verification: null,
    });

    const result = await service.findByPublicId(10000);

    expect(result.specs).toEqual({ rcAvailable: true });
  });

  it('findByIdForAdmin() keeps registrationNumber in specs', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      sellerId: 'user-1',
      specs: { registrationNumber: 'CG 08 AB 1234', rcAvailable: true },
      media: [],
      category: {},
      location: {},
      verification: null,
    });
    prisma.user.findMany.mockResolvedValueOnce([
      { id: 'user-1', name: 'Rahul', phone: '+919876543210' },
    ]);

    const result = await service.findByIdForAdmin('vehicle-1');

    expect(result.specs).toEqual({
      registrationNumber: 'CG 08 AB 1234',
      rcAvailable: true,
    });
  });

  it("findMineForSeller() scopes to the caller's own vehicles only", async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findMany.mockResolvedValue([
      {
        id: 'vehicle-1',
        specs: { registrationNumber: 'CG 08 AB 1234' },
        media: [],
        category: {},
        location: {},
        verification: null,
      },
    ]);

    const result = await service.findMineForSeller('seller-1');

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sellerId: 'seller-1' } }),
    );
    // Unlike the public/buyer-facing shape, a seller sees their own
    // registrationNumber — only the public view strips it.
    expect(result[0].specs).toEqual({ registrationNumber: 'CG 08 AB 1234' });
  });

  describe('updateAsSeller()', () => {
    it('refuses to edit a vehicle owned by someone else, as a 404', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue({
        id: 'vehicle-1',
        sellerId: 'someone-else',
        status: 'submitted',
      });

      await expect(
        service.updateAsSeller('vehicle-1', 'seller-1', { price: 500000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to edit a listing that is already live', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue({
        id: 'vehicle-1',
        sellerId: 'seller-1',
        status: 'live',
      });

      await expect(
        service.updateAsSeller('vehicle-1', 'seller-1', { price: 500000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows the real owner to edit while still pending review', async () => {
      const { service, prisma } = buildService();
      const baseVehicle = {
        id: 'vehicle-1',
        sellerId: 'seller-1',
        status: 'submitted',
        specs: {},
      };
      prisma.vehicle.findUnique.mockResolvedValue(baseVehicle);
      prisma.vehicle.update.mockImplementation(
        (args: { data: Record<string, unknown> }) => ({
          ...baseVehicle,
          ...args.data,
          media: [],
          category: {},
          location: {},
          verification: null,
        }),
      );

      const result = await service.updateAsSeller('vehicle-1', 'seller-1', {
        price: 650000,
      });

      expect(result.price).toBe(650000);
    });
  });

  it('reject() records the reason and moves status to rejected', async () => {
    const { service, prisma, notifications } = buildService();
    const baseVehicle = {
      id: 'vehicle-1',
      status: 'submitted',
      title: 'Mahindra Bolero B4',
      sellerId: 'seller-1',
    };
    prisma.vehicle.findUnique.mockResolvedValue(baseVehicle);
    prisma.vehicle.update.mockImplementation(
      (args: { data: Record<string, unknown> }) => ({
        ...baseVehicle,
        ...args.data,
      }),
    );

    const result = await service.reject(
      'vehicle-1',
      'Odometer photo unreadable',
    );

    expect(result).toMatchObject({
      status: 'rejected',
      rejectionReason: 'Odometer photo unreadable',
    });
    const [[notifyArgs]] = notifications.create.mock.calls;
    expect(notifyArgs).toMatchObject({
      userId: 'seller-1',
      type: 'vehicle_rejected',
    });
  });
});
