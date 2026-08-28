import { AnalyticsService } from './analytics.service';

interface CreatePageViewArgs {
  data: { sessionId: string; path: string; vehicleId?: string };
}

function buildService() {
  const vehicleTable = {
    findUnique: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
  };
  const pageViewTable = {
    create: jest.fn<undefined, [CreatePageViewArgs]>(),
    groupBy: jest.fn().mockResolvedValue([]),
  };
  const queryRaw = jest.fn().mockResolvedValue([]);

  const prisma = {
    vehicle: vehicleTable,
    pageView: pageViewTable,
    $queryRaw: queryRaw,
  };

  const service = new AnalyticsService(prisma as never);
  return { service, prisma };
}

describe('AnalyticsService', () => {
  describe('trackPageView', () => {
    it('resolves the public vehicle ID to the internal id before storing it', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1' });

      await service.trackPageView({
        sessionId: 'session-1',
        path: '/vehicle/10001/hyundai-creta-2021',
        vehiclePublicId: 10001,
      });

      expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
        where: { publicId: 10001 },
        select: { id: true },
      });
      const [[createArgs]] = prisma.pageView.create.mock.calls;
      expect(createArgs.data).toEqual({
        sessionId: 'session-1',
        path: '/vehicle/10001/hyundai-creta-2021',
        vehicleId: 'vehicle-1',
      });
    });

    it('drops an unknown vehiclePublicId rather than failing the whole event', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await service.trackPageView({
        sessionId: 'session-1',
        path: '/vehicle/99999/deleted-listing',
        vehiclePublicId: 99999,
      });

      const [[createArgs]] = prisma.pageView.create.mock.calls;
      expect(createArgs.data).toEqual({
        sessionId: 'session-1',
        path: '/vehicle/99999/deleted-listing',
        vehicleId: undefined,
      });
    });

    it('records a generic page view with no vehiclePublicId at all', async () => {
      const { service, prisma } = buildService();

      await service.trackPageView({ sessionId: 'session-2', path: '/' });

      expect(prisma.vehicle.findUnique).not.toHaveBeenCalled();
      const [[createArgs]] = prisma.pageView.create.mock.calls;
      expect(createArgs.data).toEqual({
        sessionId: 'session-2',
        path: '/',
        vehicleId: undefined,
      });
    });
  });

  describe('getSummary', () => {
    it('counts distinct sessions per time window and joins the raw leaderboard to real vehicles', async () => {
      const { service, prisma } = buildService();
      prisma.pageView.groupBy
        .mockResolvedValueOnce([{ sessionId: 'a' }]) // today
        .mockResolvedValueOnce([{ sessionId: 'a' }, { sessionId: 'b' }]) // this week
        .mockResolvedValueOnce([
          { sessionId: 'a' },
          { sessionId: 'b' },
          { sessionId: 'c' },
        ]); // all-time
      prisma.$queryRaw.mockResolvedValue([
        { vehicle_id: 'vehicle-1', unique_viewers: BigInt(5) },
      ]);
      prisma.vehicle.findMany.mockResolvedValue([
        {
          id: 'vehicle-1',
          publicId: 10001,
          title: 'Hyundai Creta 2021',
          status: 'live',
        },
      ]);

      const summary = await service.getSummary();

      expect(summary).toEqual({
        uniqueVisitorsToday: 1,
        uniqueVisitorsThisWeek: 2,
        uniqueVisitorsAllTime: 3,
        mostViewedVehicles: [
          {
            vehicleId: 'vehicle-1',
            publicId: 10001,
            title: 'Hyundai Creta 2021',
            status: 'live',
            uniqueViewers: 5,
          },
        ],
      });
    });

    it('skips a leaderboard row whose vehicle no longer exists', async () => {
      const { service, prisma } = buildService();
      prisma.$queryRaw.mockResolvedValue([
        { vehicle_id: 'ghost-vehicle', unique_viewers: BigInt(3) },
      ]);
      prisma.vehicle.findMany.mockResolvedValue([]);

      const summary = await service.getSummary();

      expect(summary.mostViewedVehicles).toEqual([]);
    });
  });
});
