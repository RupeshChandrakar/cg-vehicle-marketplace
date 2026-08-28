'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAdminEnquiries, ApiError } from '@/lib/api';
import type { AdminEnquiry, EnquiryStatus } from '@/types/enquiry';

const STATUS_FILTERS: Array<EnquiryStatus | 'all'> = [
  'all',
  'open',
  'contacted',
  'negotiating',
  'closed_won',
  'closed_lost',
];

const STATUS_PILL: Record<EnquiryStatus, string> = {
  open: 'bg-primary-light text-primary',
  contacted: 'bg-gold/15 text-gold',
  negotiating: 'bg-blue-100 text-blue-600',
  closed_won: 'bg-foreground/10 text-foreground',
  closed_lost: 'bg-line/60 text-muted',
};

export default function EnquiriesPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [status, setStatus] = useState<EnquiryStatus | 'all'>('open');
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnquiries = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminEnquiries(
        accessToken,
        status === 'all' ? undefined : status,
      );
      setEnquiries(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load enquiries.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, status]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEnquiries();
  }, [loadEnquiries]);

  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatus(filter)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              status === filter
                ? 'bg-primary text-white shadow-btn'
                : 'bg-background text-foreground shadow-card hover:shadow-card-hover'
            }`}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : enquiries.length === 0 ? (
        <p className="rounded-2xl bg-background px-4 py-12 text-center text-sm text-muted shadow-card">
          No enquiries with this status.
        </p>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enquiry) => (
            <EnquiryRow key={enquiry.id} enquiry={enquiry} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnquiryRow({ enquiry }: { enquiry: AdminEnquiry }) {
  return (
    <Link
      href={`/enquiries/${enquiry.id}`}
      className="block rounded-2xl bg-background p-4 shadow-card transition hover:shadow-card-hover"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-foreground">{enquiry.vehicle.title}</h3>
          <p className="text-sm text-muted">
            {enquiry.customer.name ?? 'Unknown'} &middot; {enquiry.customer.phone} &middot;{' '}
            {enquiry.channel}
          </p>
          <p className="text-sm text-muted">
            Agent: {enquiry.agent?.name ?? enquiry.agent?.email ?? 'Unassigned'}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_PILL[enquiry.status]}`}
        >
          {enquiry.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}
