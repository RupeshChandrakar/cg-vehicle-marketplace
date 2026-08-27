import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { haversineDistanceKm } from '../../common/utils/geo.util';
import { Location } from '../../generated/prisma/client';

export interface LocationDetectionResult {
  matched: Location;
  nearby: Location[];
}

const NEARBY_DISTRICT_COUNT = 3;

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Location[]> {
    return this.prisma.location.findMany({ orderBy: { district: 'asc' } });
  }

  /**
   * Districts are large administrative units, so nearest-centroid distance
   * is an accurate enough proxy for "which district is the customer in" —
   * no geocoding API dependency needed for this. Also returns the next
   * nearest districts so callers can fall back when the matched district
   * has no listings.
   */
  async detect(
    latitude: number,
    longitude: number,
  ): Promise<LocationDetectionResult> {
    const locations = await this.findAll();
    if (locations.length === 0) {
      throw new NotFoundException('No locations are configured yet');
    }

    const [matched, ...rest] = [...locations].sort(
      (a, b) =>
        haversineDistanceKm({ latitude, longitude }, a) -
        haversineDistanceKm({ latitude, longitude }, b),
    );

    return { matched, nearby: rest.slice(0, NEARBY_DISTRICT_COUNT) };
  }
}
