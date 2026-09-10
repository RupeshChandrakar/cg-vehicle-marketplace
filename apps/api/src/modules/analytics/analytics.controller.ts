import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';

/** Public — fired anonymously by the customer web app on every page view,
 *  no authentication required. See AnalyticsService.trackPageView. */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('page-view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackPageView(
    @Body() dto: TrackPageViewDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.analyticsService.trackPageView(dto, request);
  }
}
