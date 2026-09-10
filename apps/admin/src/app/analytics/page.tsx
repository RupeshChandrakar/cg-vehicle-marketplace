'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Eye, Globe2, MapPinned, MonitorSmartphone, Route, Clock3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAnalyticsSummary, ApiError } from '@/lib/api';
import type {
  AnalyticsSummary,
  MostViewedVehicle,
  RecentVisitor,
  TopPagePath,
  TrafficBreakdownItem,
  VisitorTrendPoint,
} from '@/types/analytics';

const VEHICLE_STATUS_PILL: Record<string, string> = {
  live: 'bg-primary-light text-primary',
  approved: 'bg-primary-light text-primary',
  submitted: 'bg-gold/15 text-gold',
  under_review: 'bg-gold/15 text-gold',
  rejected: 'bg-red-100 text-red-600',
  sold: 'bg-foreground/10 text-foreground',
  reserved: 'bg-blue-100 text-blue-600',
  draft: 'bg-line/60 text-muted',
  expired: 'bg-line/60 text-muted',
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      setAnalytics(await getAnalyticsSummary(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <VisitorStats analytics={analytics} />
          <VisitorTrendChart points={analytics?.visitorTrend ?? []} />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <BreakdownCard
              title="Top Sources"
              icon={Globe2}
              items={analytics?.topSources ?? []}
              emptyMessage="Source data will appear once referrers or UTM-tagged visits arrive."
            />
            <BreakdownCard
              title="Top Locations"
              icon={MapPinned}
              items={analytics?.topLocations ?? []}
              emptyMessage="Location headers are available on deployed traffic and will populate here."
            />
            <BreakdownCard
              title="Device Mix"
              icon={MonitorSmartphone}
              items={analytics?.deviceBreakdown ?? []}
              emptyMessage="Device segmentation appears as soon as page views are recorded."
            />
          </div>
          <TopPathsCard paths={analytics?.topPaths ?? []} />
          <RecentVisitorsCard visitors={analytics?.recentVisitors ?? []} />
          <MostViewedVehiclesTable vehicles={analytics?.mostViewedVehicles ?? []} />
        </>
      )}
    </div>
  );
}

