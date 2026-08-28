import { IsIn, IsOptional, IsString } from 'class-validator';
import { ReelPublishStatus } from '../../../generated/prisma/client';

// There's no real social-platform integration — this just records what an
// agent/admin says they did manually. See docs/ARCHITECTURE.md "Phase 6 notes".
export class UpdateReelPublishStatusDto {
  @IsIn(Object.values(ReelPublishStatus))
  publishStatus!: ReelPublishStatus;

  @IsOptional()
  @IsString()
  platform?: string;
}
