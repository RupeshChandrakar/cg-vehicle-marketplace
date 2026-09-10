import Link from 'next/link';

const POPULAR_LINK_GROUPS = [
  {
    title: 'Popular Used Car Searches',
    links: [
      { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
      { href: '/used-cars-in-bilaspur', label: 'Used Cars in Bilaspur' },
      { href: '/used-cars-in-durg', label: 'Used Cars in Durg' },
      { href: '/used-cars-in-bhilai', label: 'Used Cars in Bhilai' },
      { href: '/second-hand-cars-in-raipur', label: 'Second Hand Cars in Raipur' },
      { href: '/second-hand-cars-in-bilaspur', label: 'Second Hand Cars in Bilaspur' },
    ],
  },
  {
    title: 'Popular Used Bike Searches',
    links: [
      { href: '/used-bikes-in-raipur', label: 'Used Bikes in Raipur' },
      { href: '/used-bikes-in-bilaspur', label: 'Used Bikes in Bilaspur' },
      { href: '/used-bikes-in-durg', label: 'Used Bikes in Durg' },
      { href: '/used-bikes-in-korba', label: 'Used Bikes in Korba' },
      { href: '/second-hand-bikes-in-raipur', label: 'Second Hand Bikes in Raipur' },
      { href: '/second-hand-bikes-in-bilaspur', label: 'Second Hand Bikes in Bilaspur' },
    ],
  },
  {
    title: 'Popular Used Tractor Searches',
    links: [
      { href: '/used-tractors-in-mahasamund', label: 'Used Tractors in Mahasamund' },
      { href: '/used-tractors-in-rajnandgaon', label: 'Used Tractors in Rajnandgaon' },
      { href: '/used-tractors-in-raigarh', label: 'Used Tractors in Raigarh' },
      { href: '/used-tractors-in-jagdalpur', label: 'Used Tractors in Jagdalpur' },
      { href: '/second-hand-tractors-in-mahasamund', label: 'Second Hand Tractors in Mahasamund' },
      { href: '/second-hand-tractors-in-rajnandgaon', label: 'Second Hand Tractors in Rajnandgaon' },
    ],
  },
  {
    title: 'Helpful Buying Guides',
    links: [
      { href: '/used-vehicle-documents-checklist-chhattisgarh', label: 'Used Vehicle Documents Checklist' },
      { href: '/best-second-hand-family-cars-in-chhattisgarh', label: 'Best Second Hand Family Cars' },
      { href: '/best-mileage-bikes-in-chhattisgarh', label: 'Best Mileage Bikes' },
      { href: '/used-car-inspection-checklist-chhattisgarh', label: 'Used Car Inspection Checklist' },
      { href: '/how-to-sell-used-vehicle-in-chhattisgarh', label: 'How to Sell Used Vehicle' },
      { href: '/used-car-vs-second-hand-car-in-chhattisgarh', label: 'Used Car vs Second Hand Car' },
      { href: '/used-tractor-buying-guide-chhattisgarh', label: 'Used Tractor Buying Guide' },
      { href: '/used-bike-seller-checklist-chhattisgarh', label: 'Used Bike Seller Checklist' },
      { href: '/used-cars-in-raipur-vs-bilaspur', label: 'Used Cars in Raipur vs Bilaspur' },
      { href: '/used-scooter-buying-guide-chhattisgarh', label: 'Used Scooter Buying Guide' },
      { href: '/used-scooter-inspection-checklist-chhattisgarh', label: 'Used Scooter Inspection Checklist' },
      { href: '/used-scooter-vs-used-bike-chhattisgarh', label: 'Used Scooter vs Used Bike' },
    ],
  },
] as const;

export function SeoFooterLinks() {
  return (
    <section className="border-t border-line bg-primary-light/45 pb-28 pt-8 sm:pb-8">
      <div className="mx-auto max-w-[88rem] px-4 lg:px-6">
        <div className="rounded-[28px] bg-background p-5 shadow-card sm:p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Explore More Cities in Chhattisgarh</h2>
            <p className="text-sm text-muted">
              Browse used and second hand cars, bikes, and tractors across major cities and districts.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {POPULAR_LINK_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-line bg-primary-light px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
