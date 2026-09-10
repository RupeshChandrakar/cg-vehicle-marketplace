import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/how-to-sell-used-vehicle-in-chhattisgarh',
  title: `How to Sell Used Vehicle in Chhattisgarh | ${brand.name}`,
  description:
    'Learn how to sell a used car, bike, or tractor in Chhattisgarh faster with the right price, photos, and documents.',
  h1: 'How to Sell a Used Vehicle in Chhattisgarh',
  intro:
    'A clean listing and clear communication usually sell faster than a vague ad. This guide covers pricing, presentation, and document preparation for sellers in Chhattisgarh.',
  sections: [
    {
      title: 'Set the right asking price',
      body:
        'Compare similar listings by model, year, km driven, and condition. A realistic price gets more calls and gives buyers confidence that the listing is genuine.',
    },
    {
      title: 'Prepare strong photos and details',
      body:
        'Take bright photos from multiple angles, mention service history, and be honest about wear or repairs. Better information usually means better leads.',
    },
    {
      title: 'Keep documents ready',
      body:
        'Have the registration, insurance, and transfer-related documents ready so serious buyers can move quickly without delays.',
    },
  ],
  faqs: [
    {
      question: 'What helps a used vehicle sell faster?',
      answer:
        'Good pricing, clear photos, honest details, and quick response to enquiries usually help the most.',
    },
    {
      question: 'Should I hide small issues from buyers?',
      answer:
        'No. Being honest about small issues prevents wasted time and helps you get serious buyers.',
    },
    {
      question: 'Is this guide useful for bikes and tractors too?',
      answer:
        'Yes, the same listing and document preparation advice works across cars, bikes, scooters, and tractors.',
    },
  ],
  relatedLinks: [
    { href: '/sell', label: 'Sell on CG Auto Mart' },
    { href: '/used-vehicle-documents-checklist-chhattisgarh', label: 'Documents Checklist' },
    { href: '/best-mileage-bikes-in-chhattisgarh', label: 'Mileage Bike Guide' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function HowToSellUsedVehiclePage() {
  return <GuidePage config={config} />;
}
