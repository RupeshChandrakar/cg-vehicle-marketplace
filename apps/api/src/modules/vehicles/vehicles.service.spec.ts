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

function buildService() {
  const vehicleTable = {
    create: jest.fn(record),
    findUnique: jest.fn(),
    update: jest.fn(record),
  };
  const vehicleVerificationTable = {
    upsert: jest.fn<undefined, [VerificationUpsertArgs]>(),
  };

  const prisma = {
    category: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cat-1', slug: 'cars' }),
    },
    location: {
      findUnique: jest.fn().mockResolvedValue({ id: 'loc-1', slug: 'raipur' }),
    },
    vehicle: vehicleTable,
    vehicleVerification: vehicleVerificationTable,
    $queryRaw: jest.fn().mockResolvedValue([{ nextval: BigInt(10000) }]),
    $transaction: jest.fn(
      (
        fn: (tx: {
          vehicle: typeof vehicleTable;
          vehicleVerification: typeof vehicleVerificationTable;
        }) => unknown,
      ) =>
        fn({
          vehicle: vehicleTable,
          vehicleVerification: vehicleVerificationTable,
        }),
    ),
  };
  const usersService = {
    findOrCreateByPhone: jest.fn().mockResolvedValue({ id: 'user-1' }),
  };

  const service = new VehiclesService(
    prisma as never,
    usersService as never,
    new VehicleStatusService(),
  );

  return { service, prisma, usersService };
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

  it('publish() assigns the next public id and moves status to live', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'approved',
    });

    const result = await service.publish('vehicle-1');

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'live', publicId: 10000 });
  });

  it('publish() refuses to skip the review pipeline', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'draft',
    });

    await expect(service.publish('vehicle-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('approve() records a verification and moves status to approved', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'vehicle-1',
      status: 'under_review',
    });

    const result = await service.approve(
      'vehicle-1',
      'admin-1',
      'Documents checked',
    );

    const [[verificationArgs]] = prisma.vehicleVerification.upsert.mock.calls;
    expect(verificationArgs.create).toEqual({
      vehicleId: 'vehicle-1',
      verifiedBy: 'admin-1',
      notes: 'Documents checked',
    });
    expect(result).toMatchObject({ status: 'approved' });
  });
});
