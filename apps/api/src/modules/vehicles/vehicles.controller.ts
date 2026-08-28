import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import {
  VehiclesService,
  PublicVehicle,
  SellerVehicle,
} from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { Vehicle, UserRole } from '../../generated/prisma/client';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(@Body() dto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.create(dto);
  }

  @Get()
  findPublished(
    @Query() query: VehicleQueryDto,
  ): Promise<PaginatedResult<PublicVehicle>> {
    return this.vehiclesService.findPublished(query);
  }

  // Seller self-service — declared here, above the `:publicId` route below,
  // so NestJS/Express match the literal "me" segment first rather than
  // trying to parse it as a publicId. Same controller specifically to keep
  // that ordering guarantee simple and visible in one file.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<SellerVehicle[]> {
    return this.vehiclesService.findMineForSeller(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @Patch('me/:id')
  updateMine(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SellerVehicle> {
    return this.vehiclesService.updateAsSeller(id, user.id, dto);
  }

  @Get(':publicId')
  findByPublicId(
    @Param('publicId', ParseIntPipe) publicId: number,
  ): Promise<PublicVehicle> {
    return this.vehiclesService.findByPublicId(publicId);
  }
}
