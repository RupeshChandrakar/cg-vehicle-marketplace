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
// This restriction applies to the customer-facing upload path only; staff
// curation (addMediaAsStaff/removeMedia/reorderMedia below) intentionally
// bypasses it — see the admin listing-edit feature.
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
    return this.uploadFiles(vehicleId, files);
  }

  /** Admin/agent photo curation — allowed regardless of listing status,
   *  including live, since staff are already the trusted verifying party. */
  async addMediaAsStaff(
    vehicleId: string,
    files: UploadableFile[],
  ): Promise<UploadedMediaResult[]> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }
    return this.uploadFiles(vehicleId, files);
  }

  async removeMedia(vehicleId: string, mediaId: string): Promise<void> {
    const media = await this.prisma.vehicleMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media || media.vehicleId !== vehicleId) {
      throw new NotFoundException('Photo not found on this vehicle');
    }
    // Remove the storage object first — if this throws, the DB row (and the
    // still-valid public URL) is left intact rather than pointing at nothing.
    await this.storage.delete(media.storageKey);
    await this.prisma.vehicleMedia.delete({ where: { id: mediaId } });
  }

  async reorderMedia(
    vehicleId: string,
    orderedMediaIds: string[],
  ): Promise<void> {
    const existing = await this.prisma.vehicleMedia.findMany({
      where: { vehicleId },
    });
    const existingIds = new Set(existing.map((m) => m.id));
    const isExactSameSet =
      orderedMediaIds.length === existing.length &&
      orderedMediaIds.every((id) => existingIds.has(id));
    if (!isExactSameSet) {
      throw new BadRequestException(
        "Reorder list must include exactly this vehicle's existing photos, each once",
      );
    }

    await this.prisma.$transaction(
      orderedMediaIds.map((id, index) =>
        this.prisma.vehicleMedia.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  private async uploadFiles(
    vehicleId: string,
    files: UploadableFile[],
  ): Promise<UploadedMediaResult[]> {
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
