import Link from 'next/link';
import type { Vehicle } from '@/types/vehicle';
import { formatFuelType, formatKm, formatPrice, formatTransmission } from '@/lib/format';

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const coverImage = vehicle.media[0];

  return (
    <Link
      href={`/vehicle/${vehicle.publicId}/${vehicle.slug}`}
      className="block border border-line transition-colors hover:border-primary"
    >
      <div className="aspect-[4/3] w-full bg-primary-light">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote media host isn't configured until Phase 2's upload flow lands
          <img src={coverImage.url} alt={vehicle.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            Photo coming soon
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground">{vehicle.title}</h3>
          {vehicle.verification && (
            <span className="shrink-0 border border-primary px-1.5 py-0.5 text-xs text-primary">
              Verified
            </span>
          )}
        </div>

        <p className="text-lg font-semibold text-foreground">{formatPrice(vehicle.price)}</p>

        <p className="text-sm text-muted">
          {vehicle.year} &middot; {formatKm(vehicle.kmDriven)} &middot;{' '}
          {formatFuelType(vehicle.fuelType)} &middot; {formatTransmission(vehicle.transmission)}
        </p>

        <div className="flex items-center justify-between pt-1 text-sm text-muted">
          <span>{vehicle.location.district}</span>
          <span>ID: {vehicle.publicId}</span>
        </div>
      </div>
    </Link>
  );
}
