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
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { ReelsService, PublicReel } from './reels.service';
import { CreateReelDto } from './dto/create-reel.dto';
import { AdminReelQueryDto } from './dto/admin-reel-query.dto';
import { UpdateReelPublishStatusDto } from './dto/update-reel-publish-status.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.agent)
@Controller('admin/reels')
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  @Post()
  create(
    @Body() dto: CreateReelDto,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<PublicReel> {
    return this.reelsService.create(dto, staff);
  }

  @Get()
  findAll(
    @Query() query: AdminReelQueryDto,
  ): Promise<PaginatedResult<PublicReel>> {
    return this.reelsService.findForStaff(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<PublicReel> {
    return this.reelsService.findByIdForStaff(id);
  }

  // Per the role matrix in docs/ARCHITECTURE.md: agents can only generate
  // reels as drafts — moving one to published/scheduled is admin-only.
  // @Roles() on a method overrides the class-level one (RolesGuard checks
  // the handler first via Reflector.getAllAndOverride).
  @Roles(UserRole.admin)
  @Post(':id/publish-status')
  updatePublishStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReelPublishStatusDto,
  ): Promise<PublicReel> {
    return this.reelsService.updatePublishStatus(id, dto);
  }
}
