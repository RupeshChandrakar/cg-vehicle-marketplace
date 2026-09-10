import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-scooter-inspection-checklist-chhattisgarh',
  title: `Used Scooter Inspection Checklist Chhattisgarh | ${brand.name}`,
  description:
    'A used scooter inspection checklist for Chhattisgarh buyers covering body condition, brakes, tyres, battery, and documents.',
  h1: 'Used Scooter Inspection Checklist for Chhattisgarh',
  intro:
    'A quick inspection can prevent expensive repairs later. Use this checklist to review the scooter before you make an offer or pay a token amount.',
  sections: [
    {
      title: 'Body and ride quality',
      body:
        'Check for visible damage, rattles, uneven tyre wear, and whether the scooter rolls smoothly. These are quick signs of how the scooter has been used.',
    },
    {
      title: 'Battery, brakes, and start-up',
      body:
        'Confirm that the scooter starts reliably, the battery holds charge, and the brakes feel firm and predictable during a short test ride.',
    },
    {
      title: 'Documents and ownership',
      body:
        'Review registration, insurance, and seller identity. If the physical scooter and the paperwork do not match, pause and verify before proceeding.',
    },
  ],
  faqs: [
    {
      question: 'Do scooters need the same paperwork checks as bikes?',
      answer:
        'Yes. Ownership and registration checks are equally important for scooters and other two-wheelers.',
    },
    {
      question: 'Is a short ride enough for inspection?',
      answer:
        'A short ride helps, but it should be paired with a visual check and a paperwork review.',
    },
    {
      question: 'Can I use this checklist for second hand scooters too?',
      answer:
        'Yes, it works for both used and second hand scooters.',
    },
  ],
  relatedLinks: [
    { href: '/used-scooter-buying-guide-chhattisgarh', label: 'Scooter Buying Guide' },
    { href: '/used-vehicle-documents-checklist-chhattisgarh', label: 'Documents Checklist' },
    { href: '/used-bike-seller-checklist-chhattisgarh', label: 'Bike Seller Checklist' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedScooterInspectionChecklistPage() {
  return <GuidePage config={config} />;
}
