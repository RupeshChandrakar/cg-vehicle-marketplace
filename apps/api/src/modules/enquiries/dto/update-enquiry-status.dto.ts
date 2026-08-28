import { IsIn } from 'class-validator';
import { EnquiryStatus } from '../../../generated/prisma/client';

export class UpdateEnquiryStatusDto {
  @IsIn(Object.values(EnquiryStatus))
  status!: EnquiryStatus;
}
