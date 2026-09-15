import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShieldCheck, Gauge, Fuel, Settings2, User, Star, type LucideIcon } from 'lucide-react';
import {
  getVehicleByPublicId,
  getVehicleReviews,
  getSimilarVehicles,
  type VehicleReviewSummary,
} from '@/lib/api';
import { formatFuelType, formatKm, formatPrice, formatTransmission } from '@/lib/format';
import { brand } from '@cg/shared-config';
import type { Vehicle } from '@/types/vehicle';
import { VehicleGallery } from '@/features/vehicles/vehicle-gallery';
import { VehicleViewTracker } from '@/features/vehicles/vehicle-view-tracker';
import { WhatsAppShareButton } from '@/features/vehicles/whatsapp-share-button';
import { EnquiryActions } from '@/features/enquiries/enquiry-actions';
import { FavoriteButton } from '@/features/favorites/favorite-button';
import { getCategoryIconColor, getCategoryTint } from '@/features/vehicles/category-icons';
import { getFilledSpecFields } from '@/features/vehicles/spec-fields';
import { TractorInspectionChecklist } from '@/features/vehicles/tractor-inspection-checklist';
import { VehicleCard } from '@/features/vehicles/vehicle-card';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
    openGraph: {
      title: `${vehicle.title} — ${formatPrice(vehicle.price)} | ${brand.name}`,
      description: `${vehicle.year} ${vehicle.title}, ${formatKm(vehicle.kmDriven)}, ${formatFuelType(
        vehicle.fuelType,
      )}, in ${vehicle.location.district}. Vehicle ID ${vehicle.publicId}.`,
      url: `/vehicle/${vehicle.publicId}/${vehicle.slug}`,
      siteName: brand.name,
      locale: 'en_IN',
      type: 'website',
      images: vehicle.media[0]?.url ? [{ url: vehicle.media[0].url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${vehicle.title} — ${formatPrice(vehicle.price)} | ${brand.name}`,
      description: `${vehicle.year} ${vehicle.title}, ${formatKm(vehicle.kmDriven)}, ${formatFuelType(
        vehicle.fuelType,
      )}, in ${vehicle.location.district}. Vehicle ID ${vehicle.publicId}.`,
      images: vehicle.media[0]?.url ? [vehicle.media[0].url] : undefined,
    },
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
  const similarVehicles = await getSimilarVehicles(vehicle).catch((): [] => []);
  const structuredData = buildVehicleStructuredData(vehicle, reviewSummary);
  const breadcrumbStructuredData = buildBreadcrumbStructuredData(vehicle);
  const priceValue = Number(vehicle.price);
  const markedPrice = Number.isFinite(priceValue) ? Math.round(priceValue * 1.2) : 0;
  const monthlyEmi = Number.isFinite(priceValue) ? Math.max(1, Math.round(priceValue * 0.0214)) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <VehicleViewTracker vehiclePublicId={vehicle.publicId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <VehicleGallery media={vehicle.media} title={vehicle.title} />
        </div>

        <div className="space-y-6 lg:col-span-6">
          <div className="space-y-2">
            <div className="space-y-3 rounded-3xl border border-line bg-background p-4 shadow-card sm:p-5">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                    UID - {vehicle.publicId}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {vehicle.verification && (
                      <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                        CERTIFIED
                      </span>
                    )}
                    <WhatsAppShareButton title={vehicle.title} price={formatPrice(vehicle.price)} />
                    <FavoriteButton vehiclePublicId={vehicle.publicId} checkInitialState />
                  </div>
                </div>
                <h1 className="max-w-full truncate whitespace-nowrap text-lg font-extrabold leading-tight tracking-tight text-foreground sm:text-xl lg:text-2xl">
                  {vehicle.year} {vehicle.title} In {vehicle.location.district}, {vehicle.location.state}
                </h1>
                <button className="inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:text-primary-dark">
                  <span className="text-base leading-none">✎</span>
                  Change {vehicle.category.slug === 'tractors' ? 'Tractor' : vehicle.category.name}
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <p className="font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-[2.1rem]">
                  {formatPrice(vehicle.price)}
                </p>
                <p className="font-mono text-lg font-medium tabular-nums text-muted line-through decoration-2 decoration-muted/70">
                  {formatPrice(markedPrice)}
                </p>
                <span className="rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error">
                  20% OFF
                </span>
              </div>

              <p className="text-sm text-muted">
                EMI starts at{' '}
                <span className="font-semibold text-primary">
                  {formatPrice(monthlyEmi)}/month
                </span>
              </p>

              <p className="text-sm text-muted">
                {vehicle.location.district}
                {vehicle.specs.areaText ? `, ${vehicle.specs.areaText}` : ''},{' '}
                {vehicle.location.state} &middot; Vehicle ID {vehicle.publicId}
              </p>

              {vehicle.verification && (
                <div className="flex items-center gap-2 rounded-2xl bg-success/10 px-3 py-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Most Demanded! To be sold out soon
                </div>
              )}
            </div>
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

          <Specifications vehicle={vehicle} />

          <Highlights vehicle={vehicle} />

          <EnquiryActions vehiclePublicId={vehicle.publicId} autoOpenAfterMs={7000} />

          {vehicle.description && (
            <div className="space-y-1 border-t border-line pt-5">
              <h2 className="text-sm font-semibold text-foreground">Description</h2>
              <p className="text-sm text-muted">{vehicle.description}</p>
            </div>
          )}

          <Reviews summary={reviewSummary} />
        </div>
      </div>

      {vehicle.category.slug === 'tractors' && (
        <div className="mt-8">
          <TractorInspectionChecklist />
        </div>
      )}

      <SimilarVehicles vehicles={similarVehicles} />
    </div>
  );
}

function SimilarVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return null;

  return (
    <div className="mt-10 space-y-4 border-t border-line pt-8">
      <h2 className="text-lg font-semibold text-foreground">Similar Vehicles</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
}

/**
 * Replaces the old flat 4-tile SpecsGrid (2026-09-03, PO: "specifications
 * details ko or acha kriye ... eye catching bnaiye"). Two tiers: a
 * category-tinted "highlight" row for the 1-2 headline specs a real
 * marketplace listing leads with (Power+Mileage for a car, Load Capacity
 * for a truck, Lifting Capacity for a tractor — see spec-fields.ts's
 * per-category config), then a fuller grid mixing the universal facts
 * (KM/Fuel/Transmission/Owner) with whatever category-specific fields
 * this listing actually has values for. An unfilled field never renders
 * — a bare "—" row reads as missing data, not as a richer spec sheet.
 */
function Specifications({ vehicle }: { vehicle: Vehicle }) {
  const categorySlug = vehicle.category.slug;
  const techSpecs = getFilledSpecFields(categorySlug, vehicle.specs);
  const highlightSpecs = techSpecs.filter((spec) => spec.highlight);
  const regularTechSpecs = techSpecs.filter((spec) => !spec.highlight);
  const tint = getCategoryTint(categorySlug);
  const iconColor = getCategoryIconColor(categorySlug);

  const baseSpecs: Array<{ icon: LucideIcon; label: string; value: string }> = [
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
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Specifications</h2>

      {highlightSpecs.length > 0 && (
        <div className={`grid gap-3 ${highlightSpecs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {highlightSpecs.map((spec) => {
            const Icon = spec.icon;
            return (
              <div key={spec.key} className={`rounded-2xl ${tint} p-4`}>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-background ${iconColor}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <p className="mt-2.5 font-mono text-xl font-bold text-foreground">
                  {spec.value}
                  {spec.unit && (
                    <span className="ml-1 font-sans text-xs font-medium text-muted">
                      {spec.unit}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">{spec.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {baseSpecs.map(({ icon: Icon, label, value }) => (
          <div key={label} className="space-y-1 rounded-xl bg-primary-light/60 p-3 text-center">
            <Icon className="mx-auto h-4 w-4 text-muted" strokeWidth={1.75} />
            <p className="text-sm font-medium text-foreground">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
        {regularTechSpecs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div key={spec.key} className="space-y-1 rounded-xl bg-primary-light/60 p-3 text-center">
              <Icon className="mx-auto h-4 w-4 text-muted" strokeWidth={1.75} />
              <p className="text-sm font-medium text-foreground">
                {spec.value}
                {spec.unit ? ` ${spec.unit}` : ''}
              </p>
              <p className="text-xs text-muted">{spec.label}</p>
            </div>
          );
        })}
      </div>
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
          className="flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-xs font-medium text-foreground"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          {label}
        </span>
      ))}
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

function buildVehicleStructuredData(vehicle: Vehicle, reviewSummary: VehicleReviewSummary) {
  const url = `${SITE_URL}/vehicle/${vehicle.publicId}/${vehicle.slug}`;
  const imageUrls = vehicle.media.map((item) => item.url);
  const techSpecs = getFilledSpecFields(vehicle.category.slug, vehicle.specs);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.year} ${vehicle.title}`,
    description:
      vehicle.description ??
      `${vehicle.year} ${vehicle.title} in ${vehicle.location.district}, ${vehicle.location.state}.`,
    category: vehicle.category.name,
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
    sku: String(vehicle.publicId),
    image: imageUrls.length > 0 ? imageUrls : undefined,
    url,
    itemCondition: 'https://schema.org/UsedCondition',
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Fuel Type',
        value: formatFuelType(vehicle.fuelType),
      },
      {
        '@type': 'PropertyValue',
        name: 'Transmission',
        value: formatTransmission(vehicle.transmission),
      },
      {
        '@type': 'PropertyValue',
        name: 'KM Driven',
        value: String(vehicle.kmDriven),
        unitText: 'km',
      },
      {
        '@type': 'PropertyValue',
        name: 'Location',
        value: `${vehicle.location.district}, ${vehicle.location.state}`,
      },
      ...techSpecs.map((spec) => ({
        '@type': 'PropertyValue',
        name: spec.label,
        value: String(spec.value),
        unitText: spec.unit,
      })),
    ],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: Number(vehicle.price),
      availability: 'https://schema.org/InStock',
      url,
      seller: {
        '@type': 'Organization',
        name: brand.name,
      },
      areaServed: {
        '@type': 'State',
        name: vehicle.location.state,
      },
    },
    aggregateRating:
      reviewSummary.count > 0 && reviewSummary.average !== null
        ? {
            '@type': 'AggregateRating',
            ratingValue: reviewSummary.average,
            reviewCount: reviewSummary.count,
          }
        : undefined,
  };
}

function buildBreadcrumbStructuredData(vehicle: Vehicle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${vehicle.category.name} in ${vehicle.location.district}`,
        item: `${SITE_URL}/used-${vehicle.category.slug}-in-${vehicle.location.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: vehicle.title,
        item: `${SITE_URL}/vehicle/${vehicle.publicId}/${vehicle.slug}`,
      },
    ],
  };
}
