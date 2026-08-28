import Link from 'next/link';
import type { Category } from '@/types/vehicle';
import { getCategoryIcon } from '@/features/vehicles/category-icons';

interface CategoryFilterProps {
  categories: Category[];
  activeCategorySlug?: string;
  activeDistrictSlug?: string;
}

function hrefFor(categorySlug: string | undefined, districtSlug: string | undefined): string {
  const params = new URLSearchParams();
  if (categorySlug) params.set('category', categorySlug);
  if (districtSlug) params.set('district', districtSlug);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

export function CategoryFilter({
  categories,
  activeCategorySlug,
  activeDistrictSlug,
}: CategoryFilterProps) {
  return (
    <nav
      className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-9"
      aria-label="Vehicle categories"
    >
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.slug);
        const active = activeCategorySlug === category.slug;
        return (
          <Link
            key={category.id}
            href={hrefFor(active ? undefined : category.slug, activeDistrictSlug)}
            className="group flex flex-col items-center gap-2 text-center"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl transition ${
                active
                  ? 'bg-primary text-white shadow-btn'
                  : 'bg-primary-light text-primary shadow-card group-hover:shadow-card-hover'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <span className="text-xs font-medium text-foreground">{category.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
