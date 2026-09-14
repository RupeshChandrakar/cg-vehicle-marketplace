import Link from 'next/link';
import type { Category } from '@/types/vehicle';
import {
  getCategoryIcon,
  getCategoryIconColor,
  getCategoryTint,
} from '@/features/vehicles/category-icons';

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
  const orderedCategories = [...categories].sort((a, b) => {
    const order: Record<string, number> = {
      cars: 1,
      tractors: 2,
      bikes: 3,
      scooters: 4,
      'commercial-vehicles': 5,
    };
    const aOrder = order[a.slug] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = order[b.slug] ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Categories</h2>
      <nav
        className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-9"
        aria-label="Vehicle categories"
      >
        {orderedCategories.map((category) => {
          const Icon = getCategoryIcon(category.slug);
          const tint = getCategoryTint(category.slug);
          const iconColor = getCategoryIconColor(category.slug);
          const active = activeCategorySlug === category.slug;
          const label = category.slug === 'scooters' ? 'Scooty' : category.name;
          return (
            <Link
              key={category.id}
              href={hrefFor(active ? undefined : category.slug, activeDistrictSlug)}
              className="group flex flex-col items-center gap-2 text-center press-chip"
            >
              {/* Selected uses the real "this is active" signal (solid
                  primary fill, white icon); at rest, each category gets its
                  own soft pastel tint plus a matching icon color
                  (getCategoryTint/getCategoryIconColor) instead of one
                  uniform gray chip — matches the reference app's own
                  colored-line-icon convention, not a semantic color. */}
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition transition-snappy ${
                  active ? 'bg-primary shadow-btn' : tint
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? 'text-white' : iconColor}`} strokeWidth={1.75} />
              </span>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
