import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import {
  VehicleMediaService,
  UploadedMediaResult,
} from './vehicle-media.service';
import {
  MAX_FILES_PER_VEHICLE,
  MAX_FILE_SIZE_BYTES,
} from './vehicle-media.constants';
import { ReorderMediaDto } from './dto/reorder-media.dto';

/**
 * Admin/agent photo curation — add, remove, and reorder photos on any
 * listing regardless of status (including live). Deliberately separate from
 * VehicleMediaController's customer-facing `POST /vehicles/:id/media`, which
 * stays restricted to the pre-live sell flow.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.agent)
@Controller('admin/vehicles/:id/media')
export class AdminVehicleMediaController {
  constructor(private readonly vehicleMediaService: VehicleMediaService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_VEHICLE, {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  upload(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES })
        .build(),
    )
    files: Array<Express.Multer.File>,
  ): Promise<UploadedMediaResult[]> {
    return this.vehicleMediaService.addMediaAsStaff(id, files);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @Param('id') id: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<void> {
    await this.vehicleMediaService.reorderMedia(id, dto.mediaIds);
  }

  @Delete(':mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ): Promise<void> {
    await this.vehicleMediaService.removeMedia(id, mediaId);
  }
}
