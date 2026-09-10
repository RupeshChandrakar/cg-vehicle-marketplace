import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-car-vs-second-hand-car-in-chhattisgarh',
  title: `Used Car vs Second Hand Car in Chhattisgarh | ${brand.name}`,
  description:
    'Compare used car and second hand car search intent, pricing, and buying approach for Chhattisgarh buyers.',
  h1: 'Used Car vs Second Hand Car in Chhattisgarh',
  intro:
    'Most buyers mean the same thing when they search both phrases, but the wording can reflect different intent. This comparison explains how to choose the right listing and avoid confusion.',
  sections: [
    {
      title: 'How the terms are used',
      body:
        'Used car and second hand car often point to the same inventory. The real difference is usually in buyer mindset, not in the vehicle itself.',
    },
    {
      title: 'What matters more than the wording',
      body:
        'Focus on condition, mileage, papers, service history, and total ownership cost. That gives a better decision than chasing keyword labels.',
    },
    {
      title: 'How to search smarter',
      body:
        'Use both phrases when browsing inventory so you do not miss a good listing. Then filter by district, budget, and vehicle type to narrow the results quickly.',
    },
  ],
  faqs: [
    {
      question: 'Is there a real difference between used and second hand cars?',
      answer:
        'In most marketplaces the terms are interchangeable, though some sellers prefer one phrase over the other.',
    },
    {
      question: 'Which search term should I use first?',
      answer:
        'Use both. It improves the chances of finding all relevant listings and helps you compare inventory more widely.',
    },
    {
      question: 'Does this comparison help SEO as well as buyers?',
      answer:
        'Yes. It covers an informational comparison query while supporting the broader used-vehicle topic cluster.',
    },
  ],
  relatedLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-vehicle-documents-checklist-chhattisgarh', label: 'Documents Checklist' },
    { href: '/best-second-hand-family-cars-in-chhattisgarh', label: 'Family Car Guide' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedCarVsSecondHandCarPage() {
  return <GuidePage config={config} />;
}
