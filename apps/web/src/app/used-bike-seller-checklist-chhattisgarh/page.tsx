import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-bike-seller-checklist-chhattisgarh',
  title: `Used Bike Seller Checklist Chhattisgarh | ${brand.name}`,
  description:
    'A seller checklist for used bikes in Chhattisgarh covering pricing, photos, documents, and response handling.',
  h1: 'Used Bike Seller Checklist for Chhattisgarh',
  intro:
    'A strong bike listing gets more serious calls and less wasted time. Use this checklist before you publish a used bike for sale in Chhattisgarh.',
  sections: [
    {
      title: 'Prepare the bike for listing',
      body:
        'Wash the bike, check tyre condition, note service work, and make sure the photos show the bike clearly from both sides and from the front and back.',
    },
    {
      title: 'Set honest details',
      body:
        'Mention year, km driven, service record, mileage condition, and any repair history. Honest details reduce low-quality enquiries and build trust faster.',
    },
    {
      title: 'Keep transfer papers ready',
      body:
        'Have registration and insurance details ready so a serious buyer can move quickly after inspection.',
    },
  ],
  faqs: [
    {
      question: 'What makes a used bike listing perform better?',
      answer:
        'Clean photos, accurate details, realistic pricing, and a quick reply to calls or messages usually perform best.',
    },
    {
      question: 'Should I include small scratches in the listing?',
      answer:
        'Yes. Clear disclosure saves time and improves buyer confidence.',
    },
    {
      question: 'Can I use the same approach for scooters too?',
      answer:
        'Yes, the same seller checklist works for scooters and other two-wheelers with small adjustments to the details.',
    },
  ],
  relatedLinks: [
    { href: '/used-bikes-in-raipur', label: 'Used Bikes in Raipur' },
    { href: '/used-bikes-in-bilaspur', label: 'Used Bikes in Bilaspur' },
    { href: '/best-mileage-bikes-in-chhattisgarh', label: 'Mileage Bike Guide' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedBikeSellerChecklistPage() {
  return <GuidePage config={config} />;
}
