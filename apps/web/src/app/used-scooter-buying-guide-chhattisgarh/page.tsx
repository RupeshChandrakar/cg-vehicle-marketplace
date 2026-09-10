import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-scooter-buying-guide-chhattisgarh',
  title: `Used Scooter Buying Guide Chhattisgarh | ${brand.name}`,
  description:
    'A practical used scooter buying guide for Chhattisgarh covering mileage, condition, paperwork, and daily commute needs.',
  h1: 'Used Scooter Buying Guide for Chhattisgarh',
  intro:
    'Used scooters are a strong choice for short commutes and low running cost. This guide helps Chhattisgarh buyers focus on the checks that matter most before buying.',
  sections: [
    {
      title: 'Look at daily-use condition',
      body:
        'Check the seat, tyres, brakes, battery, and starter response. For scooter buyers, comfort and easy handling often matter more than top speed.',
    },
    {
      title: 'Mileage and maintenance matter together',
      body:
        'A scooter with good mileage is valuable only if it has clean service history and does not need immediate repairs. Review both at the same time.',
    },
    {
      title: 'Verify ownership details',
      body:
        'Match the registration details, insurance, and seller identity before payment. Clear paperwork protects you from future transfer problems.',
    },
  ],
  faqs: [
    {
      question: 'Is a used scooter good for city commuting?',
      answer:
        'Yes, especially when you want low fuel cost, easy parking, and simple maintenance for daily travel.',
    },
    {
      question: 'Should I check battery and brakes first?',
      answer:
        'Yes. Battery health and brake response are two of the most useful practical checks on a used scooter.',
    },
    {
      question: 'Can this guide help with second hand scooter searches too?',
      answer:
        'Yes, the same buying logic applies to both used and second hand scooter searches.',
    },
  ],
  relatedLinks: [
    { href: '/best-mileage-bikes-in-chhattisgarh', label: 'Best Mileage Bikes' },
    { href: '/used-bike-seller-checklist-chhattisgarh', label: 'Bike Seller Checklist' },
    { href: '/used-vehicle-documents-checklist-chhattisgarh', label: 'Documents Checklist' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedScooterBuyingGuidePage() {
  return <GuidePage config={config} />;
}
