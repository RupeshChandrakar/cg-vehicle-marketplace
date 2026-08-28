import { Module } from '@nestjs/common';
import { FinanceEnquiriesController } from './finance-enquiries.controller';
import { AdminFinanceEnquiriesController } from './admin-finance-enquiries.controller';
import { FinanceEnquiriesService } from './finance-enquiries.service';

@Module({
  controllers: [FinanceEnquiriesController, AdminFinanceEnquiriesController],
  providers: [FinanceEnquiriesService],
})
export class FinanceEnquiriesModule {}
