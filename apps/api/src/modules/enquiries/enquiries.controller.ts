import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { EnquiriesService, CreateEnquiryResult } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Message } from '../../generated/prisma/client';

/** Public — no staff auth. Anonymous customers reach this with either
 *  nothing (creating an enquiry) or their conversation-access token
 *  (reading/sending messages); see EnquiriesService.resolveRequesterFromToken. */
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  create(@Body() dto: CreateEnquiryDto): Promise<CreateEnquiryResult> {
    return this.enquiriesService.create(dto);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<Message[]> {
    const requester = await this.enquiriesService.resolveRequesterFromToken(
      extractBearerToken(authHeader),
    );
    return this.enquiriesService.getMessages(id, requester);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Headers('authorization') authHeader?: string,
  ): Promise<Message> {
    const requester = await this.enquiriesService.resolveRequesterFromToken(
      extractBearerToken(authHeader),
    );
    return this.enquiriesService.sendMessage(id, dto.body, requester);
  }
}

function extractBearerToken(authHeader?: string): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing bearer token');
  }
  return authHeader.slice('Bearer '.length);
}
