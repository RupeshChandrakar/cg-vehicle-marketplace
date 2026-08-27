import { NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Location } from '../../generated/prisma/client';

function makeLocation(overrides: Partial<Location>): Location {
  return {
    id: overrides.id ?? 'id',
    district: overrides.district ?? 'District',
    state: 'Chhattisgarh',
    slug: overrides.slug ?? 'district',
    latitude: overrides.latitude ?? 0,
    longitude: overrides.longitude ?? 0,
    createdAt: new Date(),
  };
}

describe('LocationsService', () => {
  // Real Raipur/Durg/Bilaspur/Rajnandgaon coordinates — close enough
  // together that ordering by distance is a meaningful assertion.
  const raipur = makeLocation({
    id: '1',
    slug: 'raipur',
    latitude: 21.2514,
    longitude: 81.6296,
  });
  const durg = makeLocation({
    id: '2',
    slug: 'durg',
    latitude: 21.19,
    longitude: 81.28,
  });
  const bilaspur = makeLocation({
    id: '3',
    slug: 'bilaspur',
    latitude: 22.0797,
    longitude: 82.1409,
  });

  function buildService(locations: Location[]) {
    const prisma = {
      location: { findMany: jest.fn().mockResolvedValue(locations) },
    };
    return new LocationsService(prisma as never);
  }

  it('matches the nearest district and ranks the rest by distance', async () => {
    const service = buildService([bilaspur, raipur, durg]);

    // A point very close to Raipur's centroid.
    const result = await service.detect(21.25, 81.63);

    expect(result.matched.slug).toBe('raipur');
    expect(result.nearby.map((l) => l.slug)).toEqual(['durg', 'bilaspur']);
  });

  it('throws when no locations are configured', async () => {
    const service = buildService([]);

    await expect(service.detect(21.25, 81.63)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
