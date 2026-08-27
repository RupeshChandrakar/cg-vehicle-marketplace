import Link from 'next/link';
import { getCategories, getLocations, getVehicles } from '@/lib/api';
import { VehicleCard } from '@/features/vehicles/vehicle-card';
import { CategoryFilter } from '@/features/search/category-filter';
import { LocationSelector } from '@/features/search/location-selector';
import type { PaginatedResult, Vehicle } from '@/types/vehicle';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home(props: PageProps<'/'>) {
  const searchParams = await props.searchParams;
  const categorySlug = firstValue(searchParams.category);
  const districtSlug = firstValue(searchParams.district);
  const page = Number(firstValue(searchParams.page)) || 1;

  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);

  let result = await getVehicles({ categorySlug, locationSlug: districtSlug, page });
  let fellBackToAllDistricts = false;

  // District → broader Chhattisgarh fallback: a chosen district with zero
  // matches shouldn't leave the customer looking at an empty page.
  if (districtSlug && result.data.length === 0) {
    result = await getVehicles({ categorySlug, page });
    fellBackToAllDistricts = true;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter
          categories={categories}
          activeCategorySlug={categorySlug}
          activeDistrictSlug={districtSlug}
        />
        <LocationSelector locations={locations} activeDistrictSlug={districtSlug} />
      </div>

      {fellBackToAllDistricts && (
        <p className="border border-line bg-primary-light px-4 py-3 text-sm text-foreground">
          No listings found in that district yet — showing all Chhattisgarh listings instead.
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

      <Pagination result={result} categorySlug={categorySlug} districtSlug={districtSlug} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-line px-4 py-16 text-center text-muted">
      No vehicles found. Try a different category or location.
    </div>
  );
}

function Pagination({
  result,
  categorySlug,
  districtSlug,
}: {
  result: PaginatedResult<Vehicle>;
  categorySlug?: string;
  districtSlug?: string;
}) {
  const { page, totalPages } = result.meta;
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams();
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
