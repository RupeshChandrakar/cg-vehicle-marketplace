import {
  Body,
  Controller,
  Get,
  Param,
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
import { VehiclesService, AdminVehicle } from './vehicles.service';
import { AdminVehicleQueryDto } from './dto/admin-vehicle-query.dto';
import { ApproveVehicleDto } from './dto/approve-vehicle.dto';
import { RejectVehicleDto } from './dto/reject-vehicle.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { Vehicle, UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.agent)
@Controller('admin/vehicles')
export class AdminVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(
    @Query() query: AdminVehicleQueryDto,
  ): Promise<PaginatedResult<AdminVehicle>> {
    return this.vehiclesService.findForAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AdminVehicle> {
    return this.vehiclesService.findByIdForAdmin(id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveVehicleDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<Vehicle> {
    return this.vehiclesService.approveAndPublish(id, admin.id, dto.notes);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectVehicleDto,
  ): Promise<Vehicle> {
    return this.vehiclesService.reject(id, dto.reason);
  }
}
