import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/best-second-hand-family-cars-in-chhattisgarh',
  title: `Best Second Hand Family Cars in Chhattisgarh | ${brand.name}`,
  description:
    'Find practical second hand family car buying advice for Chhattisgarh, including space, comfort, and ownership factors.',
  h1: 'Best Second Hand Family Cars in Chhattisgarh',
  intro:
    'A good family car should be safe, comfortable, and affordable to maintain. This guide helps buyers in Chhattisgarh compare second hand family cars with a practical checklist.',
  sections: [
    {
      title: 'What family buyers should prioritize',
      body:
        'Look at seating comfort, boot space, fuel efficiency, safety features, and maintenance cost before deciding. A slightly older but well-kept car can be better than a newer but neglected one.',
    },
    {
      title: 'City and highway use balance',
      body:
        'For mostly city driving, compact and easy-to-park options work well. If the family travels on highways often, choose a car with stronger comfort, stability, and enough cabin space.',
    },
    {
      title: 'Budget discipline',
      body:
        'Keep some budget aside for registration transfer, immediate servicing, insurance renewal, and small repairs after purchase so the car feels dependable from day one.',
    },
  ],
  faqs: [
    {
      question: 'What is the best type of second hand car for a family?',
      answer:
        'A practical sedan or compact SUV with good rear seat comfort, boot space, and easy maintenance usually works best for family use.',
    },
    {
      question: 'Should I focus only on low price?',
      answer:
        'No. Low price is useful, but condition, service history, and maintenance costs matter more for a family car.',
    },
    {
      question: 'Can I compare listings from nearby cities too?',
      answer:
        'Yes, comparing nearby city inventory often improves your chances of finding a better match for family usage and budget.',
    },
  ],
  relatedLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-cars-in-bilaspur', label: 'Used Cars in Bilaspur' },
    { href: '/used-cars-in-durg', label: 'Used Cars in Durg' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function BestSecondHandFamilyCarsPage() {
  return <GuidePage config={config} />;
}
