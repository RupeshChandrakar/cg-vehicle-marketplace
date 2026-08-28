import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuthModule } from '../auth/auth.module';

// Global: VehiclesService and EnquiriesService both create notifications as
// a side effect of existing actions (approve/reject, new enquiry, new
// message) — making this global avoids a module-import cycle between them.
@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
