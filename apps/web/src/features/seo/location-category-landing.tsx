import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@cg/shared-config';
import { getVehicles } from '@/lib/api';
import { VehicleCard } from '@/features/vehicles/vehicle-card';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type Faq = {
  question: string;
  answer: string;
};

type PriceBand = {
  label: string;
  minPrice?: number;
  maxPrice?: number;
};

export type LandingConfig = {
  path: string;
  categoryName: string;
  categorySlug: string;
  districtName: string;
  districtSlug: string;
  h1: string;
  secondaryKeyword?: string;
  intro: string;
  title: string;
  description: string;
  nearbyLinks: Array<{ href: string; label: string }>;
  faqs: Faq[];
  priceBands?: PriceBand[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateLandingMetadata(config: LandingConfig): Promise<Metadata> {
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: config.path },
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.path,
      siteName: brand.name,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
    },
  };
}

export async function LocationCategoryLandingPage({
  config,
  searchParams,
}: {
  config: LandingConfig;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const activeMinPrice = Number(firstValue(searchParams?.minPrice)) || undefined;
  const activeMaxPrice = Number(firstValue(searchParams?.maxPrice)) || undefined;

  const result = await getVehicles({
    categorySlug: config.categorySlug,
    locationSlug: config.districtSlug,
    page: 1,
    sort: 'newest',
    minPrice: activeMinPrice,
    maxPrice: activeMaxPrice,
  });

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="space-y-3 rounded-2xl bg-primary-light p-5 shadow-card sm:p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {config.h1}
        </h1>
        {config.secondaryKeyword && (
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Also searched as: {config.secondaryKeyword}
          </p>
        )}
        <p className="max-w-3xl text-sm leading-6 text-muted">{config.intro}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-background px-3 py-1 font-medium text-foreground">
            Verified Listings
          </span>
          <span className="rounded-full bg-background px-3 py-1 font-medium text-foreground">
            Local Support in {config.districtName}
          </span>
        </div>
      </header>

      {config.priceBands && config.priceBands.length > 0 && (
        <section className="space-y-3 rounded-2xl bg-background p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {config.categoryName.slice(0, -1)} by Price
            </h2>
            {(activeMinPrice || activeMaxPrice) && (
              <Link
                href={config.path}
                className="text-sm font-medium text-primary transition hover:text-primary-dark"
              >
                Clear filters
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {config.priceBands.map((band) => {
              const params = new URLSearchParams();
              if (band.minPrice !== undefined) params.set('minPrice', String(band.minPrice));
              if (band.maxPrice !== undefined) params.set('maxPrice', String(band.maxPrice));
              const href = params.toString() ? `${config.path}?${params.toString()}` : config.path;
              const isActive =
                activeMinPrice === band.minPrice && activeMaxPrice === band.maxPrice;

              return (
                <Link
                  key={band.label}
                  href={href}
                  className={`rounded-md border px-5 py-2.5 text-sm transition ${
                    isActive
                      ? 'border-primary bg-primary text-white shadow-btn'
                      : 'border-primary text-primary hover:bg-primary-light'
                  }`}
                >
                  {band.label}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Latest {config.categoryName} in {config.districtName}
          </h2>
          <Link
            href={`/?category=${config.categorySlug}&district=${config.districtSlug}`}
            className="text-sm font-medium text-primary transition hover:text-primary-dark"
          >
            View all filters
          </Link>
        </div>

        {result.data.length === 0 ? (
          <div className="rounded-2xl bg-primary-light px-4 py-10 text-sm text-muted shadow-card">
            Abhi {config.districtName} me {config.categoryName.toLowerCase()} listings kam hain. Aap
            Chhattisgarh ki saari listings dekhein.
            <div className="mt-3">
              <Link
                href={`/?category=${config.categorySlug}`}
                className="font-semibold text-primary transition hover:text-primary-dark"
              >
                Browse {config.categoryName} in Chhattisgarh
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {result.data.slice(0, 12).map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Nearby Searches</h2>
        <div className="flex flex-wrap gap-2">
          {config.nearbyLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-line bg-background px-3 py-1.5 text-sm text-foreground transition hover:bg-primary-light"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {config.faqs.map((faq) => (
            <details key={faq.question} className="rounded-xl bg-background p-4 shadow-card">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm leading-6 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-background p-5 shadow-card">
        <h2 className="text-base font-semibold text-foreground">
          Want to sell your vehicle in {config.districtName}?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Apni gaadi list karein aur local buyers tak jaldi pahunchiye.
        </p>
        <Link
          href="/sell"
          className="mt-4 inline-flex rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
        >
          Start Selling
        </Link>
      </section>

      <p className="text-xs text-muted">
        Coverage: {config.districtName}, Chhattisgarh. For broader discovery, browse all listings on{' '}
        <Link href="/" className="font-medium text-primary transition hover:text-primary-dark">
          {brand.name}
        </Link>
        .
      </p>
    </div>
  );
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
