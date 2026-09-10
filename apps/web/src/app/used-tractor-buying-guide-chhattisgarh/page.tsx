import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-tractor-buying-guide-chhattisgarh',
  title: `Used Tractor Buying Guide Chhattisgarh | ${brand.name}`,
  description:
    'A practical used tractor buying guide for Chhattisgarh farmers covering engine, tyres, hydraulics, papers, and price checks.',
  h1: 'Used Tractor Buying Guide for Chhattisgarh',
  intro:
    'Buying a tractor is a business decision as much as a vehicle decision. This guide helps Chhattisgarh buyers review working condition, paperwork, and value before they pay.',
  sections: [
    {
      title: 'Check the work condition first',
      body:
        'Start the tractor, observe engine noise, inspect tyre wear, and test the hydraulic lift and steering response. A tractor used for heavy field work should still feel controlled and usable.',
    },
    {
      title: 'Review service and usage history',
      body:
        'Ask what type of work the tractor did, how often it was serviced, and whether major parts were replaced. That history is often more useful than the seller description.',
    },
    {
      title: 'Verify documents and ownership',
      body:
        'Match the registration and ownership details carefully, especially if the tractor was used across districts or passed through multiple owners.',
    },
  ],
  faqs: [
    {
      question: 'Is a used tractor a good option for small farms?',
      answer:
        'Yes, if the tractor is mechanically healthy, has clear papers, and fits the work size you need.',
    },
    {
      question: 'Should I inspect hydraulic lift performance?',
      answer:
        'Yes. Hydraulic lift and steering feel are important indicators of overall tractor health and future maintenance cost.',
    },
    {
      question: 'Can I compare tractors and other used vehicles on the same site?',
      answer:
        'Yes, the same marketplace supports tractors, cars, and bikes, so you can compare inventory by category and district.',
    },
  ],
  relatedLinks: [
    { href: '/used-tractors-in-mahasamund', label: 'Used Tractors in Mahasamund' },
    { href: '/used-vehicle-documents-checklist-chhattisgarh', label: 'Documents Checklist' },
    { href: '/how-to-sell-used-vehicle-in-chhattisgarh', label: 'Seller Guide' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedTractorBuyingGuidePage() {
  return <GuidePage config={config} />;
}
