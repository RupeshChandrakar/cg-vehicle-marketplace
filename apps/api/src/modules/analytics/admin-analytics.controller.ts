import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.agent)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary();
  }
}
