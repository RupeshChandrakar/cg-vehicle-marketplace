// Mirrors AnalyticsService's summary shape (apps/api/src/modules/analytics/analytics.service.ts).

export interface MostViewedVehicle {
  vehicleId: string;
  publicId: number | null;
  title: string;
  status: string;
  uniqueViewers: number;
}

export interface VisitorTrendPoint {
  hour: string;
  visitors: number;
  views: number;
}

export interface TrafficBreakdownItem {
  label: string;
  visitors: number;
}

export interface TopPagePath {
  path: string;
  uniqueVisitors: number;
  totalViews: number;
}

export interface RecentVisitor {
  sessionId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  views: number;
  entryPath: string;
  lastPath: string;
  source: string;
  location: string;
  deviceType: string;
  browser: string;
  os: string;
  timezone: string | null;
  language: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  colorScheme: string | null;
  reducedMotion: boolean | null;
  touchPoints: number | null;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  connectionType: string | null;
}

export interface AnalyticsSummary {
  uniqueVisitorsToday: number;
  uniqueVisitorsThisWeek: number;
  uniqueVisitorsAllTime: number;
  pageViewsToday: number;
  pageViewsThisWeek: number;
  pageViewsAllTime: number;
  averageViewsPerVisitor: number;
  visitorTrend: VisitorTrendPoint[];
  topSources: TrafficBreakdownItem[];
  topLocations: TrafficBreakdownItem[];
  deviceBreakdown: TrafficBreakdownItem[];
  topPaths: TopPagePath[];
  recentVisitors: RecentVisitor[];
  mostViewedVehicles: MostViewedVehicle[];
}
