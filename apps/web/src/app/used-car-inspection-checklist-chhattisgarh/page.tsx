import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-car-inspection-checklist-chhattisgarh',
  title: `Used Car Inspection Checklist Chhattisgarh | ${brand.name}`,
  description:
    'A practical inspection checklist for used cars in Chhattisgarh covering bodywork, engine, paperwork, and road test checks.',
  h1: 'Used Car Inspection Checklist for Chhattisgarh',
  intro:
    'A proper inspection can save you from expensive surprises after purchase. Use this checklist to review the exterior, interior, mechanical condition, and documents before closing a used car deal.',
  sections: [
    {
      title: 'Exterior and interior checks',
      body:
        'Look for repainting, panel gaps, rust, dashboard warning lights, worn upholstery, and water seepage. A clean-looking car is not always a mechanically healthy car, so inspect carefully.',
    },
    {
      title: 'Mechanical and road test checks',
      body:
        'Start the engine cold, listen for unusual noise, test clutch and brake response, and drive the car on mixed roads to see how it behaves under load.',
    },
    {
      title: 'Paperwork and service history',
      body:
        'Match the service record with the odometer reading, verify ownership documents, and confirm that the car has no unresolved insurance or registration issues.',
    },
  ],
  faqs: [
    {
      question: 'Should I inspect the car myself or with a mechanic?',
      answer:
        'Doing both is safest. A quick personal inspection helps, but a trusted mechanic can catch hidden mechanical issues.',
    },
    {
      question: 'Is a road test really necessary?',
      answer:
        'Yes. A short road test often reveals clutch, brake, suspension, steering, or engine issues that are not visible while the car is parked.',
    },
    {
      question: 'Can I use the same checklist for second hand cars too?',
      answer:
        'Yes, this checklist is equally useful for used and second hand cars because the underlying inspection steps are the same.',
    },
  ],
  relatedLinks: [
    { href: '/used-cars-in-raipur', label: 'Used Cars in Raipur' },
    { href: '/used-cars-in-bilaspur', label: 'Used Cars in Bilaspur' },
    { href: '/best-second-hand-family-cars-in-chhattisgarh', label: 'Family Car Guide' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedCarInspectionChecklistPage() {
  return <GuidePage config={config} />;
}
