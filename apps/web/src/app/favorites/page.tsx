'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getFavorites, ApiError } from '@/lib/api';
import { VehicleCard } from '@/features/vehicles/vehicle-card';
import type { Vehicle } from '@/types/vehicle';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useCustomerAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login?next=/favorites');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getFavorites(accessToken)
      .then(setVehicles)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Favorites load nahi ho paaye.');
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isAuthLoading || !user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-lg font-semibold text-foreground">My Favorites</h1>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : vehicles.length === 0 ? (
        <p className="rounded-2xl bg-primary-light px-4 py-16 text-center text-sm text-muted shadow-card">
          Aapne abhi tak koi vehicle favorite nahi kiya hai.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
