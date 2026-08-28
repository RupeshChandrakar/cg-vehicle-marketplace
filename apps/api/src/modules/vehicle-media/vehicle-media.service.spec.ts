import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VehicleMediaService } from './vehicle-media.service';
import { MAX_FILES_PER_VEHICLE } from './vehicle-media.constants';

function buildFile(mimetype = 'image/jpeg'): {
  buffer: Buffer;
  mimetype: string;
} {
  return { buffer: Buffer.from('fake-image-bytes'), mimetype };
}

function buildService() {
  const prisma = {
    vehicle: { findUnique: jest.fn() },
    vehicleMedia: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(
        ({ data }: { data: { vehicleId: string; storageKey: string } }) => ({
          id: 'media-1',
          ...data,
        }),
      ),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  const storage = {
    upload: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn((key: string) => `https://storage.test/${key}`),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const service = new VehicleMediaService(prisma as never, storage as never);
  return { service, prisma, storage };
}

describe('VehicleMediaService', () => {
  it('throws if the vehicle does not exist', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      service.addMedia('missing-vehicle', [buildFile()]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to add photos to a listing that is already live', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'v1', status: 'live' });

    await expect(service.addMedia('v1', [buildFile()])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses to exceed the per-vehicle photo limit', async () => {
    const { service, prisma } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      status: 'submitted',
    });
    prisma.vehicleMedia.count.mockResolvedValue(MAX_FILES_PER_VEHICLE - 1);

    await expect(
      service.addMedia('v1', [buildFile(), buildFile()]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads each file and records it with a bucket-relative storage key', async () => {
    const { service, prisma, storage } = buildService();
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      status: 'submitted',
    });

    const results = await service.addMedia('v1', [buildFile('image/png')]);

    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^vehicles\/v1\/.+\.png$/),
      expect.any(Buffer),
      'image/png',
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('media-1');
    expect(results[0].url).toContain('vehicles/v1/');
  });

  describe('removeMediaAsSeller', () => {
    it('refuses a vehicle owned by someone else, as a 404', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue({
        id: 'v1',
        sellerId: 'someone-else',
        status: 'submitted',
      });

      await expect(
        service.removeMediaAsSeller('v1', 'seller-1', 'media-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to remove a photo from a listing that is already live', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue({
        id: 'v1',
        sellerId: 'seller-1',
        status: 'live',
      });

      await expect(
        service.removeMediaAsSeller('v1', 'seller-1', 'media-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lets the real owner remove a photo while still pending review', async () => {
      const { service, prisma, storage } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue({
        id: 'v1',
        sellerId: 'seller-1',
        status: 'submitted',
      });
      prisma.vehicleMedia.findUnique.mockResolvedValue({
        id: 'media-1',
        vehicleId: 'v1',
        storageKey: 'vehicles/v1/photo.jpg',
      });

      await service.removeMediaAsSeller('v1', 'seller-1', 'media-1');

      expect(storage.delete).toHaveBeenCalledWith('vehicles/v1/photo.jpg');
      expect(prisma.vehicleMedia.delete).toHaveBeenCalledWith({
        where: { id: 'media-1' },
      });
    });
  });
});
