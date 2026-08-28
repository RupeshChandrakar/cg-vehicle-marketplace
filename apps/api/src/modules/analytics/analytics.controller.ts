import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';

/** Public — fired anonymously by the customer web app on every page view,
 *  no authentication required. See AnalyticsService.trackPageView. */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('page-view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackPageView(@Body() dto: TrackPageViewDto): Promise<void> {
    await this.analyticsService.trackPageView(dto);
  }
}
