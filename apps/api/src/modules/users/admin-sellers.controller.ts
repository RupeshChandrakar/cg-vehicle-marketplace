import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { UsersService, AdminSeller } from './users.service';
import { AdminSellerQueryDto } from './dto/admin-seller-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.agent)
@Controller('admin/sellers')
export class AdminSellersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query() query: AdminSellerQueryDto,
  ): Promise<PaginatedResult<AdminSeller>> {
    return this.usersService.findSellersForAdmin(query);
  }
}
