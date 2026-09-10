import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
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

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  screenWidth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  screenHeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  viewportWidth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  viewportHeight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  colorScheme?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reducedMotion?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  touchPoints?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deviceMemory?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  hardwareConcurrency?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  connectionType?: string;

  /** Set only when the page being viewed is a vehicle detail page. The
   *  public sequential ID, never the internal UUID — same convention as
   *  Favorites/Enquiries, resolved server-side in AnalyticsService. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehiclePublicId?: number;
}
