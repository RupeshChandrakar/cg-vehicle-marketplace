import type { Metadata } from 'next';
import { getCategories, getLocations } from '@/lib/api';
import { SellVehicleForm } from '@/features/sell/sell-vehicle-form';
import { brand } from '@cg/shared-config';

export const metadata: Metadata = {
  title: `Sell your vehicle | ${brand.name}`,
  description:
    'List your vehicle for free — our team reviews and verifies every listing before it goes live.',
};

export default async function SellPage() {
  const [categories, locations] = await Promise.all([getCategories(), getLocations()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Sell your vehicle</h1>
        <p className="text-sm text-muted">
          Submit your details below. Our team reviews every listing before it goes live — usually
          within a day.
        </p>
      </div>

      <SellVehicleForm categories={categories} locations={locations} />
    </div>
  );
}
