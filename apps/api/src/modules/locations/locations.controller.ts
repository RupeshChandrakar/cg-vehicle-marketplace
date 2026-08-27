import { Body, Controller, Get, Post } from '@nestjs/common';
import { LocationsService, LocationDetectionResult } from './locations.service';
import { DetectLocationDto } from './dto/detect-location.dto';
import { Location } from '../../generated/prisma/client';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  findAll(): Promise<Location[]> {
    return this.locationsService.findAll();
  }

  @Post('detect')
  detect(@Body() dto: DetectLocationDto): Promise<LocationDetectionResult> {
    return this.locationsService.detect(dto.latitude, dto.longitude);
  }
}
