import { VehicleStatus } from '../../generated/prisma/client';

/**
 * A listing's core fields and gallery can only be edited by its own seller
 * while it's still being assembled or under review — once it's live,
 * approved, or further along, only admin/agent can edit it (see
 * AdminVehiclesController's PATCH /admin/vehicles/:id), since a live
 * listing has already been through verification. Shared by VehiclesService
 * (field edits) and VehicleMediaService (photo add/remove) so the two
 * never drift out of sync with each other.
 */
export const SELLER_EDITABLE_STATUSES: VehicleStatus[] = [
  VehicleStatus.draft,
  VehicleStatus.submitted,
  VehicleStatus.under_review,
];
