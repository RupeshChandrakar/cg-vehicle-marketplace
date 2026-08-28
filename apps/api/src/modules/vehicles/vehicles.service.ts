import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VehicleStatusService } from './vehicle-status.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { AdminVehicleQueryDto } from './dto/admin-vehicle-query.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { slugify } from '../../common/utils/slug.util';
import {
  NotificationType,
  Prisma,
  User,
  Vehicle,
  VehicleMedia,
  VehicleStatus,
} from '../../generated/prisma/client';

const PUBLIC_VEHICLE_INCLUDE = {
  category: true,
  location: true,
  media: { orderBy: { sortOrder: 'asc' } },
  verification: true,
} satisfies Prisma.VehicleInclude;

const ADMIN_VEHICLE_INCLUDE = {
  ...PUBLIC_VEHICLE_INCLUDE,
  seller: true,
} satisfies Prisma.VehicleInclude;

type VehicleWithPublicInclude = Prisma.VehicleGetPayload<{
  include: typeof PUBLIC_VEHICLE_INCLUDE;
}>;
type VehicleWithAdminInclude = Prisma.VehicleGetPayload<{
  include: typeof ADMIN_VEHICLE_INCLUDE;
}>;

export interface PublicVehicleMedia {
  id: string;
  url: string;
  sortOrder: number;
}

