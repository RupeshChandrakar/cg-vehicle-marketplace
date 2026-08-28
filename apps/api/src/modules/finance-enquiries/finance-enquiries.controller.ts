import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { FinanceEnquiriesService } from './finance-enquiries.service';
import { CreateFinanceEnquiryDto } from './dto/create-finance-enquiry.dto';

/** Public — the "Financing Available" banner on the vehicle detail page
 *  submits here, no authentication required. See FinanceEnquiriesService. */
@Controller('finance-enquiries')
export class FinanceEnquiriesController {
  constructor(
    private readonly financeEnquiriesService: FinanceEnquiriesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(@Body() dto: CreateFinanceEnquiryDto): Promise<void> {
    await this.financeEnquiriesService.create(dto);
  }
}
