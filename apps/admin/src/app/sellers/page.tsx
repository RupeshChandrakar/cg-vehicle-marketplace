'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAdminSellers, ApiError } from '@/lib/api';
import type { AdminSeller } from '@/types/seller';
import type { VehicleStatus } from '@/types/vehicle';

const STATUS_PILL: Record<string, string> = {
  submitted: 'bg-gold/15 text-gold',
  under_review: 'bg-gold/15 text-gold',
  live: 'bg-primary-light text-primary',
  rejected: 'bg-red-100 text-red-600',
};

// "Active" here means logged in recently — a rough proxy since we don't
// track granular session activity beyond the last login timestamp.
const ACTIVE_WITHIN_DAYS = 30;

function isRecentlyActive(lastLoginAt: string | null): boolean {
  if (!lastLoginAt) return false;
  const daysSince = (Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= ACTIVE_WITHIN_DAYS;
}

function formatLastActive(lastLoginAt: string | null): string {
  if (!lastLoginAt) return 'Never logged in';
  return new Date(lastLoginAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SellersPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSellers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminSellers(accessToken, 50);
      setSellers(result.data);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load sellers.');
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
    void loadSellers();
  }, [loadSellers]);

  if (isAuthLoading || !user) {
    return null;
  }

  const activeCount = sellers.filter((s) => isRecentlyActive(s.lastLoginAt)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-background px-5 py-4 shadow-card">
          <p className="text-xs text-muted">Total sellers/dealers</p>
          <p className="text-2xl font-semibold text-foreground">{total}</p>
        </div>
        <div className="rounded-2xl bg-background px-5 py-4 shadow-card">
          <p className="text-xs text-muted">Active in last {ACTIVE_WITHIN_DAYS} days</p>
          <p className="text-2xl font-semibold text-primary">{activeCount}</p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : sellers.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Users className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">No sellers have listed a vehicle yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      )}
    </div>
  );
}

function SellerCard({ seller }: { seller: AdminSeller }) {
  const breakdownEntries = Object.entries(seller.statusBreakdown) as Array<
    [VehicleStatus, number]
  >;

  return (
    <div className="rounded-2xl bg-background p-4 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">{seller.name ?? 'Unnamed seller'}</h3>
          <p className="text-sm text-muted">{seller.phone}</p>
          <p className="text-xs text-muted">
            Member since {new Date(seller.createdAt).toLocaleDateString('en-IN')} · Last
            active: {formatLastActive(seller.lastLoginAt)}
          </p>
        </div>
        <Link
          href={`/queue?sellerId=${seller.id}`}
          className="self-start shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary-light"
        >
          View listings
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span className="text-sm text-muted">{seller.totalListings} total listings</span>
        {breakdownEntries.map(([status, count]) => (
          <span
            key={status}
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
              STATUS_PILL[status] ?? 'bg-line/60 text-muted'
            }`}
          >
            {count} {status.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}