export type PublicVehicle = Omit<VehicleWithPublicInclude, 'media'> & {
  media: PublicVehicleMedia[];
};
export type AdminVehicle = Omit<VehicleWithAdminInclude, 'media'> & {
  media: PublicVehicleMedia[];
  seller: User;
};

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly statusService: VehicleStatusService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const [category, location] = await Promise.all([
      this.prisma.category.findUnique({ where: { slug: dto.categorySlug } }),
      this.prisma.location.findUnique({ where: { slug: dto.locationSlug } }),
    ]);
    if (!category)
      throw new NotFoundException(`Unknown category "${dto.categorySlug}"`);
    if (!location)
      throw new NotFoundException(`Unknown location "${dto.locationSlug}"`);

    const seller = await this.usersService.findOrCreateByPhone(
      dto.sellerPhone,
      dto.sellerName,
    );

    // There's no separate "save as draft" step in this flow yet, but the
    // transition still goes through the state machine rather than being
    // special-cased on create.
    this.statusService.assertTransition(
      VehicleStatus.draft,
      VehicleStatus.submitted,
    );

    return this.prisma.vehicle.create({
      data: {
        slug: slugify(`${dto.brand}-${dto.model}-${dto.year}`),
        title: dto.title,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        price: dto.price,
        kmDriven: dto.kmDriven,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        condition: dto.condition,
        description: dto.description,
        // Validated as a plain object by CreateVehicleDto; Prisma's JSON input
        // type is stricter than Record<string, unknown> so it needs a cast here.
        specs: (dto.specs ?? {}) as Prisma.InputJsonValue,
        status: VehicleStatus.submitted,
        categoryId: category.id,
        locationId: location.id,
        sellerId: seller.id,
      },
    });
  }

  async findPublished(
    query: VehicleQueryDto,
  ): Promise<PaginatedResult<PublicVehicle>> {
    const where: Prisma.VehicleWhereInput = {
      status: VehicleStatus.live,
      category: query.categorySlug ? { slug: query.categorySlug } : undefined,
      location: query.locationSlug ? { slug: query.locationSlug } : undefined,
      price: { gte: query.minPrice, lte: query.maxPrice },
      OR: query.q
        ? [
            { title: { contains: query.q, mode: 'insensitive' } },
            { brand: { contains: query.q, mode: 'insensitive' } },
            { model: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const orderBy: Prisma.VehicleOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy,
        include: PUBLIC_VEHICLE_INCLUDE,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: data.map((vehicle) => this.toPublicVehicle(vehicle)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async findByPublicId(publicId: number): Promise<PublicVehicle> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { publicId, status: VehicleStatus.live },
      include: PUBLIC_VEHICLE_INCLUDE,
    });
    if (!vehicle) {
      throw new NotFoundException(`No live vehicle with ID ${publicId}`);
    }
    return this.toPublicVehicle(vehicle);
  }

  /** Used by FavoritesService/ReviewsService to render vehicle summaries
   *  without duplicating the public-shaping logic below. Order is not
   *  guaranteed — callers that care (e.g. "most recently favorited first")
   *  re-sort by their own ordering afterward. */
  async findManyByIds(ids: string[]): Promise<PublicVehicle[]> {
    if (ids.length === 0) return [];
    const vehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: ids } },
      include: PUBLIC_VEHICLE_INCLUDE,
    });
    return vehicles.map((vehicle) => this.toPublicVehicle(vehicle));
  }

  // --- Admin review pipeline: protected by JwtAuthGuard + RolesGuard at the controller. ---

  async findForAdmin(
    query: AdminVehicleQueryDto,
  ): Promise<PaginatedResult<AdminVehicle>> {
    const where: Prisma.VehicleWhereInput = query.status
      ? { status: query.status }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: ADMIN_VEHICLE_INCLUDE,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: data.map((vehicle) => this.toAdminVehicle(vehicle)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async findByIdForAdmin(id: string): Promise<AdminVehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: ADMIN_VEHICLE_INCLUDE,
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return this.toAdminVehicle(vehicle);
  }

  /**
   * Walks the listing from wherever it currently sits (submitted or
   * under_review) through to live in one admin action, recording the
   * verification and assigning the public ID along the way. Each hop still
   * goes through the state machine, so a listing in an invalid state (e.g.
   * already live, or rejected) is refused with a clear error rather than
   * silently no-op'd.
   */
  async approveAndPublish(
    id: string,
    verifiedBy: string,
    notes?: string,
  ): Promise<Vehicle> {
    const vehicle = await this.runApprovalTransaction(id, verifiedBy, notes);

    // Fired after the transaction commits, not inside it — a notification
    // for a listing that ends up rolled back would be misleading.
    await this.notifications.create({
      userId: vehicle.sellerId,
      type: NotificationType.vehicle_approved,
      title: 'Your listing is live',
      body: `"${vehicle.title}" has been verified and is now live on ${vehicle.publicId ? `Vehicle ID ${vehicle.publicId}` : 'the marketplace'}.`,
      relatedId: vehicle.id,
    });

    return vehicle;
  }

  private async runApprovalTransaction(
    id: string,
    verifiedBy: string,
    notes?: string,
  ): Promise<Vehicle> {
    return this.prisma.$transaction(async (tx) => {
      let vehicle = await tx.vehicle.findUnique({ where: { id } });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle ${id} not found`);
      }

      if (vehicle.status === VehicleStatus.submitted) {
        this.statusService.assertTransition(
          vehicle.status,
          VehicleStatus.under_review,
        );
        vehicle = await tx.vehicle.update({
          where: { id },
          data: { status: VehicleStatus.under_review },
        });
      }

      this.statusService.assertTransition(
        vehicle.status,
        VehicleStatus.approved,
      );
      await tx.vehicleVerification.upsert({
        where: { vehicleId: id },
        update: { verifiedBy, notes },
        create: { vehicleId: id, verifiedBy, notes },
      });
      vehicle = await tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.approved },
      });

      this.statusService.assertTransition(vehicle.status, VehicleStatus.live);
      const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`
        SELECT nextval('vehicle_public_id_seq')
      `;

      return tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.live, publicId: Number(rows[0].nextval) },
      });
    });
  }

  async reject(id: string, reason: string): Promise<Vehicle> {
    const vehicle = await this.findByIdOrThrow(id);
    this.statusService.assertTransition(vehicle.status, VehicleStatus.rejected);
    const rejected = await this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.rejected, rejectionReason: reason },
    });

    await this.notifications.create({
      userId: rejected.sellerId,
      type: NotificationType.vehicle_rejected,
      title: 'Your listing was rejected',
      body: `"${rejected.title}" was not approved: ${reason}`,
      relatedId: rejected.id,
    });

    return rejected;
  }

  private toPublicVehicle(vehicle: VehicleWithPublicInclude): PublicVehicle {
    return {
      ...vehicle,
      specs: this.toPublicSpecs(vehicle.specs),
      media: this.toPublicMedia(vehicle.media),
    };
  }

  private toAdminVehicle(vehicle: VehicleWithAdminInclude): AdminVehicle {
    // Admins see the raw specs, registration number included.
    return { ...vehicle, media: this.toPublicMedia(vehicle.media) };
  }

  /** registrationNumber is the one spec field that's genuinely sensitive — admin-only. */
  private toPublicSpecs(specs: Prisma.JsonValue): Prisma.JsonValue {
    if (!specs || typeof specs !== 'object' || Array.isArray(specs)) {
      return specs;
    }
    const publicSpecs = { ...(specs as Record<string, unknown>) };
    delete publicSpecs.registrationNumber;
    return publicSpecs as Prisma.JsonValue;
  }

  /** Media is stored as a bucket-relative key; resolve it to a URL only when serving. */
  private toPublicMedia(media: VehicleMedia[]): PublicVehicleMedia[] {
    return media
      .map((item) => ({
        id: item.id,
        url: this.storage.getPublicUrl(item.storageKey),
        sortOrder: item.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private async findByIdOrThrow(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }
}
