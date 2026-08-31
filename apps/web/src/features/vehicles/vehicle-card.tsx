'use client';

import Link from 'next/link';
import { ShieldCheck, MapPin, ImageOff } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { formatFuelType, formatKm, formatPrice, formatTransmission } from '@/lib/format';
import { FavoriteButton } from '@/features/favorites/favorite-button';
import { MediaImage } from '@/components/media-image';

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const coverImage = vehicle.media[0];

  return (
    <Link
      href={`/vehicle/${vehicle.publicId}/${vehicle.slug}`}
      className="press-card group block overflow-hidden rounded-2xl bg-background shadow-card transition-shadow transition-snappy hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary-light">
        <MediaImage
          src={coverImage?.url}
          alt={vehicle.title}
          shape="thumb"
          emptyIcon={ImageOff}
          emptyIconClassName="h-6 w-6"
          emptyLabel="Photo coming soon"
          className="aspect-[4/3] w-full overflow-hidden bg-primary-light"
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

      <div className="space-y-1.5 p-4">
        <h3 className="text-base font-medium text-foreground">{vehicle.title}</h3>

        <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
          {formatPrice(vehicle.price)}
        </p>

        <p className="text-sm text-muted">
          {vehicle.year} &middot; {formatKm(vehicle.kmDriven)} &middot;{' '}
          {formatFuelType(vehicle.fuelType)} &middot; {formatTransmission(vehicle.transmission)}
        </p>

        <div className="flex items-center justify-between pt-1 text-sm text-muted">
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
