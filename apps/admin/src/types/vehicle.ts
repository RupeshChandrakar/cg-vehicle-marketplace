// Mirrors the API's admin vehicle shape (apps/api/src/modules/vehicles/vehicles.service.ts).

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

export interface Seller {
  id: string;
  name: string | null;
  phone: string;
}

export interface AdminVehicleMedia {
  id: string;
  url: string;
  sortOrder: number;
}

export interface VehicleSpecs {
  registrationNumber?: string;
  rcAvailable?: boolean;
  insuranceValidUntil?: string;
  noChallan?: boolean;
  nonAccident?: boolean;
  ownerCount?: number;
  areaText?: string;
  preferredContact?: 'call' | 'chat' | 'both';

  // Technical specifications — mirrors apps/web's VehicleSpecs. All
  // optional: not every field applies to every category.
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

export interface AdminVehicle {
  id: string;
  publicId: number | null;
  slug: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  kmDriven: number;
  fuelType: string;
  transmission: string;
  condition: string | null;
  description: string | null;
  specs: VehicleSpecs | null;
  status: VehicleStatus;
  rejectionReason: string | null;
  category: { id: string; name: string; slug: string };
  location: { id: string; district: string; slug: string };
  media: AdminVehicleMedia[];
  seller: Seller;
  createdAt: string;
}

/** Fields an admin/agent can change on an existing listing via PATCH
 *  /admin/vehicles/:id — everything optional, seller identity excluded. */
export interface UpdateVehiclePayload {
  categorySlug?: string;
  locationSlug?: string;
  title?: string;
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  kmDriven?: number;
  fuelType?: string;
  transmission?: string;
  condition?: string;
  description?: string;
  specs?: VehicleSpecs;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Location {
  id: string;
  district: string;
  slug: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}
