import Link from 'next/link';
import type { Category } from '@/types/vehicle';

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
    <nav className="flex flex-wrap gap-2" aria-label="Vehicle categories">
      <CategoryLink
        label="All"
        href={hrefFor(undefined, activeDistrictSlug)}
        active={!activeCategorySlug}
      />
      {categories.map((category) => (
        <CategoryLink
          key={category.id}
          label={category.name}
          href={hrefFor(category.slug, activeDistrictSlug)}
          active={activeCategorySlug === category.slug}
        />
      ))}
    </nav>
  );
}

function CategoryLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`border px-3 py-1.5 text-sm ${
        active ? 'border-primary text-primary' : 'border-line text-foreground'
      }`}
    >
      {label}
    </Link>
  );
}
