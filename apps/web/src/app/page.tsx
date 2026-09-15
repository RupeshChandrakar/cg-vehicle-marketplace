import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { brand } from '@cg/shared-config';
import { getCategories, getLocations, getVehicles } from '@/lib/api';
import { VehicleCard } from '@/features/vehicles/vehicle-card';
import { CategoryFilter } from '@/features/search/category-filter';
import { SearchLocationBar } from '@/features/search/search-location-bar';
import { SortPriceBar } from '@/features/search/sort-price-bar';
import type { VehicleSortOption } from '@/lib/api';
import { PromoTicker } from '@/features/home/promo-ticker';
import { PersonalGreeting } from '@/features/home/personal-greeting';
import { RotatingHeroCard } from '@/features/home/rotating-hero-card';
import { WhyChooseUs } from '@/features/home/why-choose-us';
import { TopSearches } from '@/features/home/top-searches';
import type { Category, PaginatedResult, Vehicle } from '@/types/vehicle';

const INDEXABLE_CATEGORY_SLUGS = new Set(['cars', 'bikes', 'tractors']);

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<'/'>): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = firstValue(searchParams.q);
  const categorySlug = firstValue(searchParams.category);
  const districtSlug = firstValue(searchParams.district);
  const page = Number(firstValue(searchParams.page)) || 1;
  const sort = firstValue(searchParams.sort);
  const minPrice = Number(firstValue(searchParams.minPrice)) || undefined;
  const maxPrice = Number(firstValue(searchParams.maxPrice)) || undefined;
  const hpMin = Number(firstValue(searchParams.hpMin)) || undefined;
  const hpMax = Number(firstValue(searchParams.hpMax)) || undefined;
  const hasRefinementParams = Boolean(
    query || sort || minPrice || maxPrice || hpMin || hpMax || page > 1,
  );

  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);
  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const activeLocation = locations.find((location) => location.slug === districtSlug);

  const canonical = getCanonicalPath(categorySlug, districtSlug, hasRefinementParams);
  const title = buildBrowseTitle(activeCategory?.name, activeLocation?.district);
  const description = buildBrowseDescription(activeCategory?.name, activeLocation?.district);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: brand.name,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: hasRefinementParams
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export default async function Home(props: PageProps<'/'>) {
  const searchParams = await props.searchParams;
  const query = firstValue(searchParams.q);
  const categorySlug = firstValue(searchParams.category);
  const districtSlug = firstValue(searchParams.district);
  const page = Number(firstValue(searchParams.page)) || 1;
  const sort = firstValue(searchParams.sort) as VehicleSortOption | undefined;
  const minPrice = Number(firstValue(searchParams.minPrice)) || undefined;
  const maxPrice = Number(firstValue(searchParams.maxPrice)) || undefined;
  const hpMin = Number(firstValue(searchParams.hpMin)) || undefined;
  const hpMax = Number(firstValue(searchParams.hpMax)) || undefined;
  const hasActiveFilters = Boolean(
    query || categorySlug || sort || minPrice || maxPrice || hpMin || hpMax,
  );

  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);

  const baseFilters = {
    q: query,
    categorySlug,
    page,
    sort,
    minPrice,
    maxPrice,
    hpMin,
    hpMax,
  };
  let result = await getVehicles({ ...baseFilters, locationSlug: districtSlug });
  let fellBackToAllDistricts = false;

  // District → broader Chhattisgarh fallback: a chosen district with zero
  // matches shouldn't leave the customer looking at an empty page.
  if (districtSlug && result.data.length === 0) {
    result = await getVehicles(baseFilters);
    fellBackToAllDistricts = true;
  }

  const activeCategory = categories.find((category) => category.slug === categorySlug);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:py-10">
      {hasActiveFilters ? (
        <SearchLocationBar activeDistrictSlug={districtSlug} initialQuery={query} />
      ) : (
        <HeroBanner activeDistrictSlug={districtSlug} initialQuery={query} />
      )}

      <CategoryFilter
        categories={categories}
        activeCategorySlug={categorySlug}
        activeDistrictSlug={districtSlug}
      />

      <SortPriceBar categories={categories} locations={locations} />

      <div className="space-y-5">
        <ResultsHeading
          query={query}
          activeCategory={activeCategory}
          total={result.meta.total}
          hasActiveFilters={hasActiveFilters}
        />

        {fellBackToAllDistricts && (
          <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">
            Is district mein abhi listings nahi hain — Chhattisgarh ki saari listings dikha rahe
            hain.
          </p>
        )}

        {result.data.length === 0 ? (
          <EmptyState hasActiveFilters={hasActiveFilters} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {result.data.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        <Pagination
          result={result}
          query={query}
          categorySlug={categorySlug}
          districtSlug={districtSlug}
          sort={sort}
          minPrice={minPrice}
          maxPrice={maxPrice}
          hpMin={hpMin}
          hpMax={hpMax}
        />

        {categorySlug === 'tractors' && (
          <TractorQuickExplore
            activeDistrictSlug={districtSlug}
            activeQuery={query}
            activeHpMin={hpMin}
            activeHpMax={hpMax}
          />
        )}
      </div>

      <WhyChooseUs />

      <TopSearches />
    </div>
  );
}

const TRACTOR_BRAND_LINKS = [
  'Mahindra',
  'Swaraj',
  'John Deere',
  'Massey Ferguson',
  'Eicher',
  'New Holland',
  'Sonalika',
  'Farmtrac',
] as const;

const TRACTOR_HP_LINKS: Array<{ label: string; hpMin?: number; hpMax?: number }> = [
  { label: 'Under 30 HP', hpMax: 29 },
  { label: '30 to 40 HP', hpMin: 30, hpMax: 40 },
  { label: '40 to 50 HP', hpMin: 40, hpMax: 50 },
  { label: '50 to 60 HP', hpMin: 50, hpMax: 60 },
  { label: 'Above 60 HP', hpMin: 61 },
];

function TractorQuickExplore({
  activeDistrictSlug,
  activeQuery,
  activeHpMin,
  activeHpMax,
}: {
  activeDistrictSlug?: string;
  activeQuery?: string;
  activeHpMin?: number;
  activeHpMax?: number;
}) {
  function hrefFor(q: string): string {
    const params = new URLSearchParams();
    params.set('category', 'tractors');
    params.set('q', q);
    if (activeDistrictSlug) {
      params.set('district', activeDistrictSlug);
    }
    return `/?${params.toString()}`;
  }

  function hrefForHpRange(hpMin?: number, hpMax?: number): string {
    const params = new URLSearchParams();
    params.set('category', 'tractors');
    if (hpMin !== undefined) {
      params.set('hpMin', String(hpMin));
    }
    if (hpMax !== undefined) {
      params.set('hpMax', String(hpMax));
    }
    if (activeDistrictSlug) {
      params.set('district', activeDistrictSlug);
    }
    return `/?${params.toString()}`;
  }

  function isActiveHpRange(hpMin?: number, hpMax?: number): boolean {
    return activeHpMin === hpMin && activeHpMax === hpMax;
  }

  function isActiveBrand(brandName: string): boolean {
    return (activeQuery ?? '').trim().toLowerCase() === brandName.toLowerCase();
  }

  function hrefClearHp(): string {
    const params = new URLSearchParams();
    params.set('category', 'tractors');
    if (activeDistrictSlug) {
      params.set('district', activeDistrictSlug);
    }
    if (activeQuery) {
      params.set('q', activeQuery);
    }
    return `/?${params.toString()}`;
  }

  return (
    <div className="space-y-5 rounded-2xl bg-primary-light/40 p-4 sm:p-5">
      <section className="space-y-3 rounded-xl bg-background p-4 shadow-card">
        <h3 className="text-base font-semibold text-foreground">Tractors By Brand</h3>
        <div className="flex flex-wrap gap-2.5">
          {TRACTOR_BRAND_LINKS.map((brandName) => (
            <Link
              key={brandName}
              href={hrefFor(brandName)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                isActiveBrand(brandName)
                  ? 'border-primary bg-primary text-white'
                  : 'border-primary text-primary hover:bg-primary-light'
              }`}
            >
              {brandName}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-background p-4 shadow-card">
        <h3 className="text-base font-semibold text-foreground">Tractors By HP</h3>
        <div className="flex flex-wrap gap-2.5">
          {TRACTOR_HP_LINKS.map((item) => (
            <Link
              key={item.label}
              href={hrefForHpRange(item.hpMin, item.hpMax)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                isActiveHpRange(item.hpMin, item.hpMax)
                  ? 'border-primary bg-primary text-white'
                  : 'border-primary text-primary hover:bg-primary-light'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {(activeHpMin !== undefined || activeHpMax !== undefined) && (
            <Link
              href={hrefClearHp()}
              className="rounded-md border border-muted px-4 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
            >
              Clear HP Filter
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function HeroBanner({
  activeDistrictSlug,
  initialQuery,
}: {
  activeDistrictSlug?: string;
  initialQuery?: string;
}) {
  return (
    <div className="relative">
      <RotatingHeroCard>
        <PersonalGreeting />
        <PromoTicker />
        <h1 className="mt-3 max-w-lg text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Jai <span className="text-primary">Johar. 🙏</span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Verified vehicles, best condition, best deals — Chhattisgarh ke local experts ke saath.
        </p>
        <Link
          href="/sell"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark hover:shadow-btn-hover-primary active:scale-[0.97]"
        >
          Apni Gaadi Bechein
        </Link>
      </RotatingHeroCard>

      {/* The signature "floating pill" — the search bar sits as its own
          elevated white surface overlapping the panel's bottom edge, rather
          than living inside it as a plain form field. */}
      <div className="relative z-10 -mt-7 px-4 sm:px-8">
        <SearchLocationBar
          activeDistrictSlug={activeDistrictSlug}
          initialQuery={initialQuery}
          variant="floating"
        />
      </div>
    </div>
  );
}

function ResultsHeading({
  query,
  activeCategory,
  total,
  hasActiveFilters,
}: {
  query?: string;
  activeCategory?: Category;
  total: number;
  hasActiveFilters: boolean;
}) {
  if (query) {
    return (
      <h2 className="text-base font-semibold text-foreground">
        <span className="font-normal text-muted">&quot;{query}&quot; ke liye</span> {total}{' '}
        <span className="font-normal text-muted">vehicles mile</span>
      </h2>
    );
  }
  if (activeCategory) {
    return (
      <h2 className="text-base font-semibold text-foreground">
        {total} <span className="font-normal text-muted">{activeCategory.name} mile</span>
      </h2>
    );
  }
  return (
    <h2 className="text-lg font-semibold text-foreground">
      {hasActiveFilters ? `${total} vehicles mile` : 'Aapke aas-paas ki gaadiyan'}
    </h2>
  );
}

function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <SearchX className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-muted">Koi vehicle nahi mila. Category ya location badal ke dekhein.</p>
      {hasActiveFilters && (
        <Link
          href="/"
          className="press inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
        >
          Clear Filters
        </Link>
      )}
    </div>
  );
}

function Pagination({
  result,
  query,
  categorySlug,
  districtSlug,
  sort,
  minPrice,
  maxPrice,
  hpMin,
  hpMax,
}: {
  result: PaginatedResult<Vehicle>;
  query?: string;
  categorySlug?: string;
  districtSlug?: string;
  sort?: VehicleSortOption;
  minPrice?: number;
  maxPrice?: number;
  hpMin?: number;
  hpMax?: number;
}) {
  const { page, totalPages } = result.meta;
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categorySlug) params.set('category', categorySlug);
    if (districtSlug) params.set('district', districtSlug);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', String(minPrice));
    if (maxPrice) params.set('maxPrice', String(maxPrice));
    if (hpMin !== undefined) params.set('hpMin', String(hpMin));
    if (hpMax !== undefined) params.set('hpMax', String(hpMax));
    params.set('page', String(targetPage));
    return `/?${params.toString()}`;
  }

  return (
    <nav className="flex items-center justify-center gap-4 pt-4 text-sm" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-full px-4 py-2 font-medium text-primary transition hover:bg-primary-light"
        >
          Previous
        </Link>
      )}
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-full px-4 py-2 font-medium text-primary transition hover:bg-primary-light"
        >
          Next
        </Link>
      )}
    </nav>
  );
}

function getCanonicalPath(
  categorySlug?: string,
  districtSlug?: string,
  hasRefinementParams?: boolean,
): string {
  if (
    !hasRefinementParams &&
    categorySlug &&
    districtSlug &&
    INDEXABLE_CATEGORY_SLUGS.has(categorySlug)
  ) {
    return `/used-${categorySlug}-in-${districtSlug}`;
  }

  if (!hasRefinementParams && categorySlug && districtSlug) {
    return `/?category=${categorySlug}&district=${districtSlug}`;
  }

  if (!hasRefinementParams && categorySlug) {
    return `/?category=${categorySlug}`;
  }

  if (!hasRefinementParams && districtSlug) {
    return `/?district=${districtSlug}`;
  }

  return '/';
}

function buildBrowseTitle(categoryName?: string, districtName?: string): string {
  if (categoryName && districtName) {
    return `Used & Second Hand ${categoryName} in ${districtName} | ${brand.name}`;
  }
  if (categoryName) {
    return `Used ${categoryName} in Chhattisgarh | ${brand.name}`;
  }
  if (districtName) {
    return `Used Vehicles in ${districtName}, Chhattisgarh | ${brand.name}`;
  }
  return `${brand.name} | Buy & Sell Used Vehicles in Chhattisgarh`;
}

function buildBrowseDescription(categoryName?: string, districtName?: string): string {
  if (categoryName && districtName) {
    return `Browse verified used and second hand ${categoryName.toLowerCase()} in ${districtName}, Chhattisgarh. Compare price, year, and condition on ${brand.name}.`;
  }
  if (categoryName) {
    return `Explore verified used ${categoryName.toLowerCase()} across Chhattisgarh with quick contact support and trusted listings on ${brand.name}.`;
  }
  if (districtName) {
    return `Find verified used vehicles in ${districtName}, Chhattisgarh. Compare cars, bikes, tractors, and more on ${brand.name}.`;
  }
  return 'Buy and sell verified used cars, bikes, scooters, tractors, and commercial vehicles across Chhattisgarh.';
}
