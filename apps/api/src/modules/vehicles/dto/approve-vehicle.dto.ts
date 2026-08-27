import { IsOptional, IsString } from 'class-validator';

export class ApproveVehicleDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
