import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';
import { VehicleDocumentsChecklistTabs } from '@/features/seo/vehicle-documents-checklist-tabs';

const config: GuideConfig = {
  path: '/used-vehicle-documents-checklist-chhattisgarh',
  title: `Used Vehicle Documents Checklist Chhattisgarh | ${brand.name}`,
  description:
    'Learn the essential documents to verify before buying a used car, bike, or tractor in Chhattisgarh.',
  h1: 'Used Vehicle Documents Checklist for Chhattisgarh',
  intro:
    'Buying a used vehicle becomes much safer when documents are checked properly. This guide lists the core papers and red flags buyers in Chhattisgarh should review before paying.',
  sections: [
    {
      title: 'Documents to verify first',
      body:
        'Check registration certificate, insurance, pollution certificate where applicable, tax details, owner identity, and matching engine/chassis details before you commit to the vehicle.',
    },
    {
      title: 'What to confirm during inspection',
      body:
        'Compare the seller story with the papers, inspect whether the vehicle has duplicate keys and service records, and make sure the physical condition matches the claimed year and usage.',
    },
    {
      title: 'When to stop the deal',
      body:
        'If the seller avoids sharing documents, the registration details do not match, or the vehicle history looks unclear, pause the deal and verify before paying any token amount.',
    },
  ],
  faqs: [
    {
      question: 'Which document matters most while buying a used vehicle?',
      answer:
        'The registration certificate matters most because it confirms ownership and core vehicle identity. Insurance and service records should support it.',
    },
    {
      question: 'Should I check the number on the vehicle itself?',
      answer:
        'Yes, always compare the chassis and engine numbers on the vehicle with the documents before final payment.',
    },
    {
      question: 'Can I use this checklist for bikes and tractors too?',
      answer:
        'Yes, the same ownership and identity checks are useful for cars, bikes, scooters, and tractors, with category-specific papers added where needed.',
    },
  ],
  relatedLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-bikes-in-bilaspur', label: 'Used Bikes in Bilaspur' },
    { href: '/used-tractors-in-mahasamund', label: 'Used Tractors in Mahasamund' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedVehicleDocumentsChecklistPage() {
  return <GuidePage config={config} extraSection={<VehicleDocumentsChecklistTabs />} />;
}
