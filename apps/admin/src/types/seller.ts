// Mirrors the API's AdminSeller shape (apps/api/src/modules/users/users.service.ts).

import type { VehicleStatus } from './vehicle';

export interface AdminSeller {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
  lastLoginAt: string | null;
  totalListings: number;
  statusBreakdown: Partial<Record<VehicleStatus, number>>;
}
