import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VehicleStatusService } from './vehicle-status.service';
import { SELLER_EDITABLE_STATUSES } from './vehicle-lifecycle.constants';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { AdminVehicleQueryDto } from './dto/admin-vehicle-query.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { slugify } from '../../common/utils/slug.util';
import {
  Category,
  Location,
  NotificationType,
  Prisma,
  VehicleVerification,
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

type VehicleWithPublicInclude = Prisma.VehicleGetPayload<{
  include: typeof PUBLIC_VEHICLE_INCLUDE;
}>;
type SellerPreview = { id: string; name: string | null; phone: string };

export interface PublicVehicleMedia {
  id: string;
  url: string;
  sortOrder: number;
}

export type PublicVehicle = Omit<VehicleWithPublicInclude, 'media'> & {
  media: PublicVehicleMedia[];
};
export type AdminVehicle = Omit<VehicleWithPublicInclude, 'media'> & {
  seller: SellerPreview;
  media: PublicVehicleMedia[];
};
/** A seller's view of their own listing — same fields as PublicVehicle
 *  (no nested `seller` object, since the seller already *is* the viewer)
 *  but with raw specs (registrationNumber included, since it's their own
 *  data) and status/rejectionReason so they can see where it stands. */
export type SellerVehicle = PublicVehicle;

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

  // --- Seller self-service: protected by JwtAuthGuard + RolesGuard(customer)
  //     at the controller, scoped to the caller's own vehicles only. ---

  /** Every listing the caller has ever submitted, any status — this is the
   *  one place a seller can see where their listing stands (including
   *  rejectionReason) without needing to ask an agent. */
  async findMineForSeller(sellerId: string): Promise<SellerVehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: PUBLIC_VEHICLE_INCLUDE,
    });
    return vehicles.map((vehicle) => this.toSellerVehicle(vehicle));
  }

  /**
   * A seller editing their own listing — unlike admin/agent's `update()`,
   * this is only allowed while the listing is still in a pre-verification
   * status (see SELLER_EDITABLE_STATUSES). Once live/approved, only staff
   * can edit it (they've already verified it; letting the seller silently
   * change price/specs after that would undermine the verification itself).
   * A mismatched sellerId throws NotFoundException, not Forbidden — a
   * seller probing listing IDs shouldn't be able to tell someone else's
   * listing exists at all.
   */
  async updateAsSeller(
    id: string,
    sellerId: string,
    dto: UpdateVehicleDto,
  ): Promise<SellerVehicle> {
    const vehicle = await this.findByIdOrThrow(id);
    if (vehicle.sellerId !== sellerId) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    if (!SELLER_EDITABLE_STATUSES.includes(vehicle.status)) {
      throw new BadRequestException(
        `This listing can no longer be edited directly (status: "${vehicle.status}"). Contact support for changes to a live listing.`,
      );
    }

    const updated = await this.applyVehicleUpdate(
      vehicle,
      dto,
      PUBLIC_VEHICLE_INCLUDE,
    );
    return this.toSellerVehicle(updated);
  }

  // --- Admin review pipeline: protected by JwtAuthGuard + RolesGuard at the controller. ---

  async findForAdmin(
    query: AdminVehicleQueryDto,
  ): Promise<PaginatedResult<AdminVehicle>> {
    const where: Prisma.VehicleWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    const total = await this.prisma.vehicle.count({ where });
    const data = await this.prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    const vehicleIds = data.map((vehicle) => vehicle.id);
    const categoryIds = [...new Set(data.map((vehicle) => vehicle.categoryId))];
    const locationIds = [...new Set(data.map((vehicle) => vehicle.locationId))];

    const [sellerById, categories, locations, media, verifications] =
      await Promise.all([
        this.getSellerMap(data.map((vehicle) => vehicle.sellerId)),
        categoryIds.length
          ? this.prisma.category.findMany({
              where: { id: { in: categoryIds } },
            })
          : Promise.resolve([] as Category[]),
        locationIds.length
          ? this.prisma.location.findMany({
              where: { id: { in: locationIds } },
            })
          : Promise.resolve([] as Location[]),
        vehicleIds.length
          ? this.prisma.vehicleMedia.findMany({
              where: { vehicleId: { in: vehicleIds } },
              orderBy: { sortOrder: 'asc' },
            })
          : Promise.resolve([] as VehicleMedia[]),
        vehicleIds.length
          ? this.prisma.vehicleVerification.findMany({
              where: { vehicleId: { in: vehicleIds } },
            })
          : Promise.resolve([] as VehicleVerification[]),
      ]);

    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const locationById = new Map(
      locations.map((location) => [location.id, location]),
    );
    const verificationByVehicleId = new Map(
      verifications.map((verification) => [
        verification.vehicleId,
        verification,
      ]),
    );
    const mediaByVehicleId = new Map<string, VehicleMedia[]>();
    for (const item of media) {
      const list = mediaByVehicleId.get(item.vehicleId);
      if (list) {
        list.push(item);
      } else {
        mediaByVehicleId.set(item.vehicleId, [item]);
      }
    }

    return {
      data: data.map((vehicle) => {
        const category = categoryById.get(vehicle.categoryId);
        const location = locationById.get(vehicle.locationId);

        if (!category) {
          throw new NotFoundException(
            `Category ${vehicle.categoryId} not found`,
          );
        }
        if (!location) {
          throw new NotFoundException(
            `Location ${vehicle.locationId} not found`,
          );
        }

        return {
          ...vehicle,
          category,
          location,
          verification: verificationByVehicleId.get(vehicle.id) ?? null,
          seller: sellerById.get(vehicle.sellerId) ?? {
            id: vehicle.sellerId,
            name: null,
            phone: '',
          },
          media: this.toPublicMedia(mediaByVehicleId.get(vehicle.id) ?? []),
        };
      }),
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
      include: PUBLIC_VEHICLE_INCLUDE,
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    const sellerById = await this.getSellerMap([vehicle.sellerId]);
    return this.toAdminVehicle(
      vehicle,
      sellerById.get(vehicle.sellerId) ?? {
        id: vehicle.sellerId,
        name: null,
        phone: '',
      },
    );
  }

  /**
   * Direct field edit by admin/agent — price, specs, description, etc.
   * Deliberately NOT part of the review state machine: staff are already the
   * trusted verifying party, so an edit to a live listing applies
   * immediately rather than kicking off a re-review cycle. Only fields
   * present on the DTO are touched; `specs` is merged onto the existing JSON
   * blob rather than replacing it, so a partial specs update (e.g. just
   * `rcAvailable`) doesn't erase other trust fields the caller didn't send.
   */
  async update(id: string, dto: UpdateVehicleDto): Promise<AdminVehicle> {
    const vehicle = await this.findByIdOrThrow(id);
    const updated = await this.applyVehicleUpdate(
      vehicle,
      dto,
      PUBLIC_VEHICLE_INCLUDE,
    );
    const sellerById = await this.getSellerMap([updated.sellerId]);
    return this.toAdminVehicle(
      updated,
      sellerById.get(updated.sellerId) ?? {
        id: updated.sellerId,
        name: null,
        phone: '',
      },
    );
  }

  /**
   * The actual field-update logic shared by admin's `update()` and the
   * seller's `updateAsSeller()` — each caller does its own authorization
   * (role vs. ownership) and status-gating *before* calling this, then asks
   * for whichever include shape it needs back.
   */
  private async applyVehicleUpdate<T extends Prisma.VehicleInclude>(
    vehicle: Vehicle,
    dto: UpdateVehicleDto,
    include: T,
  ): Promise<Prisma.VehicleGetPayload<{ include: T }>> {
    let categoryId: string | undefined;
    if (dto.categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: dto.categorySlug },
      });
      if (!category) {
        throw new NotFoundException(`Unknown category "${dto.categorySlug}"`);
      }
      categoryId = category.id;
    }

    let locationId: string | undefined;
    if (dto.locationSlug) {
      const location = await this.prisma.location.findUnique({
        where: { slug: dto.locationSlug },
      });
      if (!location) {
        throw new NotFoundException(`Unknown location "${dto.locationSlug}"`);
      }
      locationId = location.id;
    }

    // dto.specs is a VehicleSpecsDto *instance* — under this project's
    // ES2023 target (useDefineForClassFields), every declared field exists
    // as an own property even when the caller didn't send it, explicitly
    // set to undefined. Spreading it directly would overwrite untouched
    // existing spec fields with undefined, so only genuinely-provided keys
    // are merged in.
    const specs = dto.specs
      ? ({
          ...(vehicle.specs as Record<string, unknown>),
          ...Object.fromEntries(
            Object.entries(dto.specs as Record<string, unknown>).filter(
              ([, value]) => value !== undefined,
            ),
          ),
        } as Prisma.InputJsonValue)
      : undefined;

    return this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        categoryId,
        locationId,
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
        specs,
      },
      include,
    });
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

  private toAdminVehicle(
    vehicle: VehicleWithPublicInclude,
    seller: SellerPreview,
  ): AdminVehicle {
    // Admins see the raw specs, registration number included.
    return { ...vehicle, seller, media: this.toPublicMedia(vehicle.media) };
  }

  private async getSellerMap(
    sellerIds: string[],
  ): Promise<Map<string, SellerPreview>> {
    const uniqueSellerIds = [...new Set(sellerIds)];
    if (uniqueSellerIds.length === 0) return new Map();

    const sellers = await this.prisma.user.findMany({
      where: { id: { in: uniqueSellerIds } },
      select: { id: true, name: true, phone: true },
    });
    return new Map(sellers.map((seller) => [seller.id, seller]));
  }

  private toSellerVehicle(vehicle: VehicleWithPublicInclude): SellerVehicle {
    // Sellers see the raw specs too — registrationNumber is their own car's
    // number that they entered; only the *public* (buyer-facing) view
    // strips it.
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
