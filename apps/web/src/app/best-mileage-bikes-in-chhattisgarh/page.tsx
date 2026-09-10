import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/best-mileage-bikes-in-chhattisgarh',
  title: `Best Mileage Bikes in Chhattisgarh | ${brand.name}`,
  description:
    'Compare practical second hand and used bikes with strong mileage and easy maintenance for Chhattisgarh roads.',
  h1: 'Best Mileage Bikes in Chhattisgarh',
  intro:
    'Mileage matters when daily commuting is the main use case. This guide helps buyers compare used and second hand bikes that balance efficiency, comfort, and running cost.',
  sections: [
    {
      title: 'Mileage is only one part of the decision',
      body:
        'A bike with strong mileage is useful, but ownership cost, tyre condition, chain health, and service history matter just as much. Choose a bike that is efficient and also easy to maintain.',
    },
    {
      title: 'Best use cases',
      body:
        'If the bike is for daily office travel, prioritize lightweight handling and comfort. For mixed town and highway usage, look for a stable ride and enough engine flexibility.',
    },
    {
      title: 'How to shortlist quickly',
      body:
        'Filter by budget, fuel efficiency, year, and km driven. Then shortlist only the cleanest options and contact the seller immediately before the good ones disappear.',
    },
  ],
  faqs: [
    {
      question: 'What mileage should I expect from a used bike?',
      answer:
        'Mileage depends on riding style, engine size, and maintenance, so compare similar bikes rather than using one fixed number.',
    },
    {
      question: 'Are used commuter bikes better than sporty bikes for mileage?',
      answer:
        'Usually yes. Commuter bikes are generally lighter and tuned for efficiency and lower running cost.',
    },
    {
      question: 'Can these tips help for second hand bikes too?',
      answer:
        'Yes, the same mileage and maintenance logic applies to both used and second hand bikes.',
    },
  ],
  relatedLinks: [
    { href: '/used-bikes-in-raipur', label: 'Used Bikes in Raipur' },
    { href: '/used-bikes-in-bilaspur', label: 'Used Bikes in Bilaspur' },
    { href: '/used-bikes-in-durg', label: 'Used Bikes in Durg' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function BestMileageBikesPage() {
  return <GuidePage config={config} />;
}
