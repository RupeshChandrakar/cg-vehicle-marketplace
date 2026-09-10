type CategoryConfig = {
  term: 'cars' | 'bikes' | 'tractors';
  singular: 'car' | 'bike' | 'tractor';
  categorySlug: 'cars' | 'bikes' | 'tractors';
  categoryName: 'Cars' | 'Bikes' | 'Tractors';
};

type Intent = 'used' | 'second-hand';

export type LandingLocation = {
  name: string;
  slug: string;
  districtSlug: string;
};

export const EXPLICIT_LANDING_SLUGS = new Set<string>([
  'used-cars-in-raipur',
  'used-cars-in-bilaspur',
  'used-cars-in-durg',
  'used-bikes-in-raipur',
  'used-bikes-in-bilaspur',
  'used-tractors-in-mahasamund',
]);

const CATEGORIES: CategoryConfig[] = [
  { term: 'cars', singular: 'car', categorySlug: 'cars', categoryName: 'Cars' },
  { term: 'bikes', singular: 'bike', categorySlug: 'bikes', categoryName: 'Bikes' },
  { term: 'tractors', singular: 'tractor', categorySlug: 'tractors', categoryName: 'Tractors' },
];

const INTENTS: Intent[] = ['used', 'second-hand'];

const DISTRICTS: LandingLocation[] = [
  { name: 'Raipur', slug: 'raipur', districtSlug: 'raipur' },
  { name: 'Durg', slug: 'durg', districtSlug: 'durg' },
  { name: 'Bilaspur', slug: 'bilaspur', districtSlug: 'bilaspur' },
  { name: 'Korba', slug: 'korba', districtSlug: 'korba' },
  { name: 'Raigarh', slug: 'raigarh', districtSlug: 'raigarh' },
  { name: 'Jagdalpur', slug: 'jagdalpur', districtSlug: 'jagdalpur' },
  { name: 'Ambikapur', slug: 'ambikapur', districtSlug: 'ambikapur' },
  { name: 'Rajnandgaon', slug: 'rajnandgaon', districtSlug: 'rajnandgaon' },
  { name: 'Dhamtari', slug: 'dhamtari', districtSlug: 'dhamtari' },
  { name: 'Mahasamund', slug: 'mahasamund', districtSlug: 'mahasamund' },
  { name: 'Kanker', slug: 'kanker', districtSlug: 'kanker' },
  { name: 'Kondagaon', slug: 'kondagaon', districtSlug: 'kondagaon' },
  { name: 'Narayanpur', slug: 'narayanpur', districtSlug: 'narayanpur' },
  { name: 'Bijapur', slug: 'bijapur', districtSlug: 'bijapur' },
  { name: 'Dantewada', slug: 'dantewada', districtSlug: 'dantewada' },
  { name: 'Sukma', slug: 'sukma', districtSlug: 'sukma' },
  { name: 'Balod', slug: 'balod', districtSlug: 'balod' },
  { name: 'Bemetara', slug: 'bemetara', districtSlug: 'bemetara' },
  { name: 'Baloda Bazar', slug: 'baloda-bazar', districtSlug: 'baloda-bazar' },
  { name: 'Gariaband', slug: 'gariaband', districtSlug: 'gariaband' },
  { name: 'Mungeli', slug: 'mungeli', districtSlug: 'mungeli' },
  { name: 'Janjgir-Champa', slug: 'janjgir-champa', districtSlug: 'janjgir-champa' },
  { name: 'Koriya', slug: 'koriya', districtSlug: 'koriya' },
  { name: 'Surajpur', slug: 'surajpur', districtSlug: 'surajpur' },
  { name: 'Balrampur', slug: 'balrampur', districtSlug: 'balrampur' },
  { name: 'Jashpur', slug: 'jashpur', districtSlug: 'jashpur' },
  { name: 'Kabirdham', slug: 'kabirdham', districtSlug: 'kabirdham' },
];

const MAIN_CITY_ALIASES: LandingLocation[] = [
  { name: 'Bhilai', slug: 'bhilai', districtSlug: 'durg' },
  { name: 'Chirmiri', slug: 'chirmiri', districtSlug: 'koriya' },
  { name: 'Bhatapara', slug: 'bhatapara', districtSlug: 'baloda-bazar' },
  { name: 'Dongargarh', slug: 'dongargarh', districtSlug: 'rajnandgaon' },
  { name: 'Champa', slug: 'champa', districtSlug: 'janjgir-champa' },
  { name: 'Kawardha', slug: 'kawardha', districtSlug: 'kabirdham' },
  { name: 'Tilda', slug: 'tilda', districtSlug: 'raipur' },
  { name: 'Geedam', slug: 'geedam', districtSlug: 'dantewada' },
];

const ALL_LOCATIONS = [...DISTRICTS, ...MAIN_CITY_ALIASES];

const LOCATION_BY_SLUG = new Map(ALL_LOCATIONS.map((location) => [location.slug, location]));

export type ParsedLanding = {
  slug: string;
  intent: Intent;
  intentLabel: 'Used' | 'Second Hand';
  oppositeKeyword: string;
  categorySlug: CategoryConfig['categorySlug'];
  categoryName: CategoryConfig['categoryName'];
  categoryTerm: CategoryConfig['term'];
  locationName: string;
  locationSlug: string;
  districtSlug: string;
};

export function getProgrammaticLandingSlugs(): string[] {
  const slugs: string[] = [];

  for (const intent of INTENTS) {
    for (const category of CATEGORIES) {
      for (const location of ALL_LOCATIONS) {
        const slug = `${intent}-${category.term}-in-${location.slug}`;
        if (!EXPLICIT_LANDING_SLUGS.has(slug)) {
          slugs.push(slug);
        }
      }
    }
  }

  return slugs;
}

export function parseLandingSlug(slug: string): ParsedLanding | null {
  const match = /^(used|second-hand)-(cars|bikes|tractors)-in-([a-z0-9-]+)$/.exec(slug);
  if (!match) return null;

  const intent = match[1] as Intent;
  const categoryTerm = match[2] as CategoryConfig['term'];
  const locationSlug = match[3];

  const category = CATEGORIES.find((item) => item.term === categoryTerm);
  if (!category) return null;

  const location = LOCATION_BY_SLUG.get(locationSlug);
  if (!location) return null;

  return {
    slug,
    intent,
    intentLabel: intent === 'used' ? 'Used' : 'Second Hand',
    oppositeKeyword:
      intent === 'used'
        ? `Second Hand ${category.categoryName} in ${location.name}`
        : `Used ${category.categoryName} in ${location.name}`,
    categorySlug: category.categorySlug,
    categoryName: category.categoryName,
    categoryTerm: category.term,
    locationName: location.name,
    locationSlug,
    districtSlug: location.districtSlug,
  };
}

export function getNearbyLinksForLocation(currentSlug: string, categoryTerm: string): Array<{ href: string; label: string }> {
  return ALL_LOCATIONS
    .filter((location) => location.slug !== currentSlug)
    .slice(0, 3)
    .map((location) => ({
      href: `/used-${categoryTerm}-in-${location.slug}`,
      label: `Used ${capitalize(categoryTerm)} in ${location.name}`,
    }));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
