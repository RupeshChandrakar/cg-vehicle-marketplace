import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { VehicleStatus } from '../../generated/prisma/client';
import { TrackPageViewDto } from './dto/track-page-view.dto';

const MOST_VIEWED_LIMIT = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface MostViewedVehicle {
  vehicleId: string;
  publicId: number | null;
  title: string;
  status: VehicleStatus;
  uniqueViewers: number;
}

export interface AnalyticsSummary {
  uniqueVisitorsToday: number;
  uniqueVisitorsThisWeek: number;
  uniqueVisitorsAllTime: number;
  mostViewedVehicles: MostViewedVehicle[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fire-and-forget from the customer web app on every route change —
   * see apps/web/src/components/analytics-tracker.tsx and
   * vehicle-view-tracker.tsx. The client only ever sends the public
   * sequential ID (same convention as Favorites/Enquiries) — resolved to
   * the internal id here. An unknown/stale vehiclePublicId (deleted
   * vehicle, tampered request) shouldn't break visit tracking for the rest
   * of the event, so it's just dropped rather than rejecting the whole call.
   */
  async trackPageView(dto: TrackPageViewDto): Promise<void> {
    let vehicleId: string | undefined;
    if (dto.vehiclePublicId !== undefined) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { publicId: dto.vehiclePublicId },
        select: { id: true },
      });
      vehicleId = vehicle?.id;
    }

    await this.prisma.pageView.create({
      data: { sessionId: dto.sessionId, path: dto.path, vehicleId },
    });
  }

  async getSummary(): Promise<AnalyticsSummary> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday.getTime() - 6 * MS_PER_DAY);

    const [todaySessions, weekSessions, allTimeSessions, mostViewedVehicles] =
      await Promise.all([
        this.prisma.pageView.groupBy({
          by: ['sessionId'],
          where: { createdAt: { gte: startOfToday } },
        }),
        this.prisma.pageView.groupBy({
          by: ['sessionId'],
          where: { createdAt: { gte: startOfWeek } },
        }),
        this.prisma.pageView.groupBy({ by: ['sessionId'] }),
        this.getMostViewedVehicles(MOST_VIEWED_LIMIT),
      ]);

    return {
      uniqueVisitorsToday: todaySessions.length,
      uniqueVisitorsThisWeek: weekSessions.length,
      uniqueVisitorsAllTime: allTimeSessions.length,
      mostViewedVehicles,
    };
  }

  /**
   * "Unique viewers per vehicle" is a COUNT(DISTINCT session_id) grouped by
   * vehicle — Prisma's groupBy/_count can't express a distinct count within
   * a group, the same gap VehiclesService's approval pipeline hits for
   * `vehicle_public_id_seq`'s nextval, so this one aggregate goes through a
   * parameterized raw query instead of the query builder.
   */
  private async getMostViewedVehicles(
    limit: number,
  ): Promise<MostViewedVehicle[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ vehicle_id: string; unique_viewers: bigint }>
    >`
      SELECT vehicle_id, COUNT(DISTINCT session_id) AS unique_viewers
      FROM page_views
      WHERE vehicle_id IS NOT NULL
      GROUP BY vehicle_id
      ORDER BY unique_viewers DESC
      LIMIT ${limit}
    `;
    if (rows.length === 0) return [];

    const vehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: rows.map((row) => row.vehicle_id) } },
      select: { id: true, publicId: true, title: true, status: true },
    });
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

    return rows
      .map((row) => {
        // vehicleId cascades on Vehicle delete, so this should be
        // unreachable in practice — kept defensive rather than assumed.
        const vehicle = vehicleById.get(row.vehicle_id);
        if (!vehicle) return null;
        return {
          vehicleId: vehicle.id,
          publicId: vehicle.publicId,
          title: vehicle.title,
          status: vehicle.status,
          uniqueViewers: Number(row.unique_viewers),
        };
      })
      .filter((row): row is MostViewedVehicle => row !== null);
  }
}
