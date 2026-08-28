import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { VehiclesService, PublicVehicle } from '../vehicles/vehicles.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async toggle(
    userId: string,
    vehiclePublicId: number,
  ): Promise<{ favorited: boolean }> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { publicId: vehiclePublicId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_vehicleId: { userId, vehicleId: vehicle.id } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({
      data: { userId, vehicleId: vehicle.id },
    });
    return { favorited: true };
  }

  async isFavorited(userId: string, vehiclePublicId: number): Promise<boolean> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { publicId: vehiclePublicId },
    });
    if (!vehicle) return false;

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_vehicleId: { userId, vehicleId: vehicle.id } },
    });
    return Boolean(existing);
  }

  async findForUser(userId: string): Promise<PublicVehicle[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { vehicleId: true },
    });

    const vehicles = await this.vehiclesService.findManyByIds(
      favorites.map((favorite) => favorite.vehicleId),
    );

    // findManyByIds doesn't preserve order — restore "most recently favorited first".
    const orderIndex = new Map(
      favorites.map((favorite, index) => [favorite.vehicleId, index]),
    );
    return vehicles.sort(
      (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
    );
  }
}