function VisitorStats({ analytics }: { analytics: AnalyticsSummary | null }) {
  const cards = [
    { label: 'Visitors Today', value: analytics?.uniqueVisitorsToday ?? 0 },
    { label: 'Visitors This Week', value: analytics?.uniqueVisitorsThisWeek ?? 0 },
    { label: 'Visitors All-Time', value: analytics?.uniqueVisitorsAllTime ?? 0 },
    { label: 'Page Views Today', value: analytics?.pageViewsToday ?? 0 },
    { label: 'Avg. Views / Visitor', value: analytics?.averageViewsPerVisitor ?? 0 },
    { label: 'Page Views All-Time', value: analytics?.pageViewsAllTime ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl bg-background p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitorTrendChart({ points }: { points: VisitorTrendPoint[] }) {
  const maxVisitors = Math.max(1, ...points.map((point) => point.visitors));

  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Visitor Trend</h2>
          <p className="text-xs text-muted">Unique visitors and page views over the last 24 hours</p>
        </div>
        <Clock3 className="h-4 w-4 text-muted" strokeWidth={1.75} />
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-muted">No trend data yet.</p>
      ) : (
        <div className="space-y-3">
          {points.map((point) => (
            <div key={point.hour}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted">{formatHour(point.hour)}</span>
                <span className="text-foreground">
                  {point.visitors} visitors · {point.views} views
                </span>
              </div>
              <div className="h-2 rounded-full bg-line/70">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.max(8, (point.visitors / maxVisitors) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  icon: Icon,
  items,
  emptyMessage,
}: {
  title: string;
  icon: typeof Globe2;
  items: TrafficBreakdownItem[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Icon className="h-4 w-4 text-muted" strokeWidth={1.75} />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{item.label}</span>
              <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
                {item.visitors}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopPathsCard({ paths }: { paths: TopPagePath[] }) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Top Landing / Browsed Paths</h2>
          <p className="text-xs text-muted">See which routes pull the most visits and repeat traffic</p>
        </div>
        <Route className="h-4 w-4 text-muted" strokeWidth={1.75} />
      </div>

      {paths.length === 0 ? (
        <p className="text-sm text-muted">No path-level visit data recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {paths.map((path) => (
            <div key={path.path} className="rounded-xl border border-line p-3">
              <p className="truncate font-medium text-foreground">{path.path}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>{path.totalViews} views</span>
                <span>{path.uniqueVisitors} unique visitors</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentVisitorsCard({ visitors }: { visitors: RecentVisitor[] }) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Visitor Activity</h2>
          <p className="text-xs text-muted">Anonymous session-level view of who came, from where, and what they saw</p>
        </div>
        <Users className="h-4 w-4 text-muted" strokeWidth={1.75} />
      </div>

      {visitors.length === 0 ? (
        <p className="text-sm text-muted">Recent sessions will appear once page-view events are tracked.</p>
      ) : (
        <div className="space-y-3">
          {visitors.map((visitor) => (
            <div key={visitor.sessionId} className="rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">Session {visitor.sessionId.slice(0, 8)}</p>
                  <p className="text-xs text-muted">
                    {visitor.source} · {visitor.location} · {visitor.deviceType} · {visitor.browser} on {visitor.os}
                  </p>
                </div>
                <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
                  {visitor.views} views
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2 xl:grid-cols-4">
                <span>First seen: {formatTimestamp(visitor.firstSeenAt)}</span>
                <span>Last seen: {formatTimestamp(visitor.lastSeenAt)}</span>
                <span>Entry: {visitor.entryPath}</span>
                <span>Last page: {visitor.lastPath}</span>
                <span>Timezone: {visitor.timezone ?? 'Unknown'}</span>
                <span>Language: {visitor.language ?? 'Unknown'}</span>
                <span>
                  Viewport:{' '}
                  {visitor.viewportWidth && visitor.viewportHeight
                    ? `${visitor.viewportWidth} x ${visitor.viewportHeight}`
                    : 'Unknown'}
                </span>
                <span>Color scheme: {visitor.colorScheme ?? 'Unknown'}</span>
                <span>
                  Motion: {visitor.reducedMotion === null ? 'Unknown' : visitor.reducedMotion ? 'Reduce' : 'Normal'}
                </span>
                <span>Touch points: {visitor.touchPoints ?? 'Unknown'}</span>
                <span>Memory: {visitor.deviceMemory ?? 'Unknown'} GB</span>
                <span>CPU cores: {visitor.hardwareConcurrency ?? 'Unknown'}</span>
                <span>Connection: {visitor.connectionType ?? 'Unknown'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MostViewedVehiclesTable({ vehicles }: { vehicles: MostViewedVehicle[] }) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Most Viewed Vehicles</h2>
        <Eye className="h-4 w-4 text-muted" strokeWidth={1.75} />
      </div>
      {vehicles.length === 0 ? (
        <p className="text-sm text-muted">
          No vehicle views recorded yet — this fills in as customers browse listings.
        </p>
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {vehicles.map((vehicle) => (
              <div key={vehicle.vehicleId} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{vehicle.title}</p>
                    <p className="text-xs text-muted">
                      {vehicle.publicId ? `ID: ${vehicle.publicId}` : 'Draft'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      VEHICLE_STATUS_PILL[vehicle.status] ?? 'bg-line/60 text-muted'
                    }`}
                  >
                    {vehicle.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">Unique viewers</span>
                  <span className="font-semibold text-foreground">{vehicle.uniqueViewers}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Unique Viewers</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.vehicleId} className="border-t border-line">
                  <td className="py-2.5 pr-2">
                    <p className="font-medium text-foreground">{vehicle.title}</p>
                    <p className="text-xs text-muted">
                      {vehicle.publicId ? `ID: ${vehicle.publicId}` : 'Draft'}
                    </p>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        VEHICLE_STATUS_PILL[vehicle.status] ?? 'bg-line/60 text-muted'
                      }`}
                    >
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold text-foreground">{vehicle.uniqueViewers}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}

function formatHour(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
}
