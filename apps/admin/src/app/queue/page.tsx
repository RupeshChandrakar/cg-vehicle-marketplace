'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { approveVehicle, getAdminVehicles, rejectVehicle, ApiError } from '@/lib/api';
import type { AdminVehicle, VehicleStatus } from '@/types/vehicle';

const STATUS_FILTERS: VehicleStatus[] = ['submitted', 'under_review', 'live', 'rejected'];

export default function QueuePage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [status, setStatus] = useState<VehicleStatus>('submitted');
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminVehicles(accessToken, status);
      setVehicles(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load the queue.');
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
    // Fetch-on-mount-and-on-filter-change: loadQueue's first synchronous
    // statement is setIsLoading(true), which already matches useState's
    // initial value on mount and only does real work on a later re-fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadQueue();
  }, [loadQueue]);

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
      ) : vehicles.length === 0 ? (
        <p className="border border-line px-4 py-12 text-center text-sm text-muted">
          No listings with status &quot;{status.replace('_', ' ')}&quot;.
        </p>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <VehicleReviewCard
              key={vehicle.id}
              vehicle={vehicle}
              accessToken={accessToken as string}
              onActioned={loadQueue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleReviewCard({
  vehicle,
  accessToken,
  onActioned,
}: {
  vehicle: AdminVehicle;
  accessToken: string;
  onActioned: () => void;
}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReview = vehicle.status === 'submitted' || vehicle.status === 'under_review';

  async function handleApprove(): Promise<void> {
    setIsSubmitting(true);
    setError(null);
    try {
      await approveVehicle(accessToken, vehicle.id);
      onActioned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to approve.');
      setIsSubmitting(false);
    }
  }

  async function handleReject(): Promise<void> {
    if (reason.trim().length < 3) {
      setError('Enter a reason (at least 3 characters).');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await rejectVehicle(accessToken, vehicle.id, reason.trim());
      onActioned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reject.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-foreground">{vehicle.title}</h3>
          <p className="text-sm text-muted">
            {vehicle.category.name} &middot; {vehicle.location.district} &middot; ₹
            {Number(vehicle.price).toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-muted">
            {vehicle.year} &middot; {vehicle.kmDriven.toLocaleString('en-IN')} km &middot;{' '}
            {vehicle.fuelType} &middot; {vehicle.transmission}
          </p>
        </div>
        <span className="border border-line px-2 py-1 text-xs text-muted">{vehicle.status}</span>
      </div>

      <div className="mt-3 border-t border-line pt-3 text-sm text-muted">
        Seller: {vehicle.seller.name ?? 'Unknown'} &middot; {vehicle.seller.phone} &middot;{' '}
        {vehicle.media.length} photo{vehicle.media.length === 1 ? '' : 's'}
      </div>

      {vehicle.rejectionReason && (
        <p className="mt-2 text-sm text-muted">Rejection reason: {vehicle.rejectionReason}</p>
      )}

      {error && <p className="mt-2 text-sm text-foreground">{error}</p>}

      {canReview && (
        <div className="mt-4 space-y-2">
          {isRejecting ? (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection"
                rows={2}
                className="w-full border border-line px-3 py-2 text-sm text-foreground"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="border border-line px-3 py-1.5 text-sm text-foreground disabled:opacity-60"
                >
                  Confirm reject
                </button>
                <button
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 text-sm text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => setIsRejecting(true)}
                disabled={isSubmitting}
                className="border border-line px-3 py-1.5 text-sm text-foreground disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
