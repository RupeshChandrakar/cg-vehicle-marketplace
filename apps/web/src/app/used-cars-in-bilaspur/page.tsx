import { brand } from '@cg/shared-config';
import {
  generateLandingMetadata,
  LocationCategoryLandingPage,
  type LandingConfig,
} from '@/features/seo/location-category-landing';

const config: LandingConfig = {
  path: '/used-cars-in-bilaspur',
  categoryName: 'Cars',
  categorySlug: 'cars',
  districtName: 'Bilaspur',
  districtSlug: 'bilaspur',
  h1: 'Used Cars in Bilaspur',
  secondaryKeyword: 'Second Hand Cars in Bilaspur',
  intro:
    'Discover verified used and second hand cars in Bilaspur with transparent pricing, model year, km driven, and ownership details. Compare local options and contact quickly for a confident purchase.',
  title: `Used & Second Hand Cars in Bilaspur | Verified Listings | ${brand.name}`,
  description:
    'Browse verified used and second hand cars in Bilaspur, Chhattisgarh. Compare price, year, and km driven, then connect instantly on CG Auto Mart.',
  nearbyLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-cars-in-durg', label: 'Used Cars in Durg' },
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
      question: 'How to shortlist used or second hand cars in Bilaspur quickly?',
      answer:
        'Use budget, fuel type, and year as the first filter. Then compare km driven, owner details, and listing condition before contacting.',
    },
    {
      question: 'Are listings in Bilaspur updated regularly?',
      answer:
        'Yes, latest listings are surfaced first so buyers can discover fresh options earlier.',
    },
    {
      question: 'Can I contact support for faster response?',
      answer:
        'Yes, open a listing and use Contact to share details or directly call using the provided number option.',
    },
  ],
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<'/used-cars-in-bilaspur'>) {
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

export default async function UsedCarsInBilaspurPage(props: PageProps<'/used-cars-in-bilaspur'>) {
  const searchParams = await props.searchParams;
  return <LocationCategoryLandingPage config={config} searchParams={searchParams} />;
}
