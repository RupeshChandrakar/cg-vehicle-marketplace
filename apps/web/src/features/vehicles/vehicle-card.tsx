'use client';

import Link from 'next/link';
import { ShieldCheck, MapPin, ImageOff } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { formatFuelType, formatKm, formatPrice, formatTransmission } from '@/lib/format';
import { FavoriteButton } from '@/features/favorites/favorite-button';
import { MediaImage } from '@/components/media-image';

/**
 * Redesigned (2026-09-04) against a real reference the PO shared (a
 * Spinny listing card) — adopted the parts that are honest to build:
 * a wider photo, price pulled up next to the title instead of its own
 * stacked line, and the km/fuel/transmission facts as individual chips
 * instead of one middot-joined text line, plus a divider before the
 * footer. Deliberately did NOT copy the reference's discount badge, EMI
 * line, "Save Filters," or dealer-network footer badge — this
 * marketplace has no price-history tracking, no real financing terms to
 * quote (see FinanceBanner's own honest-lead-capture framing), and no
 * dealer chain to badge, so those would all be fabricated. Kept
 * CG Auto Mart's own palette rather than Spinny's purple/pink — a color
 * swap is a bigger, separately-confirmed decision every other time this
 * project has made one (see the Ola/Uber redesign).
 */
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const coverImage = vehicle.media[0];

  return (
    <Link
      href={`/vehicle/${vehicle.publicId}/${vehicle.slug}`}
      className="press-card group block overflow-hidden rounded-2xl bg-background shadow-card transition-shadow transition-snappy hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-light">
        <MediaImage
          src={coverImage?.url}
          alt={vehicle.title}
          shape="thumb"
          emptyIcon={ImageOff}
          emptyIconClassName="h-6 w-6"
          emptyLabel="Photo coming soon"
          className="aspect-[16/10] w-full overflow-hidden bg-primary-light"
          imgClassName="transition-transform duration-200 ease-out group-hover:scale-105"
        />
        {vehicle.verification && (
          <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium text-success shadow-card">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </span>
        )}
        <FavoriteButton
          vehiclePublicId={vehicle.publicId}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-card transition hover:bg-background"
        />
      </div>

      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-sm font-semibold text-foreground">
            {vehicle.year} {vehicle.title}
          </h3>
          <p className="shrink-0 font-mono text-base font-bold tabular-nums text-foreground">
            {formatPrice(vehicle.price)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <SpecChip>{formatKm(vehicle.kmDriven)}</SpecChip>
          <SpecChip>{formatFuelType(vehicle.fuelType)}</SpecChip>
          <SpecChip>{formatTransmission(vehicle.transmission)}</SpecChip>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-2.5 text-xs text-muted">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {vehicle.location.district}
          </span>
          <span>ID: {vehicle.publicId}</span>
        </div>
      </div>
    </Link>
  );
}

function SpecChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-muted">
      {children}
    </span>
  );
}
