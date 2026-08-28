// Mirrors AnalyticsService's summary shape (apps/api/src/modules/analytics/analytics.service.ts).

export interface MostViewedVehicle {
  vehicleId: string;
  publicId: number | null;
  title: string;
  status: string;
  uniqueViewers: number;
}

export interface AnalyticsSummary {
  uniqueVisitorsToday: number;
  uniqueVisitorsThisWeek: number;
  uniqueVisitorsAllTime: number;
  mostViewedVehicles: MostViewedVehicle[];
}
