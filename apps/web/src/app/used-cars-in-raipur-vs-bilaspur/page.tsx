import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-cars-in-raipur-vs-bilaspur',
  title: `Used Cars in Raipur vs Bilaspur | ${brand.name}`,
  description:
    'Compare used car search intent, inventory style, and buying approach between Raipur and Bilaspur in Chhattisgarh.',
  h1: 'Used Cars in Raipur vs Bilaspur',
  intro:
    'Buyers often compare nearby cities to widen inventory and improve value. This comparison helps you decide how to search between Raipur and Bilaspur.',
  sections: [
    {
      title: 'Why compare these two cities',
      body:
        'Raipur usually gives the widest selection, while Bilaspur may offer a different mix of price points and seller profiles. Comparing both can improve your shortlist.',
    },
    {
      title: 'How to choose the right city search',
      body:
        'Start with the city closest to you, then compare the other city if the first search does not produce the right price, year, or condition.',
    },
    {
      title: 'What should stay consistent',
      body:
        'Regardless of city, check papers, condition, service history, and total ownership cost before moving forward.',
    },
  ],
  faqs: [
    {
      question: 'Which city is better for used cars in Chhattisgarh?',
      answer:
        'The better city depends on budget, vehicle type, and the current listings available at the time you search.',
    },
    {
      question: 'Should I compare more than one city?',
      answer:
        'Yes, especially if you want a better price or more options in the same category.',
    },
    {
      question: 'Does this page help SEO as well?',
      answer:
        'Yes. It supports a comparison-style query and strengthens the content cluster around used cars in Chhattisgarh.',
    },
  ],
  relatedLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-cars-in-bilaspur', label: 'Used Cars in Bilaspur' },
    { href: '/used-car-inspection-checklist-chhattisgarh', label: 'Inspection Checklist' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedCarsRaipurVsBilaspurPage() {
  return <GuidePage config={config} />;
}
