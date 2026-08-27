import { BadRequestException, Injectable } from '@nestjs/common';
import { VehicleStatus } from '../../generated/prisma/client';

const ALLOWED_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  draft: ['submitted'],
  submitted: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['live', 'rejected'],
  live: ['reserved', 'sold', 'expired'],
  reserved: ['live', 'sold'],
  sold: [],
  rejected: [],
  expired: [],
};

/**
 * Centralizes valid vehicle status transitions in one place instead of
 * re-checking ad hoc business rules wherever a status changes.
 */
@Injectable()
export class VehicleStatusService {
  canTransition(from: VehicleStatus, to: VehicleStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  assertTransition(from: VehicleStatus, to: VehicleStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Cannot move a vehicle from "${from}" to "${to}"`,
      );
    }
  }
}
