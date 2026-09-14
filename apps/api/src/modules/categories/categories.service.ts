import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Category } from '../../generated/prisma/client';

const CATEGORY_ORDER: Record<string, number> = {
  cars: 1,
  tractors: 2,
  bikes: 3,
  scooters: 4,
  'commercial-vehicles': 5,
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });

    return categories
      .map((category) =>
        category.slug === 'scooters'
          ? {
              ...category,
              name: 'Scooty',
            }
          : category,
      )
      .sort((a, b) => {
        const aOrder = CATEGORY_ORDER[a.slug] ?? Number.MAX_SAFE_INTEGER;
        const bOrder = CATEGORY_ORDER[b.slug] ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.sortOrder - b.sortOrder;
      });
  }
}
