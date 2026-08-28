import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../generated/prisma/client';
import { UsersService, ReferralInfo, SelfProfile } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.customer)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getSelf(@CurrentUser() user: AuthenticatedUser): Promise<SelfProfile> {
    return this.usersService.getSelf(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<SelfProfile> {
    return this.usersService.updateProfile(user.id, dto.name);
  }

  @Get('referral')
  getReferralInfo(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReferralInfo> {
    return this.usersService.getReferralInfo(user.id);
  }
}
