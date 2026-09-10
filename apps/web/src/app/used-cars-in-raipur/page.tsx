import { brand } from '@cg/shared-config';
import {
  generateLandingMetadata,
  LocationCategoryLandingPage,
  type LandingConfig,
} from '@/features/seo/location-category-landing';

const config: LandingConfig = {
  path: '/used-cars-in-raipur',
  categoryName: 'Cars',
  categorySlug: 'cars',
  districtName: 'Raipur',
  districtSlug: 'raipur',
  h1: 'Used Cars in Raipur',
  secondaryKeyword: 'Second Hand Cars in Raipur',
  intro:
    'Explore verified used and second hand cars in Raipur with transparent details on price, model year, km driven, and ownership. Compare local listings and contact quickly for the right deal.',
  title: `Used & Second Hand Cars in Raipur | Verified Listings | ${brand.name}`,
  description:
    'Browse verified used and second hand cars in Raipur, Chhattisgarh. Compare price, km driven, year, and connect with local support on CG Auto Mart.',
  nearbyLinks: [
    { href: '/used-cars-in-bilaspur', label: 'Used Cars in Bilaspur' },
    { href: '/used-cars-in-durg', label: 'Used Cars in Durg' },
    { href: '/used-bikes-in-raipur', label: 'Used Bikes in Raipur' },
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
      question: 'How do I choose the right used or second hand car in Raipur?',
      answer:
        'Shortlist by budget, fuel type, and usage first. Then compare model year, km driven, service history, and ownership details before contacting.',
    },
    {
      question: 'Are listings verified on CG Auto Mart?',
      answer:
        'Yes, the platform highlights verified listings and trust details to help buyers take safer decisions.',
    },
    {
      question: 'Can I directly contact for the vehicle?',
      answer:
        'Yes, use Contact on the listing page to share your details or call directly using the provided number option.',
    },
  ],
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<'/used-cars-in-raipur'>) {
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

export default async function UsedCarsInRaipurPage(props: PageProps<'/used-cars-in-raipur'>) {
  const searchParams = await props.searchParams;
  return <LocationCategoryLandingPage config={config} searchParams={searchParams} />;
}
