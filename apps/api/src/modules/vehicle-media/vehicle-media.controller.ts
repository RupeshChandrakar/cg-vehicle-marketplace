import {
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
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../generated/prisma/client';
import {
  VehicleMediaService,
  UploadedMediaResult,
} from './vehicle-media.service';
import {
  MAX_FILES_PER_VEHICLE,
  MAX_FILE_SIZE_BYTES,
} from './vehicle-media.constants';

@Controller('vehicles')
export class VehicleMediaController {
  constructor(private readonly vehicleMediaService: VehicleMediaService) {}

  @Post(':id/media')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_VEHICLE, {
      // Reject an oversized file at the multipart-parsing layer, before it's
      // fully buffered into memory — the pipe below re-checks size on what
      // does get through, but this is what actually bounds memory use.
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
    return this.vehicleMediaService.addMedia(id, files);
  }

  // Seller self-service — deleting a photo (unlike uploading one during the
  // original guest sell-wizard flow) happens from the "My Listings" page,
  // a later, separate session, so it genuinely needs real authentication +
  // ownership proof rather than just "knows the vehicle id".
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.vehicleMediaService.removeMediaAsSeller(id, user.id, mediaId);
  }
}
