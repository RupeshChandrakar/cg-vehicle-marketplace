import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ReelStatus } from '../../../generated/prisma/client';

export class AdminReelQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReelStatus)
  status?: ReelStatus;

  @IsOptional()
  @IsString()
  vehicleId?: string;
}
