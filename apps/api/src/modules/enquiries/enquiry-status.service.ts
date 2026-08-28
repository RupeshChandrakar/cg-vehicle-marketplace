import { BadRequestException, Injectable } from '@nestjs/common';
import { EnquiryStatus } from '../../generated/prisma/client';

const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  open: ['contacted', 'closed_lost'],
  contacted: ['negotiating', 'closed_lost'],
  negotiating: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
};

/**
 * Centralizes valid enquiry status transitions in one place, mirroring
 * VehicleStatusService's pattern for the vehicle listing pipeline.
 */
@Injectable()
export class EnquiryStatusService {
  canTransition(from: EnquiryStatus, to: EnquiryStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  assertTransition(from: EnquiryStatus, to: EnquiryStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Cannot move an enquiry from "${from}" to "${to}"`,
      );
    }
  }
}
