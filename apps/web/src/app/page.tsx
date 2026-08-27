import Link from 'next/link';
import { getCategories, getLocations, getVehicles } from '@/lib/api';
import { VehicleCard } from '@/features/vehicles/vehicle-card';
import { CategoryFilter } from '@/features/search/category-filter';
import { LocationSelector } from '@/features/search/location-selector';
import { SearchBar } from '@/features/search/search-bar';
import type { Category, PaginatedResult, Vehicle } from '@/types/vehicle';

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <LocationSelector locations={locations} activeDistrictSlug={districtSlug} />
        <div className="flex-1">
          <SearchBar initialQuery={query} />
        </div>
      </div>

      {!hasActiveFilters && <HeroBanner />}

      <CategoryFilter
        categories={categories}
        activeCategorySlug={categorySlug}
        activeDistrictSlug={districtSlug}
      />

      <div className="space-y-4">
        <ResultsHeading
          query={query}
          activeCategory={activeCategory}
          total={result.meta.total}
          hasActiveFilters={hasActiveFilters}
        />

        {fellBackToAllDistricts && (
          <p className="border border-line bg-primary-light px-4 py-3 text-sm text-foreground">
            Is district mein abhi listings nahi hain — Chhattisgarh ki saari listings dikha rahe
            hain.
          </p>
        )}

        {result.data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function HeroBanner() {
  return (
    <div className="border border-line bg-primary-light p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
        Sahi Gaadi, <span className="text-primary">Sahi Daam</span>
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Verified vehicles, best condition, best deals — Chhattisgarh ke local experts ke saath.
      </p>
      <Link
        href="/sell"
        className="mt-4 inline-block bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        Apni Gaadi Bechein
      </Link>
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
        &quot;{query}&quot; ke liye <span className="font-medium text-foreground">{total}</span>{' '}
        vehicles mile
      </h2>
    );
  }
  if (activeCategory) {
    return (
      <h2 className="text-sm text-muted">
        <span className="font-medium text-foreground">{total}</span> {activeCategory.name} mile
      </h2>
    );
  }
  return (
    <h2 className="text-base font-medium text-foreground">
      {hasActiveFilters ? `${total} vehicles mile` : 'Aapke aas-paas ki gaadiyan'}
    </h2>
  );
}

function EmptyState() {
  return (
    <div className="border border-line px-4 py-16 text-center text-muted">
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
        <Link href={hrefFor(page - 1)} className="text-primary">
          Previous
        </Link>
      )}
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={hrefFor(page + 1)} className="text-primary">
          Next
        </Link>
      )}
    </nav>
  );
}
