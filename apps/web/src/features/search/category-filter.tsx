import Link from 'next/link';
import type { Category } from '@/types/vehicle';
import { getCategoryEmoji } from '@/features/vehicles/category-icons';

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
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Categories</h2>
      <nav
        className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-9"
        aria-label="Vehicle categories"
      >
        {categories.map((category) => {
          const emoji = getCategoryEmoji(category.slug);
          const active = activeCategorySlug === category.slug;
          return (
            <Link
              key={category.id}
              href={hrefFor(active ? undefined : category.slug, activeDistrictSlug)}
              className="group flex flex-col items-center gap-2 text-center press-chip"
            >
              {/* A flat light-gray chip at rest, no card shadow — green is
                  reserved for the active filter, so it stays a clear "this
                  is selected" signal rather than default noise. The emoji
                  itself is already colorful, so the chip doesn't need to
                  add its own icon color on top. */}
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition transition-snappy ${
                  active ? 'bg-primary shadow-btn' : 'category-chip group-hover:bg-line/60'
                }`}
              >
                {emoji}
              </span>
              <span className="text-xs font-medium text-foreground">{category.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
