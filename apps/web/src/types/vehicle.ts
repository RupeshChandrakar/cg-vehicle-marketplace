// Mirrors the API's public vehicle shape (apps/api/src/modules/vehicles/vehicles.service.ts).
// Hand-written for now since this app is the only consumer — worth moving to a shared
// package once the admin app needs the same shapes (see docs/ARCHITECTURE.md).

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'cng' | 'lpg' | 'other';
export type Transmission = 'manual' | 'automatic';
export type VehicleCondition = 'excellent' | 'good' | 'fair';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Location {
  id: string;
  district: string;
  state: string;
  slug: string;
  latitude: number;
  longitude: number;
}

export interface VehicleMedia {
  id: string;
  url: string;
  sortOrder: number;
}

export interface VehicleVerification {
  id: string;
  verifiedAt: string;
  notes: string | null;
}

export interface Vehicle {
  id: string;
  publicId: number;
  slug: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  /** Serialized as a string by Prisma's Decimal JSON encoding. */
  price: string;
  kmDriven: number;
  fuelType: FuelType;
  transmission: Transmission;
  condition: VehicleCondition;
  description: string | null;
  category: Category;
  location: Location;
  media: VehicleMedia[];
  verification: VehicleVerification | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface LocationDetectionResult {
  matched: Location;
  nearby: Location[];
}
