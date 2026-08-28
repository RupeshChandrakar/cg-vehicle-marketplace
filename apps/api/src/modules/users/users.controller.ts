import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../generated/prisma/client';
import { UsersService, ReferralInfo } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.customer)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('referral')
  getReferralInfo(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReferralInfo> {
    return this.usersService.getReferralInfo(user.id);
  }
}
