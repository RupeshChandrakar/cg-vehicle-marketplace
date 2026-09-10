import { notFound } from 'next/navigation';
import { brand } from '@cg/shared-config';
import {
  generateLandingMetadata,
  LocationCategoryLandingPage,
  type LandingConfig,
} from '@/features/seo/location-category-landing';
import {
  getNearbyLinksForLocation,
  getProgrammaticLandingSlugs,
  parseLandingSlug,
} from '@/features/seo/landing-keywords';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getProgrammaticLandingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const parsed = parseLandingSlug(slug);
  if (!parsed) return {};

  const config: LandingConfig = {
    path: `/${parsed.slug}`,
    categoryName: parsed.categoryName,
    categorySlug: parsed.categorySlug,
    districtName: parsed.locationName,
    districtSlug: parsed.districtSlug,
    h1: `${parsed.intentLabel} ${parsed.categoryName} in ${parsed.locationName}`,
    secondaryKeyword: parsed.oppositeKeyword,
    intro: `Browse verified ${parsed.intent.toLowerCase()} ${parsed.categoryTerm} in ${parsed.locationName}, Chhattisgarh. Compare price, model year, km driven, and contact quickly with local support.`,
    title: `${parsed.intentLabel} ${parsed.categoryName} in ${parsed.locationName} | Verified Listings | ${brand.name}`,
    description: `Find verified ${parsed.intent.toLowerCase()} ${parsed.categoryTerm} in ${parsed.locationName}, Chhattisgarh. Compare listings and connect instantly on ${brand.name}.`,
    nearbyLinks: getNearbyLinksForLocation(parsed.locationSlug, parsed.categoryTerm),
    faqs: [
      {
        question: `How to choose the right ${parsed.intent.toLowerCase()} ${parsed.categoryTerm.slice(0, -1)} in ${parsed.locationName}?`,
        answer:
          'Shortlist by budget and usage first, then compare model year, km driven, condition, and ownership details before contacting.',
      },
      {
        question: `Are ${parsed.categoryTerm} listings in ${parsed.locationName} verified?`,
        answer:
          'Yes, listing pages include trust cues and key details to help buyers take safer decisions.',
      },
      {
        question: 'How can I contact quickly after shortlisting?',
        answer:
          'Open the listing and use Contact to submit details or call directly through the provided call option.',
      },
    ],
  };

  return generateLandingMetadata(config);
}

export default async function ProgrammaticLandingPage({ params }: Props) {
  const { slug } = await params;
  const parsed = parseLandingSlug(slug);
  if (!parsed) notFound();

  const config: LandingConfig = {
    path: `/${parsed.slug}`,
    categoryName: parsed.categoryName,
    categorySlug: parsed.categorySlug,
    districtName: parsed.locationName,
    districtSlug: parsed.districtSlug,
    h1: `${parsed.intentLabel} ${parsed.categoryName} in ${parsed.locationName}`,
    secondaryKeyword: parsed.oppositeKeyword,
    intro: `Browse verified ${parsed.intent.toLowerCase()} ${parsed.categoryTerm} in ${parsed.locationName}, Chhattisgarh. Compare price, model year, km driven, and contact quickly with local support.`,
    title: `${parsed.intentLabel} ${parsed.categoryName} in ${parsed.locationName} | Verified Listings | ${brand.name}`,
    description: `Find verified ${parsed.intent.toLowerCase()} ${parsed.categoryTerm} in ${parsed.locationName}, Chhattisgarh. Compare listings and connect instantly on ${brand.name}.`,
    nearbyLinks: getNearbyLinksForLocation(parsed.locationSlug, parsed.categoryTerm),
    faqs: [
      {
        question: `How to choose the right ${parsed.intent.toLowerCase()} ${parsed.categoryTerm.slice(0, -1)} in ${parsed.locationName}?`,
        answer:
          'Shortlist by budget and usage first, then compare model year, km driven, condition, and ownership details before contacting.',
      },
      {
        question: `Are ${parsed.categoryTerm} listings in ${parsed.locationName} verified?`,
        answer:
          'Yes, listing pages include trust cues and key details to help buyers take safer decisions.',
      },
      {
        question: 'How can I contact quickly after shortlisting?',
        answer:
          'Open the listing and use Contact to submit details or call directly through the provided call option.',
      },
    ],
  };

  return <LocationCategoryLandingPage config={config} />;
}
