import { brand } from '@cg/shared-config';
import {
  generateLandingMetadata,
  LocationCategoryLandingPage,
  type LandingConfig,
} from '@/features/seo/location-category-landing';

const config: LandingConfig = {
  path: '/used-bikes-in-bilaspur',
  categoryName: 'Bikes',
  categorySlug: 'bikes',
  districtName: 'Bilaspur',
  districtSlug: 'bilaspur',
  h1: 'Used Bikes in Bilaspur',
  secondaryKeyword: 'Second Hand Bikes in Bilaspur',
  intro:
    'Find verified used and second hand bikes in Bilaspur with clear pricing, km history, model year, and fuel details. Compare top options in one place and connect instantly with support.',
  title: `Used & Second Hand Bikes in Bilaspur | Verified Listings | ${brand.name}`,
  description:
    'Discover verified used and second hand bikes in Bilaspur, Chhattisgarh. Compare price, km driven, and model year, then contact quickly on CG Auto Mart.',
  nearbyLinks: [
    { href: '/used-bikes-in-raipur', label: 'Used Bikes in Raipur' },
    { href: '/used-cars-in-bilaspur', label: 'Used Cars in Bilaspur' },
    { href: '/used-tractors-in-mahasamund', label: 'Used Tractors in Mahasamund' },
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
      question: 'Which used or second hand bike segment is popular in Bilaspur?',
      answer:
        'Daily commute bikes with good mileage are usually in high demand, especially reliable models with clean ownership and service records.',
    },
    {
      question: 'How can I compare bikes quickly?',
      answer:
        'Check year, km driven, condition, and ownership first. Then shortlist 2-3 options and contact immediately for faster closure.',
    },
    {
      question: 'Can I sell my bike here as well?',
      answer:
        'Yes, you can list your bike on the Sell page and reach local buyers across Chhattisgarh.',
    },
  ],
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<'/used-bikes-in-bilaspur'>) {
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

export default async function UsedBikesInBilaspurPage(props: PageProps<'/used-bikes-in-bilaspur'>) {
  const searchParams = await props.searchParams;
  return <LocationCategoryLandingPage config={config} searchParams={searchParams} />;
}
