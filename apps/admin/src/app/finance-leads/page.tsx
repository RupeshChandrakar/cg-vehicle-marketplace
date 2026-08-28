'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getFinanceEnquiries, updateFinanceEnquiryStatus, ApiError } from '@/lib/api';
import type { AdminFinanceEnquiry, FinanceEnquiryStatus } from '@/types/finance-enquiry';

const STATUS_FILTERS: Array<FinanceEnquiryStatus | 'all'> = ['all', 'new', 'contacted', 'closed'];

const STATUS_PILL: Record<FinanceEnquiryStatus, string> = {
  new: 'bg-gold/15 text-gold',
  contacted: 'bg-primary-light text-primary',
  closed: 'bg-line/60 text-muted',
};

export default function FinanceLeadsPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [status, setStatus] = useState<FinanceEnquiryStatus | 'all'>('new');
  const [leads, setLeads] = useState<AdminFinanceEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getFinanceEnquiries(accessToken, status === 'all' ? undefined : status);
      setLeads(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load finance leads.');
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
    void loadLeads();
  }, [loadLeads]);

  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">
        Ye pure lead-capture hai — koi bank/NBFC integration nahi hai. Har lead pe manually
        follow-up karke apne finance partner se connect karein.
      </p>

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
            {filter}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="rounded-2xl bg-background px-4 py-12 text-center text-sm text-muted shadow-card">
          No finance leads with this status.
        </p>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} accessToken={accessToken as string} onChanged={loadLeads} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  accessToken,
  onChanged,
}: {
  lead: AdminFinanceEnquiry;
  accessToken: string;
  onChanged: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(newStatus: FinanceEnquiryStatus): Promise<void> {
    setIsUpdating(true);
    try {
      await updateFinanceEnquiryStatus(accessToken, lead.id, newStatus);
      onChanged();
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="rounded-2xl bg-background p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-foreground">{lead.name}</h3>
          <p className="text-sm text-muted">{lead.phone}</p>
          <p className="text-sm text-muted">
            {lead.vehicle ? `Vehicle: ${lead.vehicle.title}` : 'General finance enquiry'}
          </p>
          {lead.message && <p className="mt-1 text-sm text-muted">&ldquo;{lead.message}&rdquo;</p>}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_PILL[lead.status]}`}
          >
            {lead.status}
          </span>
          <select
            value={lead.status}
            onChange={(e) => void handleStatusChange(e.target.value as FinanceEnquiryStatus)}
            disabled={isUpdating}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-foreground disabled:opacity-60"
          >
            {STATUS_FILTERS.filter((s) => s !== 'all').map((s) => (
              <option key={s} value={s}>
                Mark {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-3 border-t border-line pt-2 text-xs text-muted">
        Submitted {new Date(lead.createdAt).toLocaleString('en-IN')}
      </p>
    </div>
  );
}
