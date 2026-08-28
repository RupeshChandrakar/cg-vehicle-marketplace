import Link from 'next/link';
import { getCategories, getLocations, getVehicles } from '@/lib/api';
import { VehicleCard } from '@/features/vehicles/vehicle-card';
import { CategoryFilter } from '@/features/search/category-filter';
import { SearchLocationBar } from '@/features/search/search-location-bar';
import { PromoTicker } from '@/features/home/promo-ticker';
import { RotatingHeroCard } from '@/features/home/rotating-hero-card';
import type { Category, Location, PaginatedResult, Vehicle } from '@/types/vehicle';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home(props: PageProps<'/'>) {
  const searchParams = await props.searchParams;
  const query = firstValue(searchParams.q);
  const categorySlug = firstValue(searchParams.category);
  const districtSlug = firstValue(searchParams.district);
  const page = Number(firstValue(searchParams.page)) || 1;
  const hasActiveFilters = Boolean(query || categorySlug);

  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);

  let result = await getVehicles({ q: query, categorySlug, locationSlug: districtSlug, page });
  let fellBackToAllDistricts = false;

  // District → broader Chhattisgarh fallback: a chosen district with zero
  // matches shouldn't leave the customer looking at an empty page.
  if (districtSlug && result.data.length === 0) {
    result = await getVehicles({ q: query, categorySlug, page });
    fellBackToAllDistricts = true;
  }

  const activeCategory = categories.find((category) => category.slug === categorySlug);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:py-10">
      {hasActiveFilters ? (
        <SearchLocationBar
          locations={locations}
          activeDistrictSlug={districtSlug}
          initialQuery={query}
        />
      ) : (
        <HeroBanner locations={locations} activeDistrictSlug={districtSlug} initialQuery={query} />
      )}

      <CategoryFilter
        categories={categories}
        activeCategorySlug={categorySlug}
        activeDistrictSlug={districtSlug}
      />

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
          <EmptyState />
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
        />
      </div>
    </div>
  );
}

function HeroBanner({
  locations,
  activeDistrictSlug,
  initialQuery,
}: {
  locations: Location[];
  activeDistrictSlug?: string;
  initialQuery?: string;
}) {
  return (
    <div className="relative">
      <RotatingHeroCard>
        <PromoTicker />
        <h1 className="mt-4 max-w-lg text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Sahi Gaadi, <span className="text-primary">Sahi Daam</span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted sm:text-base">
          Verified vehicles, best condition, best deals — Chhattisgarh ke local experts ke saath.
        </p>
        <Link
          href="/sell"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] hover:shadow-btn-hover-primary active:scale-[0.97]"
        >
          Apni Gaadi Bechein
        </Link>
      </RotatingHeroCard>

      {/* The signature "floating pill" — the search bar sits as its own
          elevated white surface overlapping the panel's bottom edge, rather
          than living inside it as a plain form field. */}
      <div className="relative z-10 -mt-7 px-4 sm:px-8">
        <SearchLocationBar
          locations={locations}
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
      <h2 className="text-sm text-muted">
        &quot;{query}&quot; ke liye <span className="font-semibold text-foreground">{total}</span>{' '}
        vehicles mile
      </h2>
    );
  }
  if (activeCategory) {
    return (
      <h2 className="text-sm text-muted">
        <span className="font-semibold text-foreground">{total}</span> {activeCategory.name} mile
      </h2>
    );
  }
  return (
    <h2 className="text-lg font-semibold text-foreground">
      {hasActiveFilters ? `${total} vehicles mile` : 'Aapke aas-paas ki gaadiyan'}
    </h2>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-primary-light px-4 py-16 text-center text-muted shadow-card">
      Koi vehicle nahi mila. Category ya location badal ke dekhein.
    </div>
  );
}

function Pagination({
  result,
  query,
  categorySlug,
  districtSlug,
}: {
  result: PaginatedResult<Vehicle>;
  query?: string;
  categorySlug?: string;
  districtSlug?: string;
}) {
  const { page, totalPages } = result.meta;
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categorySlug) params.set('category', categorySlug);
    if (districtSlug) params.set('district', districtSlug);
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
