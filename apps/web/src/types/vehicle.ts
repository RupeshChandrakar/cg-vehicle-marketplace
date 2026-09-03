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

/** Public-safe subset — the API strips registrationNumber before this ever reaches the browser. */
export interface VehicleSpecs {
  rcAvailable?: boolean;
  insuranceValidUntil?: string;
  noChallan?: boolean;
  nonAccident?: boolean;
  ownerCount?: number;
  areaText?: string;
  preferredContact?: 'call' | 'chat' | 'both';

  // Technical specifications — see features/vehicles/spec-fields.ts for
  // which of these render per category. All optional: not every field
  // applies to every category, and older listings predate this entirely.
  engineCc?: number;
  powerBhp?: number;
  mileageKmpl?: number;
  seatingCapacity?: number;
  groundClearanceMm?: number;
  fuelTankCapacityL?: number;
  ptoHp?: number;
  liftingCapacityKg?: number;
  loadCapacityKg?: number;
  numberOfCylinders?: number;
  numberOfGears?: string;
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
  specs: VehicleSpecs;
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

// --- Seller self-service ("My Listings") ---

export type VehicleStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'live'
  | 'rejected'
  | 'reserved'
  | 'sold'
  | 'expired';

/** Unlike the public VehicleSpecs (registrationNumber stripped for buyers),
 *  a seller sees their own registrationNumber — it's the number they
 *  entered for their own vehicle. */
export interface MyVehicleSpecs extends VehicleSpecs {
  registrationNumber?: string;
}

/** A seller's own view of a listing they submitted — includes status/
 *  rejectionReason (never shown to buyers) and can be pre-live (no
 *  publicId assigned yet). */
export interface MyVehicle extends Omit<Vehicle, 'specs' | 'publicId'> {
  publicId: number | null;
  status: VehicleStatus;
  rejectionReason: string | null;
  specs: MyVehicleSpecs;
}

export interface UpdateMyVehiclePayload {
  categorySlug?: string;
  locationSlug?: string;
  title?: string;
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  kmDriven?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  condition?: VehicleCondition;
  description?: string;
  specs?: MyVehicleSpecs;
}
