import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { VehicleStatusService } from './vehicle-status.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { slugify } from '../../common/utils/slug.util';
import { Prisma, Vehicle, VehicleStatus } from '../../generated/prisma/client';

const PUBLIC_VEHICLE_INCLUDE = {
  category: true,
  location: true,
  media: { orderBy: { sortOrder: 'asc' } },
  verification: true,
} satisfies Prisma.VehicleInclude;

export type PublicVehicle = Prisma.VehicleGetPayload<{
  include: typeof PUBLIC_VEHICLE_INCLUDE;
}>;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly statusService: VehicleStatusService,
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
      data,
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
    return vehicle;
  }

  // --- Review pipeline: service-level only until admin auth (Phase 2) gates these as routes. ---

  async markUnderReview(id: string): Promise<Vehicle> {
    const vehicle = await this.findByIdOrThrow(id);
    this.statusService.assertTransition(
      vehicle.status,
      VehicleStatus.under_review,
    );
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.under_review },
    });
  }

  async approve(
    id: string,
    verifiedBy?: string,
    notes?: string,
  ): Promise<Vehicle> {
    const vehicle = await this.findByIdOrThrow(id);
    this.statusService.assertTransition(vehicle.status, VehicleStatus.approved);

    return this.prisma.$transaction(async (tx) => {
      await tx.vehicleVerification.upsert({
        where: { vehicleId: id },
        update: { verifiedBy, notes },
        create: { vehicleId: id, verifiedBy, notes },
      });

      return tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.approved },
      });
    });
  }

  async publish(id: string): Promise<Vehicle> {
    const vehicle = await this.findByIdOrThrow(id);
    this.statusService.assertTransition(vehicle.status, VehicleStatus.live);

    const rows = await this.prisma.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('vehicle_public_id_seq')
    `;

    return this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.live, publicId: Number(rows[0].nextval) },
    });
  }

  async reject(id: string, reason: string): Promise<Vehicle> {
    const vehicle = await this.findByIdOrThrow(id);
    this.statusService.assertTransition(vehicle.status, VehicleStatus.rejected);
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.rejected, rejectionReason: reason },
    });
  }

  private async findByIdOrThrow(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }
}
