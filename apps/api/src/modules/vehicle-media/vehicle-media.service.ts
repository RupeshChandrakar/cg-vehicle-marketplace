import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { VehicleStatus } from '../../generated/prisma/client';
import {
  MAX_FILES_PER_VEHICLE,
  MIME_EXTENSIONS,
} from './vehicle-media.constants';

// A listing's gallery should only change while it's still being assembled or
// under review — a live listing's photos shouldn't shift without re-review.
const EDITABLE_STATUSES: VehicleStatus[] = [
  VehicleStatus.draft,
  VehicleStatus.submitted,
  VehicleStatus.under_review,
];

export interface UploadableFile {
  buffer: Buffer;
  mimetype: string;
}

export interface UploadedMediaResult {
  id: string;
  url: string;
}

@Injectable()
export class VehicleMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async addMedia(
    vehicleId: string,
    files: UploadableFile[],
  ): Promise<UploadedMediaResult[]> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }
    if (!EDITABLE_STATUSES.includes(vehicle.status)) {
      throw new BadRequestException(
        `Cannot add photos to a vehicle with status "${vehicle.status}"`,
      );
    }

    const existingCount = await this.prisma.vehicleMedia.count({
      where: { vehicleId },
    });
    if (existingCount + files.length > MAX_FILES_PER_VEHICLE) {
      throw new BadRequestException(
        `A vehicle can have at most ${MAX_FILES_PER_VEHICLE} photos`,
      );
    }

    const results: UploadedMediaResult[] = [];
    for (const [index, file] of files.entries()) {
      const extension = MIME_EXTENSIONS[file.mimetype] ?? 'bin';
      const storageKey = `vehicles/${vehicleId}/${randomUUID()}.${extension}`;
      await this.storage.upload(storageKey, file.buffer, file.mimetype);

      const media = await this.prisma.vehicleMedia.create({
        data: { vehicleId, storageKey, sortOrder: existingCount + index },
      });
      results.push({
        id: media.id,
        url: this.storage.getPublicUrl(storageKey),
      });
    }

    return results;
  }
}
