import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EnquiryStatus } from '../../../generated/prisma/client';

export class AdminEnquiryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EnquiryStatus)
  status?: EnquiryStatus;
}
