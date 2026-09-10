import { brand } from '@cg/shared-config';
import {
  generateLandingMetadata,
  LocationCategoryLandingPage,
  type LandingConfig,
} from '@/features/seo/location-category-landing';

const config: LandingConfig = {
  path: '/used-tractors-in-mahasamund',
  categoryName: 'Tractors',
  categorySlug: 'tractors',
  districtName: 'Mahasamund',
  districtSlug: 'mahasamund',
  h1: 'Used Tractors in Mahasamund',
  secondaryKeyword: 'Second Hand Tractors in Mahasamund',
  intro:
    'Browse trusted used and second hand tractors in Mahasamund for farming and load work. Compare model year, condition, PTO and lifting specs where available, and contact quickly for local deals.',
  title: `Used & Second Hand Tractors in Mahasamund | Verified Listings | ${brand.name}`,
  description:
    'Find verified used and second hand tractors in Mahasamund, Chhattisgarh. Compare key specs, condition, and price to choose the right tractor on CG Auto Mart.',
  nearbyLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-bikes-in-bilaspur', label: 'Used Bikes in Bilaspur' },
    { href: '/?category=tractors', label: 'All Tractors in Chhattisgarh' },
  ],
  priceBands: [
    { label: 'Under 2 Lakhs', maxPrice: 200000 },
    { label: '2 to 3 Lakhs', minPrice: 200000, maxPrice: 300000 },
    { label: '3 to 4 Lakhs', minPrice: 300000, maxPrice: 400000 },
    { label: '4 to 5 Lakhs', minPrice: 400000, maxPrice: 500000 },
    { label: 'Above 5 Lakhs', minPrice: 500000 },
  ],
  faqs: [
    {
      question: 'What should I check before buying a used or second hand tractor?',
      answer:
        'Check engine condition, hydraulic response, PTO output, tyre wear, ownership records, and maintenance history before finalizing.',
    },
    {
      question: 'Are tractor listings relevant for nearby areas too?',
      answer:
        'Yes, Mahasamund listings often include options useful for nearby agricultural routes and district movement.',
    },
    {
      question: 'How do I contact after shortlisting a tractor?',
      answer:
        'Open the listing and use Contact to send details, or use direct call option for faster response.',
    },
  ],
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<'/used-tractors-in-mahasamund'>) {
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

export default async function UsedTractorsInMahasamundPage(
  props: PageProps<'/used-tractors-in-mahasamund'>,
) {
  const searchParams = await props.searchParams;
  return <LocationCategoryLandingPage config={config} searchParams={searchParams} />;
}
