import { IsIn, IsString } from 'class-validator';
import { ReelTemplate } from '../../../generated/prisma/client';

export class CreateReelDto {
  @IsString()
  vehicleId!: string;

  @IsIn(Object.values(ReelTemplate))
  template!: ReelTemplate;
}
