import { API_BASE_URL } from '@/config/api';
import type {
  Category,
  Location,
  LocationDetectionResult,
  PaginatedResult,
  Vehicle,
} from '@/types/vehicle';

export interface VehicleFilters {
  categorySlug?: string;
  locationSlug?: string;
  page?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Listings change often enough, and this is early enough in the
    // project, that correctness beats shaving a request via caching here.
    cache: 'no-store',
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories');
}

export function getLocations(): Promise<Location[]> {
  return request<Location[]>('/locations');
}

export function detectLocation(
  latitude: number,
  longitude: number,
): Promise<LocationDetectionResult> {
  return request<LocationDetectionResult>('/locations/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });
}

export function getVehicles(filters: VehicleFilters): Promise<PaginatedResult<Vehicle>> {
  const params = new URLSearchParams();
  if (filters.categorySlug) params.set('categorySlug', filters.categorySlug);
  if (filters.locationSlug) params.set('locationSlug', filters.locationSlug);
  if (filters.page) params.set('page', String(filters.page));

  const query = params.toString();
  return request<PaginatedResult<Vehicle>>(`/vehicles${query ? `?${query}` : ''}`);
}

export async function getVehicleByPublicId(publicId: number): Promise<Vehicle | null> {
  try {
    return await request<Vehicle>(`/vehicles/${publicId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
