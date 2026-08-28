import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { EnquiriesService, AdminEnquiry } from './enquiries.service';
import { AdminEnquiryQueryDto } from './dto/admin-enquiry-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { AssignEnquiryDto } from './dto/assign-enquiry.dto';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { CallLog, Enquiry, Message } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.agent)
@Controller('admin/enquiries')
export class AdminEnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Get()
  findAll(
    @Query() query: AdminEnquiryQueryDto,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<PaginatedResult<AdminEnquiry>> {
    return this.enquiriesService.findForStaff(query, staff);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<AdminEnquiry> {
    return this.enquiriesService.findByIdForStaff(id, staff);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<Message[]> {
    return this.enquiriesService.getMessages(id, {
      kind: 'staff',
      id: staff.id,
      role: staff.role,
    });
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<Message> {
    return this.enquiriesService.sendMessage(id, dto.body, {
      kind: 'staff',
      id: staff.id,
      role: staff.role,
    });
  }

  @Post(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEnquiryStatusDto,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<Enquiry> {
    return this.enquiriesService.updateStatus(id, dto.status, staff);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignEnquiryDto,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<Enquiry> {
    return this.enquiriesService.reassign(id, dto.agentId, staff);
  }

  @Post(':id/call-logs')
  logCall(
    @Param('id') id: string,
    @Body() dto: CreateCallLogDto,
    @CurrentUser() staff: AuthenticatedUser,
  ): Promise<CallLog> {
    return this.enquiriesService.logCall(id, dto, staff);
  }
}
