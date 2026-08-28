import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Exactly one of vehiclePublicId/agentId must be set — checked in
// ReviewsService, not here (see the Review model's doc comment for why).
export class CreateReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehiclePublicId?: number;

  @IsOptional()
  @IsString()
  agentId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
