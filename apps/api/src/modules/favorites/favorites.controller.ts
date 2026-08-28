import {
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
import { FavoritesService } from './favorites.service';
import { PublicVehicle } from '../vehicles/vehicles.service';
import { UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.customer)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':vehiclePublicId/toggle')
  toggle(
    @Param('vehiclePublicId', ParseIntPipe) vehiclePublicId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ favorited: boolean }> {
    return this.favoritesService.toggle(user.id, vehiclePublicId);
  }

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<PublicVehicle[]> {
    return this.favoritesService.findForUser(user.id);
  }

  // Deliberately not used on the browse grid (would be one request per card)
  // — only the vehicle detail page, where a single extra request is cheap
  // and shows the button's true state instead of always starting unfilled.
  @Get(':vehiclePublicId')
  async check(
    @Param('vehiclePublicId', ParseIntPipe) vehiclePublicId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ favorited: boolean }> {
    return { favorited: await this.favoritesService.isFavorited(user.id, vehiclePublicId) };
  }
}
