'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
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
      <h1 className="text-xl font-bold tracking-tight text-foreground">My Favorites</h1>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-thumb w-full" />
              <div className="space-y-2 p-4">
                <div className="skeleton skeleton-text w-3/4" />
                <div className="skeleton skeleton-text w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Heart className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">Aapne abhi tak koi vehicle favorite nahi kiya hai.</p>
        </div>
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
