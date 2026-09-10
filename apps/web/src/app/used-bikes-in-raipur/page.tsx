import { brand } from '@cg/shared-config';
import {
  generateLandingMetadata,
  LocationCategoryLandingPage,
  type LandingConfig,
} from '@/features/seo/location-category-landing';

const config: LandingConfig = {
  path: '/used-bikes-in-raipur',
  categoryName: 'Bikes',
  categorySlug: 'bikes',
  districtName: 'Raipur',
  districtSlug: 'raipur',
  h1: 'Used Bikes in Raipur',
  secondaryKeyword: 'Second Hand Bikes in Raipur',
  intro:
    'Browse verified used and second hand bikes in Raipur with details on price, model year, km driven, and condition. Compare top local options and contact instantly to close faster.',
  title: `Used & Second Hand Bikes in Raipur | Verified Listings | ${brand.name}`,
  description:
    'Find verified used and second hand bikes in Raipur, Chhattisgarh. Compare price, condition, and km driven with quick contact support on CG Auto Mart.',
  nearbyLinks: [
    { href: '/used-bikes-in-bilaspur', label: 'Used Bikes in Bilaspur' },
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-cars-in-durg', label: 'Used Cars in Durg' },
  ],
  priceBands: [
    { label: 'Under 50k', maxPrice: 50000 },
    { label: '50k to 75k', minPrice: 50000, maxPrice: 75000 },
    { label: '75k to 1 Lakh', minPrice: 75000, maxPrice: 100000 },
    { label: '1 to 1.5 Lakhs', minPrice: 100000, maxPrice: 150000 },
    { label: 'Above 1.5 Lakhs', minPrice: 150000 },
  ],
  faqs: [
    {
      question: 'Which used bikes are best for city commute in Raipur?',
      answer:
        'Reliable commuter bikes with good mileage, lower maintenance, and clean ownership records are usually preferred for city usage.',
    },
    {
      question: 'How fast can I connect after shortlisting?',
      answer:
        'Use Contact on the listing to submit details or call directly using the provided number option for quick response.',
    },
    {
      question: 'Can I compare multiple bikes before contacting?',
      answer:
        'Yes, shortlist based on year, km driven, and condition, then connect for the best-matched options.',
    },
  ],
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<'/used-bikes-in-raipur'>) {
  const searchParams = await props.searchParams;
  const hasPriceFilter = Boolean(
    firstValue(searchParams.minPrice) || firstValue(searchParams.maxPrice),
  );

  const metadata = await generateLandingMetadata(config);

  if (!hasPriceFilter) {
    return metadata;
  }

  return {
    ...metadata,
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  };
}

export default async function UsedBikesInRaipurPage(props: PageProps<'/used-bikes-in-raipur'>) {
  const searchParams = await props.searchParams;
  return <LocationCategoryLandingPage config={config} searchParams={searchParams} />;
}
