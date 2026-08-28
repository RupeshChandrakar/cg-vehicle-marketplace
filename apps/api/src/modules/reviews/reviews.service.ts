import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review, UserRole } from '../../generated/prisma/client';

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string | null;
  createdAt: Date;
}

export interface VehicleReviewSummary {
  reviews: PublicReview[];
  average: number | null;
  count: number;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateReviewDto): Promise<Review> {
    const targetCount = (dto.vehiclePublicId ? 1 : 0) + (dto.agentId ? 1 : 0);
    if (targetCount !== 1) {
      throw new BadRequestException(
        'Provide exactly one of vehiclePublicId or agentId',
      );
    }

    if (dto.vehiclePublicId) {
      return this.createVehicleReview(
        authorId,
        dto.vehiclePublicId,
        dto.rating,
        dto.comment,
      );
    }
    // targetCount === 1 and vehiclePublicId is falsy, so agentId must be set.
    return this.createAgentReview(
      authorId,
      dto.agentId as string,
      dto.rating,
      dto.comment,
    );
  }

  private async createVehicleReview(
    authorId: string,
    vehiclePublicId: number,
    rating: number,
    comment?: string,
  ): Promise<Review> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { publicId: vehiclePublicId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const hadEnquiry = await this.prisma.enquiry.findFirst({
      where: { customerId: authorId, vehicleId: vehicle.id },
    });
    if (!hadEnquiry) {
      throw new ForbiddenException(
        'You can only review a vehicle you enquired about',
      );
    }

    return this.prisma.review.upsert({
      where: { authorId_vehicleId: { authorId, vehicleId: vehicle.id } },
      update: { rating, comment },
      create: { authorId, vehicleId: vehicle.id, rating, comment },
    });
  }

  private async createAgentReview(
    authorId: string,
    agentId: string,
    rating: number,
    comment?: string,
  ): Promise<Review> {
    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (!agent || agent.role !== UserRole.agent) {
      throw new NotFoundException('Agent not found');
    }

    const hadEnquiry = await this.prisma.enquiry.findFirst({
      where: { customerId: authorId, agentId },
    });
    if (!hadEnquiry) {
      throw new ForbiddenException(
        'You can only review an agent you had an enquiry with',
      );
    }

    return this.prisma.review.upsert({
      where: { authorId_agentId: { authorId, agentId } },
      update: { rating, comment },
      create: { authorId, agentId, rating, comment },
    });
  }

  async findForVehicle(vehiclePublicId: number): Promise<VehicleReviewSummary> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { publicId: vehiclePublicId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: { vehicleId: vehicle.id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const average =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : null;

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        authorName: review.author.name,
        createdAt: review.createdAt,
      })),
      average,
      count: reviews.length,
    };
  }
}
