import { brand } from '@cg/shared-config';
import {
  generateLandingMetadata,
  LocationCategoryLandingPage,
  type LandingConfig,
} from '@/features/seo/location-category-landing';

const config: LandingConfig = {
  path: '/used-cars-in-durg',
  categoryName: 'Cars',
  categorySlug: 'cars',
  districtName: 'Durg',
  districtSlug: 'durg',
  h1: 'Used Cars in Durg',
  secondaryKeyword: 'Second Hand Cars in Durg',
  intro:
    'Find verified used and second hand cars in Durg with complete details on price, km driven, fuel type, and model year. Compare multiple listings and connect quickly to avoid missing good deals.',
  title: `Used & Second Hand Cars in Durg | Verified Listings | ${brand.name}`,
  description:
    'Explore verified used and second hand cars in Durg, Chhattisgarh. Check price, year, and condition, then contact quickly on CG Auto Mart.',
  nearbyLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-cars-in-bilaspur', label: 'Used Cars in Bilaspur' },
    { href: '/used-bikes-in-bilaspur', label: 'Used Bikes in Bilaspur' },
  ],
  priceBands: [
    { label: 'Under 3 Lakhs', maxPrice: 300000 },
    { label: '3 to 5 Lakhs', minPrice: 300000, maxPrice: 500000 },
    { label: '5 to 7 Lakhs', minPrice: 500000, maxPrice: 700000 },
    { label: '7 to 10 Lakhs', minPrice: 700000, maxPrice: 1000000 },
    { label: 'Above 10 Lakhs', minPrice: 1000000 },
  ],
  faqs: [
    {
      question: 'What is a safe way to evaluate a used or second hand car in Durg?',
      answer:
        'Check ownership count, km consistency, service records, and overall condition. Compare 2-3 similar listings before final contact.',
    },
    {
      question: 'Do I get verified listing signals on this page?',
      answer:
        'Yes, listing cards and detail pages show trust cues to help improve buyer confidence.',
    },
    {
      question: 'Can sellers from Durg also list here?',
      answer:
        'Yes, local sellers can list vehicles through the Sell page to reach district-level buyers faster.',
    },
  ],
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<'/used-cars-in-durg'>) {
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

export default async function UsedCarsInDurgPage(props: PageProps<'/used-cars-in-durg'>) {
  const searchParams = await props.searchParams;
  return <LocationCategoryLandingPage config={config} searchParams={searchParams} />;
}
