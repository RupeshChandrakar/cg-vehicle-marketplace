import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FinanceEnquiriesService } from './finance-enquiries.service';
import { CreateFinanceEnquiryDto } from './dto/create-finance-enquiry.dto';

/** Public finance lead-capture endpoint, no authentication required.
 *  See FinanceEnquiriesService. */
@Controller('finance-enquiries')
export class FinanceEnquiriesController {
  constructor(
    private readonly financeEnquiriesService: FinanceEnquiriesService,
  ) {}

  // 5 / 10 min per IP -- unauthenticated public form with no CAPTCHA, so
  // this is the only thing standing between it and a spam bot.
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(@Body() dto: CreateFinanceEnquiryDto): Promise<void> {
    await this.financeEnquiriesService.create(dto);
  }
}
