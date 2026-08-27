import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getVehicleByPublicId } from '@/lib/api';
import { formatFuelType, formatKm, formatPrice, formatTransmission } from '@/lib/format';
import { brand } from '@cg/shared-config';
import type { Vehicle } from '@/types/vehicle';

async function loadVehicle(publicIdParam: string): Promise<Vehicle | null> {
  const publicId = Number(publicIdParam);
  if (!Number.isInteger(publicId)) return null;
  return getVehicleByPublicId(publicId);
}

export async function generateMetadata(
  props: PageProps<'/vehicle/[publicId]/[slug]'>,
): Promise<Metadata> {
  const { publicId } = await props.params;
  const vehicle = await loadVehicle(publicId);
  if (!vehicle) {
    return { title: `Vehicle not found | ${brand.name}` };
  }

  return {
    title: `${vehicle.title} — ${formatPrice(vehicle.price)} | ${brand.name}`,
    description: `${vehicle.year} ${vehicle.title}, ${formatKm(vehicle.kmDriven)}, ${formatFuelType(
      vehicle.fuelType,
    )}, in ${vehicle.location.district}. Vehicle ID ${vehicle.publicId}.`,
    alternates: { canonical: `/vehicle/${vehicle.publicId}/${vehicle.slug}` },
  };
}

export default async function VehiclePage(props: PageProps<'/vehicle/[publicId]/[slug]'>) {
  const { publicId } = await props.params;
  const vehicle = await loadVehicle(publicId);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Gallery media={vehicle.media} title={vehicle.title} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{vehicle.title}</h1>
              {vehicle.verification && (
                <span className="shrink-0 border border-primary px-2 py-1 text-xs text-primary">
                  Verified
                </span>
              )}
            </div>
            <p className="text-2xl font-semibold text-foreground">{formatPrice(vehicle.price)}</p>
            <p className="text-sm text-muted">
              {vehicle.location.district}, {vehicle.location.state} &middot; Vehicle ID{' '}
              {vehicle.publicId}
            </p>
          </div>

          <SpecsGrid vehicle={vehicle} />

          <EnquiryActions />

          {vehicle.description && (
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-foreground">Description</h2>
              <p className="text-sm text-muted">{vehicle.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Gallery({ media, title }: { media: Vehicle['media']; title: string }) {
  const cover = media[0];
  return (
    <div className="aspect-[4/3] w-full bg-primary-light">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote media host isn't configured until Phase 2's upload flow lands
        <img src={cover.url} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">
          Photos coming soon
        </div>
      )}
    </div>
  );
}

function SpecsGrid({ vehicle }: { vehicle: Vehicle }) {
  const specs: Array<[string, string]> = [
    ['Year', String(vehicle.year)],
    ['KM Driven', formatKm(vehicle.kmDriven)],
    ['Fuel Type', formatFuelType(vehicle.fuelType)],
    ['Transmission', formatTransmission(vehicle.transmission)],
    ['Category', vehicle.category.name],
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 border border-line p-4 text-sm">
      {specs.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted">{label}</dt>
          <dd className="text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EnquiryActions() {
  // Chat/Call go live with the agent workflow (Phase 3) — shown here as the
  // intended layout, not wired to fake functionality in the meantime.
  return (
    <div className="flex gap-3">
      <button disabled className="flex-1 border border-line px-4 py-2.5 text-sm text-muted">
        Chat — coming soon
      </button>
      <button disabled className="flex-1 border border-line px-4 py-2.5 text-sm text-muted">
        Call — coming soon
      </button>
    </div>
  );
}
