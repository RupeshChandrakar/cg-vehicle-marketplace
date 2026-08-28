import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { CreateFinanceEnquiryDto } from './dto/create-finance-enquiry.dto';
import { AdminFinanceEnquiryQueryDto } from './dto/admin-finance-enquiry-query.dto';
import { FinanceEnquiryStatus, Prisma } from '../../generated/prisma/client';

const ADMIN_FINANCE_ENQUIRY_INCLUDE = {
  vehicle: { select: { id: true, publicId: true, title: true } },
} satisfies Prisma.FinanceEnquiryInclude;

export type AdminFinanceEnquiry = Prisma.FinanceEnquiryGetPayload<{
  include: typeof ADMIN_FINANCE_ENQUIRY_INCLUDE;
}>;

@Injectable()
export class FinanceEnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pure lead capture — no loan application, no bank integration. Resolves
   * the client's public vehicle ID to the internal id (same convention as
   * Favorites/Enquiries/Analytics); an unknown/stale one is dropped rather
   * than failing the whole submission, since staff can still follow up on
   * a generic lead even without the vehicle context.
   */
  async create(dto: CreateFinanceEnquiryDto): Promise<void> {
    let vehicleId: string | undefined;
    if (dto.vehiclePublicId !== undefined) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { publicId: dto.vehiclePublicId },
        select: { id: true },
      });
      vehicleId = vehicle?.id;
    }

    await this.prisma.financeEnquiry.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        message: dto.message,
        vehicleId,
      },
    });
  }

  async findForStaff(
    query: AdminFinanceEnquiryQueryDto,
  ): Promise<PaginatedResult<AdminFinanceEnquiry>> {
    const where: Prisma.FinanceEnquiryWhereInput = query.status
      ? { status: query.status }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.financeEnquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: ADMIN_FINANCE_ENQUIRY_INCLUDE,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.financeEnquiry.count({ where }),
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

  async updateStatus(
    id: string,
    status: FinanceEnquiryStatus,
  ): Promise<AdminFinanceEnquiry> {
    const exists = await this.prisma.financeEnquiry.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`Finance enquiry ${id} not found`);
    }

    return this.prisma.financeEnquiry.update({
      where: { id },
      data: { status },
      include: ADMIN_FINANCE_ENQUIRY_INCLUDE,
    });
  }
}
