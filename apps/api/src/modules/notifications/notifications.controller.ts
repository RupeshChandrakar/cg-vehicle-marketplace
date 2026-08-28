import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../generated/prisma/client';

/** Every role has a notification feed — customer, agent, and admin alike —
 *  so this is guarded by auth only, no @Roles() restriction. */
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('unread') unread?: string,
  ): Promise<Notification[]> {
    return this.notificationsService.findForUser(user.id, unread === 'true');
  }

  @Post(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Notification> {
    return this.notificationsService.markRead(id, user.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.notificationsService.markAllRead(user.id);
  }
}
