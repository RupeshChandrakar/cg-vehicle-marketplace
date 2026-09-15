import Link from 'next/link';

type SearchLink = {
  href: string;
  label: string;
};

type SearchGroup = {
  title: string;
  links: SearchLink[];
};

const TOP_LOCATIONS = [
  { name: 'Raipur', slug: 'raipur' },
  { name: 'Bilaspur', slug: 'bilaspur' },
  { name: 'Durg', slug: 'durg' },
  { name: 'Bhilai', slug: 'bhilai' },
  { name: 'Korba', slug: 'korba' },
  { name: 'Raigarh', slug: 'raigarh' },
  { name: 'Jagdalpur', slug: 'jagdalpur' },
  { name: 'Ambikapur', slug: 'ambikapur' },
  { name: 'Rajnandgaon', slug: 'rajnandgaon' },
  { name: 'Mahasamund', slug: 'mahasamund' },
] as const;

const GROUPS: SearchGroup[] = [
  {
    title: 'Used Cars by City',
    links: TOP_LOCATIONS.map((location) => ({
      href: `/used-cars-in-${location.slug}`,
      label: `Used Cars in ${location.name}`,
    })),
  },
  {
    title: 'Used Bikes by City',
    links: TOP_LOCATIONS.map((location) => ({
      href: `/used-bikes-in-${location.slug}`,
      label: `Used Bikes in ${location.name}`,
    })),
  },
  {
    title: 'Used Tractors by City',
    links: TOP_LOCATIONS.map((location) => ({
      href: `/used-tractors-in-${location.slug}`,
      label: `Used Tractors in ${location.name}`,
    })),
  },
];

export function TopSearches() {
  return (
    <section className="space-y-4 rounded-2xl bg-background p-5 shadow-card sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">Top Vehicle Searches in Chhattisgarh</h2>
        <p className="text-sm text-muted">
          Popular city-wise pages to quickly find used and second hand cars, bikes, and tractors.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
            <div className="flex flex-wrap gap-2">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="press-chip rounded-full border border-line bg-primary-light px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Link
          href="/second-hand-cars-in-raipur"
          className="press-text text-xs font-medium text-primary transition hover:text-primary-dark"
        >
          Second Hand Cars in Raipur
        </Link>
        <Link
          href="/second-hand-bikes-in-bilaspur"
          className="press-text text-xs font-medium text-primary transition hover:text-primary-dark"
        >
          Second Hand Bikes in Bilaspur
        </Link>
        <Link
          href="/second-hand-tractors-in-mahasamund"
          className="press-text text-xs font-medium text-primary transition hover:text-primary-dark"
        >
          Second Hand Tractors in Mahasamund
        </Link>
      </div>
    </section>
  );
}
