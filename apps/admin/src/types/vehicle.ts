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
  description: string | null;
  status: VehicleStatus;
  rejectionReason: string | null;
  category: { id: string; name: string; slug: string };
  location: { id: string; district: string; slug: string };
  media: AdminVehicleMedia[];
  seller: Seller;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}
