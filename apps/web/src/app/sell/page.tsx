import type { Metadata } from 'next';
import { getCategories, getLocations } from '@/lib/api';
import { SellVehicleWizard } from '@/features/sell/sell-vehicle-wizard';
import { brand } from '@cg/shared-config';

export const metadata: Metadata = {
  title: `Sell Your Vehicle | ${brand.name}`,
  description:
    'Apni gaadi list karein — hamari team har listing ko verify karti hai, tabhi live hoti hai.',
};

export default async function SellPage() {
  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <SellVehicleWizard categories={categories} locations={locations} />
    </div>
  );
}
