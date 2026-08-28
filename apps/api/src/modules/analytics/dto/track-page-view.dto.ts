import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class TrackPageViewDto {
  /** Client-generated UUID, persisted in the browser's localStorage —
   *  identifies a browser, not a person. See apps/web/src/lib/analytics.ts. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  path!: string;

  /** Set only when the page being viewed is a vehicle detail page. The
   *  public sequential ID, never the internal UUID — same convention as
   *  Favorites/Enquiries, resolved server-side in AnalyticsService. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehiclePublicId?: number;
}
