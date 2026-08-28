import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { FinanceEnquiryStatus } from '../../../generated/prisma/client';

export class AdminFinanceEnquiryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(FinanceEnquiryStatus)
  status?: FinanceEnquiryStatus;
}
