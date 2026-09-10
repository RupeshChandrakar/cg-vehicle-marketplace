import { brand } from '@cg/shared-config';
import { GuidePage, generateGuideMetadata, type GuideConfig } from '@/features/seo/guide-page';

const config: GuideConfig = {
  path: '/used-scooter-vs-used-bike-chhattisgarh',
  title: `Used Scooter vs Used Bike Chhattisgarh | ${brand.name}`,
  description:
    'Compare used scooter and used bike choices in Chhattisgarh based on mileage, comfort, maintenance, and daily commute use.',
  h1: 'Used Scooter vs Used Bike in Chhattisgarh',
  intro:
    'Scooters and bikes solve slightly different needs. This comparison helps Chhattisgarh buyers pick the better two-wheeler for comfort, mileage, and maintenance cost.',
  sections: [
    {
      title: 'When a scooter is the better fit',
      body:
        'Scooters are usually better for easy city use, step-through convenience, and relaxed daily commuting. They suit riders who want simple handling.',
    },
    {
      title: 'When a bike is the better fit',
      body:
        'Bikes are often better for riders who want a more engaged ride, different engine options, or a more versatile mix of city and highway use.',
    },
    {
      title: 'How to choose',
      body:
        'Compare the condition, service history, and expected repair cost first. The better vehicle is the one that matches your route, budget, and comfort preference.',
    },
  ],
  faqs: [
    {
      question: 'Which is cheaper to maintain: a scooter or a bike?',
      answer:
        'It depends on the model and condition, but scooters often feel simpler for short city use while bikes may offer different performance tradeoffs.',
    },
    {
      question: 'Should I compare both before buying?',
      answer:
        'Yes. Comparing both helps you choose the option that best matches your daily use and budget.',
    },
    {
      question: 'Does this help with SEO too?',
      answer:
        'Yes. It captures a comparison query and supports the broader two-wheeler content cluster.',
    },
  ],
  relatedLinks: [
    { href: '/used-scooter-buying-guide-chhattisgarh', label: 'Scooter Buying Guide' },
    { href: '/used-bikes-in-raipur', label: 'Used Bikes in Raipur' },
    { href: '/best-mileage-bikes-in-chhattisgarh', label: 'Best Mileage Bikes' },
  ],
};

export async function generateMetadata() {
  return generateGuideMetadata(config);
}

export default function UsedScooterVsUsedBikePage() {
  return <GuidePage config={config} />;
}
