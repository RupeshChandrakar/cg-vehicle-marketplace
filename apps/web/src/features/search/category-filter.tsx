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
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center border ${
                active
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-line text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs text-muted">{category.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
