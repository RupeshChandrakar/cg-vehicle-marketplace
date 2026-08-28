import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import {
  FinanceEnquiriesService,
  AdminFinanceEnquiry,
} from './finance-enquiries.service';
import { AdminFinanceEnquiryQueryDto } from './dto/admin-finance-enquiry-query.dto';
import { UpdateFinanceEnquiryStatusDto } from './dto/update-finance-enquiry-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.agent)
@Controller('admin/finance-enquiries')
export class AdminFinanceEnquiriesController {
  constructor(
    private readonly financeEnquiriesService: FinanceEnquiriesService,
  ) {}

  @Get()
  findAll(
    @Query() query: AdminFinanceEnquiryQueryDto,
  ): Promise<PaginatedResult<AdminFinanceEnquiry>> {
    return this.financeEnquiriesService.findForStaff(query);
  }

  @Post(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceEnquiryStatusDto,
  ): Promise<AdminFinanceEnquiry> {
    return this.financeEnquiriesService.updateStatus(id, dto.status);
  }
}
