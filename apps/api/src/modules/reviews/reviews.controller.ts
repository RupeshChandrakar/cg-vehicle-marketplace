import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { ReviewsService, VehicleReviewSummary } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review, UserRole } from '../../generated/prisma/client';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @Post()
  create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Review> {
    return this.reviewsService.create(user.id, dto);
  }

  @Get('vehicle/:vehiclePublicId')
  findForVehicle(
    @Param('vehiclePublicId', ParseIntPipe) vehiclePublicId: number,
  ): Promise<VehicleReviewSummary> {
    return this.reviewsService.findForVehicle(vehiclePublicId);
  }
}
