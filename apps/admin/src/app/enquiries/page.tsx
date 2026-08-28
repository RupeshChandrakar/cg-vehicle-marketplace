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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatus(filter)}
            className={`border px-3 py-1.5 text-sm ${
              status === filter ? 'border-primary text-primary' : 'border-line text-foreground'
            }`}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 border border-line bg-primary-light px-4 py-3 text-sm">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : enquiries.length === 0 ? (
        <p className="border border-line px-4 py-12 text-center text-sm text-muted">
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
      className="block border border-line p-4 transition-colors hover:border-primary"
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
        <span className="border border-line px-2 py-1 text-xs text-muted">
          {enquiry.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}
