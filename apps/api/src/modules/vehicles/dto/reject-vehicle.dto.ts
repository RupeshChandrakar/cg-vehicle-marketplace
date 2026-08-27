import { IsString, MinLength } from 'class-validator';

export class RejectVehicleDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
