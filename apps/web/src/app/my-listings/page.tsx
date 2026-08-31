'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, ImageOff } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getMyVehicles, ApiError } from '@/lib/api';
import { MediaImage } from '@/components/media-image';
import type { MyVehicle, VehicleStatus } from '@/types/vehicle';

// Anything not in this list (rejected/live/approved/reserved/sold/expired)
// can't be self-edited — mirrors the API's SELLER_EDITABLE_STATUSES exactly.
const EDITABLE_STATUSES: VehicleStatus[] = ['draft', 'submitted', 'under_review'];

const STATUS_LABEL: Record<VehicleStatus, string> = {
  draft: 'Draft',
  submitted: 'Review Ke Liye Bheja Gaya',
  under_review: 'Review Ho Raha Hai',
  approved: 'Approved',
  live: 'Live',
  rejected: 'Reject Ho Gaya',
  reserved: 'Reserved',
  sold: 'Bik Gaya',
  expired: 'Expire Ho Gaya',
};

const STATUS_PILL: Record<VehicleStatus, string> = {
  draft: 'bg-line/60 text-muted',
  submitted: 'bg-gold/15 text-gold',
  under_review: 'bg-gold/15 text-gold',
  approved: 'bg-success/15 text-success',
  live: 'bg-success/15 text-success',
  rejected: 'bg-red-100 text-red-600',
  reserved: 'bg-blue-100 text-blue-600',
  sold: 'bg-foreground/10 text-foreground',
  expired: 'bg-line/60 text-muted',
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useCustomerAuth();
  const [vehicles, setVehicles] = useState<MyVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login?next=/my-listings');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getMyVehicles(accessToken)
      .then(setVehicles)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Listings load nahi ho paayi.');
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isAuthLoading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">My Listings</h1>
        <p className="mt-1 text-sm text-muted">
          Aapki saari submit ki hui gaadiyan yahan dikhengi — status, aur jab tak review nahi hua
          hai, edit bhi kar sakte hain.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton skeleton-circle h-10 w-10" />
              <div className="flex-1 space-y-2">
                <div className="skeleton skeleton-title w-2/3" />
                <div className="skeleton skeleton-text w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Car className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">Aapne abhi tak koi vehicle submit nahi ki hai.</p>
          <Link
            href="/sell"
            className="press inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
          >
            Apni Gaadi Bechein
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <ListingCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ vehicle }: { vehicle: MyVehicle }) {
  const canEdit = EDITABLE_STATUSES.includes(vehicle.status);
  const thumbnail = vehicle.media[0]?.url;

  return (
    <div className="press-card flex gap-4 rounded-2xl bg-background p-4 shadow-card">
      <MediaImage
        src={thumbnail}
        alt={vehicle.title}
        shape="thumb"
        emptyIcon={ImageOff}
        className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-primary-light"
      />

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-medium text-foreground">{vehicle.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_PILL[vehicle.status]}`}
          >
            {STATUS_LABEL[vehicle.status]}
          </span>
        </div>
        <p className="font-mono text-sm text-foreground">
          ₹{Number(vehicle.price).toLocaleString('en-IN')}
        </p>
        <p className="text-sm text-muted">
          {vehicle.year} &middot; {vehicle.kmDriven.toLocaleString('en-IN')} km &middot;{' '}
          {vehicle.media.length} photo{vehicle.media.length === 1 ? '' : 's'}
        </p>

        {vehicle.status === 'rejected' && vehicle.rejectionReason && (
          <p className="text-xs text-foreground">Reason: {vehicle.rejectionReason}</p>
        )}

        <div className="pt-1">
          {canEdit ? (
            <Link
              href={`/my-listings/${vehicle.id}/edit`}
              className="press inline-flex rounded-full border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary-light"
            >
              Edit
            </Link>
          ) : vehicle.status === 'live' && vehicle.publicId ? (
            <Link
              href={`/vehicle/${vehicle.publicId}/${vehicle.slug}`}
              className="press inline-flex rounded-full border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary-light"
            >
              Live Listing Dekhein
            </Link>
          ) : (
            <span className="text-xs text-muted">
              Ab edit nahi kar sakte — badlaav ke liye support se sampark karein.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
