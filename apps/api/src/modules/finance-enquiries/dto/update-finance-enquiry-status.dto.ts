import { IsEnum } from 'class-validator';
import { FinanceEnquiryStatus } from '../../../generated/prisma/client';

export class UpdateFinanceEnquiryStatusDto {
  @IsEnum(FinanceEnquiryStatus)
  status!: FinanceEnquiryStatus;
}
