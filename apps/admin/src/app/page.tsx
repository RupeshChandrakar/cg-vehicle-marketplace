'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  ShieldAlert,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAdminVehicles, getAdminEnquiries, ApiError } from '@/lib/api';
import type { AdminVehicle, VehicleStatus } from '@/types/vehicle';
import type { AdminEnquiry, EnquiryStatus } from '@/types/enquiry';

// No dedicated stats/aggregation endpoint exists yet — this pulls one page
// of everything and counts client-side, which is accurate as long as total
// vehicles/enquiries stay under this. Fine at the current data volume;
// replace with a real aggregate-count endpoint if that stops being true.
const SAMPLE_SIZE = 50;

const ENQUIRY_STATUS_META: Record<EnquiryStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: '#168A45' },
  contacted: { label: 'Contacted', color: '#C4881A' },
  negotiating: { label: 'Negotiating', color: '#3B82F6' },
  closed_won: { label: 'Deal Done', color: '#171717' },
  closed_lost: { label: 'Closed', color: '#9CA3AF' },
};

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [vehicleResult, enquiryResult] = await Promise.all([
        getAdminVehicles(accessToken, undefined, SAMPLE_SIZE),
        getAdminEnquiries(accessToken, undefined, SAMPLE_SIZE),
      ]);
      setVehicles(vehicleResult.data);
      setEnquiries(enquiryResult.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.');
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

  const countVehicles = (status: VehicleStatus): number =>
    vehicles.filter((v) => v.status === status).length;

  const stats: Array<{ label: string; value: number; icon: LucideIcon; accent: 'primary' | 'gold' }> = [
    { label: 'Total Vehicles', value: vehicles.length, icon: Car, accent: 'primary' },
    { label: 'Active Listings', value: countVehicles('live'), icon: ClipboardList, accent: 'primary' },
    { label: 'Total Enquiries', value: enquiries.length, icon: MessageCircle, accent: 'primary' },
    {
      label: 'Pending Verification',
      value: countVehicles('submitted') + countVehicles('under_review'),
      icon: ShieldAlert,
      accent: 'gold',
    },
    { label: 'Sold Vehicles', value: countVehicles('sold'), icon: CheckCircle2, accent: 'primary' },
  ];

  const enquiryBreakdown = (Object.keys(ENQUIRY_STATUS_META) as EnquiryStatus[]).map((status) => ({
    status,
    ...ENQUIRY_STATUS_META[status],
    count: enquiries.filter((e) => e.status === status).length,
  }));

  const verificationBreakdown = [
    { label: 'Pending', count: countVehicles('submitted') },
    { label: 'In Review', count: countVehicles('under_review') },
    { label: 'Live', count: countVehicles('live') },
    { label: 'Rejected', count: countVehicles('rejected') },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <RecentVehiclesTable vehicles={vehicles.slice(0, 5)} />
              <RecentEnquiriesTable enquiries={enquiries.slice(0, 5)} />
            </div>
            <div className="space-y-6">
              <EnquiriesDonut breakdown={enquiryBreakdown} total={enquiries.length} />
              <VerificationPanel breakdown={verificationBreakdown} />
              <QuickActions />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: 'primary' | 'gold';
}) {
  return (
    <div className="rounded-2xl bg-background p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            accent === 'gold' ? 'bg-gold/15 text-gold' : 'bg-primary-light text-primary'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

function RecentVehiclesTable({ vehicles }: { vehicles: AdminVehicle[] }) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Recent Vehicles</h2>
        <Link href="/queue" className="text-sm font-medium text-primary">
          View All
        </Link>
      </div>
      {vehicles.length === 0 ? (
        <p className="text-sm text-muted">No vehicles yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Seller</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-line">
                  <td className="py-2.5 pr-2">
                    <p className="font-medium text-foreground">{vehicle.title}</p>
                    <p className="text-xs text-muted">
                      {vehicle.publicId ? `ID: ${vehicle.publicId}` : 'Draft'} &middot;{' '}
                      {vehicle.location.district}
                    </p>
                  </td>
                  <td className="py-2.5 pr-2 text-muted">{vehicle.seller.name ?? 'Unknown'}</td>
                  <td className="py-2.5 pr-2 font-mono text-foreground">
                    ₹{Number(vehicle.price).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5">
                    <StatusPill status={vehicle.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecentEnquiriesTable({ enquiries }: { enquiries: AdminEnquiry[] }) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Recent Enquiries</h2>
        <Link href="/enquiries" className="text-sm font-medium text-primary">
          View All
        </Link>
      </div>
      {enquiries.length === 0 ? (
        <p className="text-sm text-muted">No enquiries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Channel</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} className="border-t border-line">
                  <td className="py-2.5 pr-2">
                    <p className="font-medium text-foreground">
                      {enquiry.customer.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-muted">{enquiry.customer.phone}</p>
                  </td>
                  <td className="py-2.5 pr-2 text-muted">{enquiry.vehicle.title}</td>
                  <td className="py-2.5 pr-2 text-muted capitalize">{enquiry.channel}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                      {ENQUIRY_STATUS_META[enquiry.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EnquiriesDonut({
  breakdown,
  total,
}: {
  breakdown: Array<{ status: EnquiryStatus; label: string; color: string; count: number }>;
  total: number;
}) {
  const { entries: stops } = breakdown
    .filter((b) => b.count > 0)
    .reduce<{ cumulative: number; entries: string[] }>(
      (acc, b) => {
        const pct = total > 0 ? (b.count / total) * 100 : 0;
        const end = acc.cumulative + pct;
        return {
          cumulative: end,
          entries: [...acc.entries, `${b.color} ${acc.cumulative}% ${end}%`],
        };
      },
      { cumulative: 0, entries: [] },
    );
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : '#E5E7EB';

  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Enquiries Overview</h2>
      <div className="flex items-center gap-6">
        <div
          className="relative h-28 w-28 shrink-0 rounded-full"
          style={{ background: gradient }}
        >
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-background">
            <span className="text-lg font-bold text-foreground">{total}</span>
            <span className="text-[11px] text-muted">Total</span>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          {breakdown.map((b) => (
            <div key={b.status} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: b.color }}
              />
              <span className="text-foreground">{b.label}</span>
              <span className="text-muted">({b.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerificationPanel({ breakdown }: { breakdown: Array<{ label: string; count: number }> }) {
  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Vehicle Verification</h2>
        <Link href="/queue" className="text-sm font-medium text-primary">
          View All
        </Link>
      </div>
      <div className="space-y-2.5 text-sm">
        {breakdown.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-muted">{row.label}</span>
            <span className="font-semibold text-foreground">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { href: '/queue', label: 'Review Vehicles', icon: Car },
    { href: '/enquiries', label: 'Enquiries', icon: MessageCircle },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="rounded-2xl bg-background p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl bg-primary-light p-3 text-center transition hover:shadow-card"
            >
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        VEHICLE_STATUS_PILL[status] ?? 'bg-line/60 text-muted'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
