import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import {
  EnquiriesService,
  CreateEnquiryResult,
  CustomerEnquiry,
} from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Message, UserRole } from '../../generated/prisma/client';

/** Public — no staff auth. Anonymous customers reach this with either
 *  nothing (creating an enquiry) or their conversation-access token
 *  (reading/sending messages); see EnquiriesService.resolveRequesterFromToken.
 *  The one exception is GET /me, which needs a real OTP-authenticated
 *  customer session (Phase 4). */
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  create(@Body() dto: CreateEnquiryDto): Promise<CreateEnquiryResult> {
    return this.enquiriesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<CustomerEnquiry[]> {
    return this.enquiriesService.findForCustomer(user.id);
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
