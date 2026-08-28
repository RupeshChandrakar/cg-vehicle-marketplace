import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { VehicleStatus } from '../../../generated/prisma/client';

export class AdminVehicleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  /** Powers the admin Sellers page's drill-down into one seller's listings. */
  @IsOptional()
  @IsString()
  sellerId?: string;
}
