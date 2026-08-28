import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShieldCheck, Gauge, Fuel, Settings2, User, Star } from 'lucide-react';
import { getVehicleByPublicId, getVehicleReviews, type VehicleReviewSummary } from '@/lib/api';
import { formatFuelType, formatKm, formatPrice, formatTransmission } from '@/lib/format';
import { brand } from '@cg/shared-config';
import type { Vehicle } from '@/types/vehicle';
import { VehicleGallery } from '@/features/vehicles/vehicle-gallery';
import { VehicleViewTracker } from '@/features/vehicles/vehicle-view-tracker';
import { WhatsAppShareButton } from '@/features/vehicles/whatsapp-share-button';
import { EnquiryActions } from '@/features/enquiries/enquiry-actions';
import { FinanceBanner } from '@/features/vehicles/finance-banner';
import { FavoriteButton } from '@/features/favorites/favorite-button';

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

  const reviewSummary = await getVehicleReviews(vehicle.publicId).catch(
    (): VehicleReviewSummary => ({ reviews: [], average: null, count: 0 }),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <VehicleViewTracker vehiclePublicId={vehicle.publicId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <VehicleGallery media={vehicle.media} title={vehicle.title} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {vehicle.title}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                {vehicle.verification && (
                  <span className="flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
                <WhatsAppShareButton title={vehicle.title} price={formatPrice(vehicle.price)} />
                <FavoriteButton vehiclePublicId={vehicle.publicId} checkInitialState />
              </div>
            </div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {formatPrice(vehicle.price)}
            </p>
            <p className="text-sm text-muted">
              {vehicle.location.district}
              {vehicle.specs.areaText ? `, ${vehicle.specs.areaText}` : ''},{' '}
              {vehicle.location.state} &middot; Vehicle ID {vehicle.publicId}
            </p>
            {reviewSummary.count > 0 && reviewSummary.average !== null && (
              <div className="flex items-center gap-1 text-sm text-foreground">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <span className="font-medium">{reviewSummary.average.toFixed(1)}</span>
                <span className="text-muted">
                  ({reviewSummary.count} review{reviewSummary.count === 1 ? '' : 's'})
                </span>
              </div>
            )}
          </div>

          <SpecsGrid vehicle={vehicle} />

          <Highlights vehicle={vehicle} />

          <EnquiryActions vehiclePublicId={vehicle.publicId} />

          <FinanceBanner vehiclePublicId={vehicle.publicId} />

          {vehicle.description && (
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-foreground">Description</h2>
              <p className="text-sm text-muted">{vehicle.description}</p>
            </div>
          )}

          <Overview vehicle={vehicle} />

          <Reviews summary={reviewSummary} />
        </div>
      </div>
    </div>
  );
}

function SpecsGrid({ vehicle }: { vehicle: Vehicle }) {
  const specs: Array<{ icon: typeof Gauge; label: string; value: string }> = [
    { icon: Gauge, label: 'KM Driven', value: formatKm(vehicle.kmDriven) },
    { icon: Fuel, label: 'Fuel', value: formatFuelType(vehicle.fuelType) },
    { icon: Settings2, label: 'Transmission', value: formatTransmission(vehicle.transmission) },
    {
      icon: User,
      label: 'Owner',
      value: vehicle.specs.ownerCount ? ordinal(vehicle.specs.ownerCount) : '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {specs.map(({ icon: Icon, label, value }) => (
        <div key={label} className="space-y-1 rounded-xl bg-primary-light/60 p-3 text-center">
          <Icon className="mx-auto h-4 w-4 text-muted" strokeWidth={1.75} />
          <p className="text-sm font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}

function Highlights({ vehicle }: { vehicle: Vehicle }) {
  const insuranceValid =
    vehicle.specs.insuranceValidUntil && new Date(vehicle.specs.insuranceValidUntil) > new Date();

  const highlights = [
    vehicle.specs.rcAvailable && 'RC Available',
    insuranceValid && 'Insurance Valid',
    vehicle.specs.noChallan && 'No Challan',
    vehicle.specs.nonAccident && 'Non-Accident',
  ].filter((label): label is string => Boolean(label));

  if (highlights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {highlights.map((label) => (
        <span
          key={label}
          className="flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-xs font-medium text-foreground"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
      ))}
    </div>
  );
}

function Overview({ vehicle }: { vehicle: Vehicle }) {
  const rows: Array<[string, string]> = [
    ['Category', vehicle.category.name],
    ['Year', String(vehicle.year)],
  ];
  if (vehicle.specs.insuranceValidUntil) {
    rows.push(['Insurance Valid Up To', formatDate(vehicle.specs.insuranceValidUntil)]);
  }

  return (
    <div className="space-y-2 border-t border-line pt-5">
      <h2 className="text-sm font-semibold text-foreground">Overview</h2>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Reviews({ summary }: { summary: VehicleReviewSummary }) {
  if (summary.reviews.length === 0) return null;

  return (
    <div className="space-y-3 border-t border-line pt-5">
      <h2 className="text-sm font-semibold text-foreground">Customer Reviews</h2>
      <div className="space-y-3">
        {summary.reviews.map((review) => (
          <div key={review.id} className="rounded-xl bg-primary-light/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {review.authorName ?? 'Anonymous'}
              </span>
              <span className="flex items-center gap-1 text-sm text-foreground">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                {review.rating}
              </span>
            </div>
            {review.comment && <p className="mt-1 text-sm text-muted">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  if (n === 1) return '1st Owner';
  if (n === 2) return '2nd Owner';
  if (n === 3) return '3rd Owner';
  return `${n}th Owner`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
