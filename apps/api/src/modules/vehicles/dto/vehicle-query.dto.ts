import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc'] as const;
export type VehicleSortOption = (typeof SORT_OPTIONS)[number];

export class VehicleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  locationSlug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort: VehicleSortOption = 'newest';
}
