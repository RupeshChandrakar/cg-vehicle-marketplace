import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { FfmpegService } from '../../infra/video/ffmpeg.service';
import {
  buildSegmentFilter,
  REEL_FPS,
  REEL_SEGMENT_DURATION_SECONDS,
} from '../../infra/video/reel-templates';
import { CreateReelDto } from './dto/create-reel.dto';
import { AdminReelQueryDto } from './dto/admin-reel-query.dto';
import { UpdateReelPublishStatusDto } from './dto/update-reel-publish-status.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { type AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Prisma, Reel } from '../../generated/prisma/client';

const REEL_INCLUDE = {
  vehicle: {
    select: { id: true, publicId: true, slug: true, title: true },
  },
  createdBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.ReelInclude;

type ReelWithIncludes = Prisma.ReelGetPayload<{ include: typeof REEL_INCLUDE }>;
type VehicleWithMedia = Prisma.VehicleGetPayload<{ include: { media: true } }>;

export interface PublicReel {
  id: string;
  template: Reel['template'];
  status: Reel['status'];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  publishStatus: Reel['publishStatus'];
  platform: string | null;
  createdAt: Date;
  vehicle: { id: string; publicId: number | null; slug: string; title: string };
  createdBy: { id: string; name: string | null; email: string | null };
}

@Injectable()
export class ReelsService {
  private readonly logger = new Logger(ReelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ffmpeg: FfmpegService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    dto: CreateReelDto,
    staff: AuthenticatedUser,
  ): Promise<PublicReel> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    if (vehicle.media.length === 0) {
      throw new BadRequestException(
        'This vehicle has no photos to generate a reel from',
      );
    }

    const reel = await this.prisma.reel.create({
      data: {
        vehicleId: vehicle.id,
        createdById: staff.id,
        template: dto.template,
        status: 'processing',
      },
      include: REEL_INCLUDE,
    });

    // Fire-and-forget: the request returns immediately with status
    // "processing" and the admin UI polls for completion. There's no job
    // queue yet (see docs/ARCHITECTURE.md "Phase 6 notes") — fine for one
    // instance at today's volume, worth revisiting (BullMQ + Redis, already
    // in the stack for Socket.IO) if concurrent reel generation grows.
    this.generate(reel.id, vehicle).catch((error: unknown) => {
      this.logger.error(
        `Reel ${reel.id} generation crashed: ${(error as Error).message}`,
      );
    });

    return this.toPublicReel(reel);
  }

  private async generate(
    reelId: string,
    vehicle: VehicleWithMedia,
  ): Promise<void> {
    const reel = await this.prisma.reel.findUniqueOrThrow({
      where: { id: reelId },
    });
    const tempDir = path.join(os.tmpdir(), 'cg-reels', reelId);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      const fontPath = this.configService.getOrThrow<string>('REEL_FONT_PATH');
      const titleFile = path.join(tempDir, 'title.txt');
      const priceFile = path.join(tempDir, 'price.txt');
      await fs.writeFile(titleFile, vehicle.title, 'utf8');
      await fs.writeFile(
        priceFile,
        `₹${Number(vehicle.price).toLocaleString('en-IN')}`,
        'utf8',
      );

      const segmentPaths: string[] = [];
      for (const [index, media] of vehicle.media.entries()) {
        const imageBuffer = await this.storage.download(media.storageKey);
        const imageExt = path.extname(media.storageKey) || '.jpg';
        const imagePath = path.join(tempDir, `photo-${index}${imageExt}`);
        await fs.writeFile(imagePath, imageBuffer);

        const segmentPath = path.join(tempDir, `segment-${index}.mp4`);
        const filter = buildSegmentFilter(reel.template, {
          titleFilterPath: this.ffmpeg.toFilterPath(titleFile),
          priceFilterPath: this.ffmpeg.toFilterPath(priceFile),
          fontFilterPath: this.ffmpeg.toFilterPath(fontPath),
        });

        await this.ffmpeg.run([
          '-y',
          '-loop',
          '1',
          '-i',
          imagePath,
          '-t',
          String(REEL_SEGMENT_DURATION_SECONDS),
          '-vf',
          filter,
          '-r',
          String(REEL_FPS),
          '-pix_fmt',
          'yuv420p',
          '-c:v',
          'libx264',
          segmentPath,
        ]);
        segmentPaths.push(segmentPath);
      }

      const listPath = path.join(tempDir, 'list.txt');
      const listContent = segmentPaths
        .map((segmentPath) => `file '${segmentPath.replace(/\\/g, '/')}'`)
        .join('\n');
      await fs.writeFile(listPath, listContent, 'utf8');

      const finalPath = path.join(tempDir, 'final.mp4');
      await this.ffmpeg.run([
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listPath,
        '-c',
        'copy',
        finalPath,
      ]);

      const thumbPath = path.join(tempDir, 'thumb.jpg');
      await this.ffmpeg.run([
        '-y',
        '-i',
        finalPath,
        '-ss',
        '1',
        '-frames:v',
        '1',
        thumbPath,
      ]);

      const durationSeconds = await this.ffmpeg.probeDurationSeconds(finalPath);

      const [videoBuffer, thumbBuffer] = await Promise.all([
        fs.readFile(finalPath),
        fs.readFile(thumbPath),
      ]);
      const videoKey = `reels/${reelId}.mp4`;
      const thumbnailKey = `reels/${reelId}-thumb.jpg`;
      await Promise.all([
        this.storage.upload(videoKey, videoBuffer, 'video/mp4'),
        this.storage.upload(thumbnailKey, thumbBuffer, 'image/jpeg'),
      ]);

      await this.prisma.reel.update({
        where: { id: reelId },
        data: {
          status: 'completed',
          storageKey: videoKey,
          thumbnailStorageKey: thumbnailKey,
          durationSeconds,
        },
      });
    } catch (error) {
      this.logger.error(
        `Reel ${reelId} generation failed: ${(error as Error).message}`,
      );
      await this.prisma.reel.update({
        where: { id: reelId },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message.slice(0, 500),
        },
      });
    } finally {
      await fs
        .rm(tempDir, { recursive: true, force: true })
        .catch(() => undefined);
    }
  }

  async findForStaff(
    query: AdminReelQueryDto,
  ): Promise<PaginatedResult<PublicReel>> {
    const where: Prisma.ReelWhereInput = {
      status: query.status,
      vehicleId: query.vehicleId,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.reel.findMany({
        where,
        include: REEL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.reel.count({ where }),
    ]);

    return {
      data: data.map((reel) => this.toPublicReel(reel)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  async findByIdForStaff(id: string): Promise<PublicReel> {
    const reel = await this.prisma.reel.findUnique({
      where: { id },
      include: REEL_INCLUDE,
    });
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }
    return this.toPublicReel(reel);
  }

  async updatePublishStatus(
    id: string,
    dto: UpdateReelPublishStatusDto,
  ): Promise<PublicReel> {
    const existing = await this.prisma.reel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Reel not found');
    }

    const reel = await this.prisma.reel.update({
      where: { id },
      data: { publishStatus: dto.publishStatus, platform: dto.platform },
      include: REEL_INCLUDE,
    });
    return this.toPublicReel(reel);
  }

  private toPublicReel(reel: ReelWithIncludes): PublicReel {
    return {
      id: reel.id,
      template: reel.template,
      status: reel.status,
      videoUrl: reel.storageKey
        ? this.storage.getPublicUrl(reel.storageKey)
        : null,
      thumbnailUrl: reel.thumbnailStorageKey
        ? this.storage.getPublicUrl(reel.thumbnailStorageKey)
        : null,
      durationSeconds: reel.durationSeconds,
      errorMessage: reel.errorMessage,
      publishStatus: reel.publishStatus,
      platform: reel.platform,
      createdAt: reel.createdAt,
      vehicle: reel.vehicle,
      createdBy: reel.createdBy,
    };
  }
}
