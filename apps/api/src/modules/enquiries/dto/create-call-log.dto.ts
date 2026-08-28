import { IsIn, IsOptional, IsString } from 'class-validator';
import { CallOutcome } from '../../../generated/prisma/client';

export class CreateCallLogDto {
  @IsIn(Object.values(CallOutcome))
  outcome!: CallOutcome;

  @IsOptional()
  @IsString()
  notes?: string;
}
