import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { Pool } from 'pg';
import { VehicleStatus } from '../../generated/prisma/client';
import { TrackPageViewDto } from './dto/track-page-view.dto';

const MOST_VIEWED_LIMIT = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VISITOR_TREND_HOURS = 24;
const RECENT_VISITORS_LIMIT = 12;
const TOP_BREAKDOWN_LIMIT = 8;

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
  firstSeenAt: Date;
  lastSeenAt: Date;
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
}

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

@Injectable()
export class AnalyticsService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });
  }

  /**
   * Fire-and-forget from the customer web app on every route change —
   * see apps/web/src/components/analytics-tracker.tsx and
   * vehicle-view-tracker.tsx. The client only ever sends the public
   * sequential ID (same convention as Favorites/Enquiries) — resolved to
   * the internal id here. An unknown/stale vehiclePublicId (deleted
   * vehicle, tampered request) shouldn't break visit tracking for the rest
   * of the event, so it's just dropped rather than rejecting the whole call.
   */
  async trackPageView(dto: TrackPageViewDto, request: Request): Promise<void> {
    let vehicleId: string | undefined;
    if (dto.vehiclePublicId !== undefined) {
      const vehicleResult = await this.pool.query<{ id: string }>(
        'SELECT id FROM vehicles WHERE public_id = $1 LIMIT 1',
        [dto.vehiclePublicId],
      );
      vehicleId = vehicleResult.rows[0]?.id;
    }

    const userAgent = this.cleanOptionalString(request.headers['user-agent']);
    const referrer = this.cleanOptionalString(dto.referrer);
    const ip = this.extractIp(request);

    await this.pool.query(
      `INSERT INTO page_views (
        id,
        session_id,
        path,
        referrer,
        referrer_host,
        utm_source,
        utm_medium,
        utm_campaign,
        language,
        timezone,
        screen_width,
        screen_height,
        viewport_width,
        viewport_height,
        color_scheme,
        reduced_motion,
        touch_points,
        device_memory,
        hardware_concurrency,
        connection_type,
        ip_hash,
        user_agent,
        browser,
        os,
        device_type,
        country,
        region,
        city,
        vehicle_id,
        created_at
      ) VALUES (
        gen_random_uuid()::text,
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,NOW()
      )`,
      [
        dto.sessionId,
        dto.path,
        referrer ?? null,
        this.getReferrerHost(referrer) ?? null,
        this.cleanOptionalString(dto.utmSource) ?? null,
        this.cleanOptionalString(dto.utmMedium) ?? null,
        this.cleanOptionalString(dto.utmCampaign) ?? null,
        this.cleanOptionalString(dto.language) ?? null,
        this.cleanOptionalString(dto.timezone) ?? null,
        dto.screenWidth ?? null,
        dto.screenHeight ?? null,
        dto.viewportWidth ?? null,
        dto.viewportHeight ?? null,
        this.cleanOptionalString(dto.colorScheme) ?? null,
        dto.reducedMotion ?? null,
        dto.touchPoints ?? null,
        dto.deviceMemory ?? null,
        dto.hardwareConcurrency ?? null,
        this.cleanOptionalString(dto.connectionType) ?? null,
        this.hashIp(ip) ?? null,
        userAgent ?? null,
        this.detectBrowser(userAgent),
        this.detectOs(userAgent),
        this.detectDeviceType(userAgent),
        this.readHeaderValue(request, [
          'x-vercel-ip-country',
          'cf-ipcountry',
        ]) ?? null,
        this.readHeaderValue(request, [
          'x-vercel-ip-country-region',
          'x-vercel-ip-region',
          'cf-region',
        ]) ?? null,
        this.readHeaderValue(request, ['x-vercel-ip-city', 'cf-ipcity']) ??
          null,
        vehicleId ?? null,
      ],
    );
  }

  async getSummary(): Promise<AnalyticsSummary> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday.getTime() - 6 * MS_PER_DAY);

    const todaySessions = await this.countDistinctSessions(startOfToday);
    const weekSessions = await this.countDistinctSessions(startOfWeek);
    const allTimeSessions = await this.countDistinctSessions();
    const pageViewsToday = await this.countPageViews(startOfToday);
    const pageViewsThisWeek = await this.countPageViews(startOfWeek);
    const pageViewsAllTime = await this.countPageViews();
    const visitorTrend = await this.getVisitorTrend(VISITOR_TREND_HOURS);
    const topSources = await this.getTopSources(TOP_BREAKDOWN_LIMIT);
    const topLocations = await this.getTopLocations(TOP_BREAKDOWN_LIMIT);
    const deviceBreakdown = await this.getDeviceBreakdown();
    const topPaths = await this.getTopPaths(TOP_BREAKDOWN_LIMIT);
    const recentVisitors = await this.getRecentVisitors(RECENT_VISITORS_LIMIT);
    const mostViewedVehicles =
      await this.getMostViewedVehicles(MOST_VIEWED_LIMIT);

    return {
      uniqueVisitorsToday: todaySessions.length,
      uniqueVisitorsThisWeek: weekSessions.length,
      uniqueVisitorsAllTime: allTimeSessions.length,
      pageViewsToday,
      pageViewsThisWeek,
      pageViewsAllTime,
      averageViewsPerVisitor:
        allTimeSessions.length === 0
          ? 0
          : Number((pageViewsAllTime / allTimeSessions.length).toFixed(1)),
      visitorTrend,
      topSources,
      topLocations,
      deviceBreakdown,
      topPaths,
      recentVisitors,
      mostViewedVehicles,
    };
  }

  private async getVisitorTrend(hours: number): Promise<VisitorTrendPoint[]> {
    const rows = await this.query<
      Array<{ hour_bucket: Date; visitors: string; views: string }>
    >(
      `SELECT date_trunc('hour', created_at) AS hour_bucket,
              COUNT(DISTINCT session_id)::text AS visitors,
              COUNT(*)::text AS views
       FROM page_views
       WHERE created_at >= NOW() - ($1 * INTERVAL '1 hour')
       GROUP BY hour_bucket
       ORDER BY hour_bucket ASC`,
      [hours],
    );

    return rows.map((row) => ({
      hour: row.hour_bucket.toISOString(),
      visitors: Number(row.visitors),
      views: Number(row.views),
    }));
  }

  private async getTopSources(limit: number): Promise<TrafficBreakdownItem[]> {
    const rows = await this.query<Array<{ label: string; visitors: string }>>(
      `SELECT COALESCE(NULLIF(utm_source, ''), NULLIF(referrer_host, ''), 'Direct') AS label,
              COUNT(DISTINCT session_id)::text AS visitors
       FROM page_views
       GROUP BY label
       ORDER BY visitors DESC, label ASC
       LIMIT $1`,
      [limit],
    );

    return rows.map((row) => ({
      label: row.label,
      visitors: Number(row.visitors),
    }));
  }

  private async getTopLocations(
    limit: number,
  ): Promise<TrafficBreakdownItem[]> {
    const rows = await this.query<Array<{ label: string; visitors: string }>>(
      `SELECT COALESCE(
                NULLIF(CONCAT_WS(', ', NULLIF(city, ''), NULLIF(region, ''), NULLIF(country, '')), ''),
                'Unknown'
              ) AS label,
              COUNT(DISTINCT session_id)::text AS visitors
       FROM page_views
       GROUP BY label
       ORDER BY visitors DESC, label ASC
       LIMIT $1`,
      [limit],
    );

    return rows.map((row) => ({
      label: row.label,
      visitors: Number(row.visitors),
    }));
  }

  private async getDeviceBreakdown(): Promise<TrafficBreakdownItem[]> {
    const rows = await this.query<Array<{ label: string; visitors: string }>>(
      `SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS label,
              COUNT(DISTINCT session_id)::text AS visitors
       FROM page_views
       GROUP BY label
       ORDER BY visitors DESC, label ASC`,
    );

    return rows.map((row) => ({
      label: row.label,
      visitors: Number(row.visitors),
    }));
  }

  private async getTopPaths(limit: number): Promise<TopPagePath[]> {
    const rows = await this.query<
      Array<{ path: string; unique_visitors: string; total_views: string }>
    >(
      `SELECT path,
              COUNT(DISTINCT session_id)::text AS unique_visitors,
              COUNT(*)::text AS total_views
       FROM page_views
       GROUP BY path
       ORDER BY total_views DESC, unique_visitors DESC, path ASC
       LIMIT $1`,
      [limit],
    );

    return rows.map((row) => ({
      path: row.path,
      uniqueVisitors: Number(row.unique_visitors),
      totalViews: Number(row.total_views),
    }));
  }

  private async getRecentVisitors(limit: number): Promise<RecentVisitor[]> {
    const rows = await this.query<
      Array<{
        session_id: string;
        first_seen_at: Date;
        last_seen_at: Date;
        views: string;
        entry_path: string;
        last_path: string;
        source: string;
        location: string;
        device_type: string;
        browser: string;
        os: string;
        timezone: string | null;
        language: string | null;
        viewport_width: number | null;
        viewport_height: number | null;
        color_scheme: string | null;
        reduced_motion: boolean | null;
        touch_points: number | null;
        device_memory: number | null;
        hardware_concurrency: number | null;
        connection_type: string | null;
      }>
    >(
      `SELECT session_id,
              MIN(created_at) AS first_seen_at,
              MAX(created_at) AS last_seen_at,
              COUNT(*)::text AS views,
              (ARRAY_AGG(path ORDER BY created_at ASC))[1] AS entry_path,
              (ARRAY_AGG(path ORDER BY created_at DESC))[1] AS last_path,
              (ARRAY_AGG(COALESCE(NULLIF(utm_source, ''), NULLIF(referrer_host, ''), 'Direct') ORDER BY created_at ASC))[1] AS source,
              (ARRAY_AGG(COALESCE(NULLIF(CONCAT_WS(', ', NULLIF(city, ''), NULLIF(region, ''), NULLIF(country, '')), ''), 'Unknown') ORDER BY created_at DESC))[1] AS location,
              (ARRAY_AGG(COALESCE(NULLIF(device_type, ''), 'unknown') ORDER BY created_at DESC))[1] AS device_type,
              (ARRAY_AGG(COALESCE(NULLIF(browser, ''), 'Unknown') ORDER BY created_at DESC))[1] AS browser,
              (ARRAY_AGG(COALESCE(NULLIF(os, ''), 'Unknown') ORDER BY created_at DESC))[1] AS os,
              (ARRAY_AGG(timezone ORDER BY created_at DESC))[1] AS timezone,
              (ARRAY_AGG(language ORDER BY created_at DESC))[1] AS language,
              (ARRAY_AGG(viewport_width ORDER BY created_at DESC))[1] AS viewport_width,
              (ARRAY_AGG(viewport_height ORDER BY created_at DESC))[1] AS viewport_height,
              (ARRAY_AGG(color_scheme ORDER BY created_at DESC))[1] AS color_scheme,
              (ARRAY_AGG(reduced_motion ORDER BY created_at DESC))[1] AS reduced_motion,
              (ARRAY_AGG(touch_points ORDER BY created_at DESC))[1] AS touch_points,
              (ARRAY_AGG(device_memory ORDER BY created_at DESC))[1] AS device_memory,
              (ARRAY_AGG(hardware_concurrency ORDER BY created_at DESC))[1] AS hardware_concurrency,
              (ARRAY_AGG(connection_type ORDER BY created_at DESC))[1] AS connection_type
       FROM page_views
       GROUP BY session_id
       ORDER BY last_seen_at DESC
       LIMIT $1`,
      [limit],
    );

    return rows.map((row) => ({
      sessionId: row.session_id,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      views: Number(row.views),
      entryPath: row.entry_path,
      lastPath: row.last_path,
      source: row.source,
      location: row.location,
      deviceType: row.device_type,
      browser: row.browser,
      os: row.os,
      timezone: row.timezone,
      language: row.language,
      viewportWidth: row.viewport_width,
      viewportHeight: row.viewport_height,
      colorScheme: row.color_scheme,
      reducedMotion: row.reduced_motion,
      touchPoints: row.touch_points,
      deviceMemory: row.device_memory,
      hardwareConcurrency: row.hardware_concurrency,
      connectionType: row.connection_type,
    }));
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
    const rows = await this.query<
      Array<{
        vehicle_id: string;
        unique_viewers: string;
        public_id: number | null;
        title: string;
        status: VehicleStatus;
      }>
    >(
      `SELECT v.id AS vehicle_id,
              COUNT(DISTINCT pv.session_id)::text AS unique_viewers,
              v.public_id,
              v.title,
              v.status
       FROM page_views pv
       JOIN vehicles v ON v.id = pv.vehicle_id
       WHERE pv.vehicle_id IS NOT NULL
       GROUP BY v.id, v.public_id, v.title, v.status
       ORDER BY unique_viewers DESC
       LIMIT $1`,
      [limit],
    );
    if (rows.length === 0) return [];

    return rows
      .map((row) => {
        return {
          vehicleId: row.vehicle_id,
          publicId: row.public_id,
          title: row.title,
          status: row.status,
          uniqueViewers: Number(row.unique_viewers),
        };
      })
      .filter((row): row is MostViewedVehicle => row !== null);
  }

  private async countDistinctSessions(from?: Date): Promise<string[]> {
    const rows = from
      ? await this.query<Array<{ session_id: string }>>(
          'SELECT DISTINCT session_id FROM page_views WHERE created_at >= $1',
          [from],
        )
      : await this.query<Array<{ session_id: string }>>(
          'SELECT DISTINCT session_id FROM page_views',
        );
    return rows.map((row) => row.session_id);
  }

  private async countPageViews(from?: Date): Promise<number> {
    const rows = from
      ? await this.query<Array<{ total: string }>>(
          'SELECT COUNT(*)::text AS total FROM page_views WHERE created_at >= $1',
          [from],
        )
      : await this.query<Array<{ total: string }>>(
          'SELECT COUNT(*)::text AS total FROM page_views',
        );
    return Number(rows[0]?.total ?? 0);
  }

  private async query<T>(sql: string, params: unknown[] = []): Promise<T> {
    const result = await this.pool.query(sql, params);
    return result.rows as T;
  }

  private cleanOptionalString(
    value: string | undefined | null,
  ): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed.slice(0, 2000) : undefined;
  }

  private readHeaderValue(
    request: Request,
    names: string[],
  ): string | undefined {
    for (const name of names) {
      const value = request.headers[name];
      if (typeof value === 'string' && value.trim()) {
        return value.trim().slice(0, 120);
      }
    }
    return undefined;
  }

  private extractIp(request: Request): string | undefined {
    const forwardedFor = this.readHeaderValue(request, [
      'x-forwarded-for',
      'cf-connecting-ip',
      'x-real-ip',
    ]);
    if (forwardedFor) {
      return forwardedFor.split(',')[0]?.trim();
    }
    return request.ip || request.socket.remoteAddress || undefined;
  }

  private hashIp(ip: string | undefined): string | undefined {
    if (!ip) return undefined;
    const salt = this.configService.get<string>(
      'JWT_SECRET',
      'cg-analytics-salt',
    );
    return createHash('sha256')
      .update(`${salt}:${ip}`)
      .digest('hex')
      .slice(0, 24);
  }

  private getReferrerHost(referrer: string | undefined): string | undefined {
    if (!referrer) return undefined;
    try {
      return new URL(referrer).hostname.slice(0, 120);
    } catch {
      return undefined;
    }
  }

  private detectDeviceType(userAgent: string | undefined): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (/(bot|crawler|spider|slurp)/.test(ua)) return 'bot';
    if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/.test(ua))
      return 'tablet';
    if (/(mobi|iphone|ipod|android.*mobile|windows phone)/.test(ua))
      return 'mobile';
    return 'desktop';
  }

  private detectBrowser(userAgent: string | undefined): string {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
    if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
    if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
    if (ua.includes('firefox/')) return 'Firefox';
    return 'Unknown';
  }

  private detectOs(userAgent: string | undefined): string {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('android')) return 'Android';
    if (/(iphone|ipad|ipod)/.test(ua)) return 'iOS';
    if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    return 'Unknown';
  }
}
