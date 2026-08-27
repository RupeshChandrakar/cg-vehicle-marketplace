import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { VehiclesService, PublicVehicle } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { Vehicle } from '../../generated/prisma/client';

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

  @Get(':publicId')
  findByPublicId(
    @Param('publicId', ParseIntPipe) publicId: number,
  ): Promise<PublicVehicle> {
    return this.vehiclesService.findByPublicId(publicId);
  }
}
