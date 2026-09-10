import type { MetadataRoute } from 'next';
import { getProgrammaticLandingSlugs } from '@/features/seo/landing-keywords';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const programmaticSlugs = getProgrammaticLandingSlugs();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'hourly', priority: 1 },
    { path: '/sell', changeFrequency: 'daily', priority: 0.9 },
    {
      path: '/used-vehicle-documents-checklist-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/best-second-hand-family-cars-in-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/best-mileage-bikes-in-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-car-inspection-checklist-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/how-to-sell-used-vehicle-in-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-car-vs-second-hand-car-in-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-tractor-buying-guide-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-bike-seller-checklist-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-cars-in-raipur-vs-bilaspur',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-scooter-buying-guide-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-scooter-inspection-checklist-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      path: '/used-scooter-vs-used-bike-chhattisgarh',
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    { path: '/used-cars-in-raipur', changeFrequency: 'daily', priority: 0.85 },
    { path: '/used-cars-in-bilaspur', changeFrequency: 'daily', priority: 0.85 },
    { path: '/used-cars-in-durg', changeFrequency: 'daily', priority: 0.85 },
    { path: '/used-bikes-in-bilaspur', changeFrequency: 'daily', priority: 0.85 },
    { path: '/used-bikes-in-raipur', changeFrequency: 'daily', priority: 0.85 },
    { path: '/used-tractors-in-mahasamund', changeFrequency: 'daily', priority: 0.85 },
  ];

  for (const slug of programmaticSlugs) {
    routes.push({ path: `/${slug}`, changeFrequency: 'daily', priority: 0.8 });
  }

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
