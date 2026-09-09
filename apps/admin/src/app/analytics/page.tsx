'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAnalyticsSummary, ApiError } from '@/lib/api';
import type { AnalyticsSummary, MostViewedVehicle } from '@/types/analytics';

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
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
