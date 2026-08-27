import {
  Controller,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  VehicleMediaService,
  UploadedMediaResult,
} from './vehicle-media.service';
import {
  ALLOWED_MIME_TYPE_PATTERN,
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
        .addFileTypeValidator({ fileType: ALLOWED_MIME_TYPE_PATTERN })
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES })
        .build(),
    )
    files: Array<Express.Multer.File>,
  ): Promise<UploadedMediaResult[]> {
    return this.vehicleMediaService.addMedia(id, files);
  }
}
