import { Module } from '@nestjs/common';
import { EnquiriesController } from './enquiries.controller';
import { AdminEnquiriesController } from './admin-enquiries.controller';
import { EnquiriesService } from './enquiries.service';
import { EnquiryStatusService } from './enquiry-status.service';
import { EnquiriesGateway } from './enquiries.gateway';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [EnquiriesController, AdminEnquiriesController],
  providers: [EnquiriesService, EnquiryStatusService, EnquiriesGateway],
})
export class EnquiriesModule {}
