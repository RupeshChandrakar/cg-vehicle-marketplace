import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EnquiryStatusService } from './enquiry-status.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { AdminEnquiryQueryDto } from './dto/admin-enquiry-query.dto';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { PaginatedResult } from '../../common/types/paginated-result.type';
import { type AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  CallLog,
  Enquiry,
  EnquiryStatus,
  Message,
  MessageSenderType,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';

const ADMIN_ENQUIRY_INCLUDE = {
  vehicle: { select: { id: true, publicId: true, slug: true, title: true } },
  customer: { select: { id: true, name: true, phone: true } },
  agent: { select: { id: true, name: true, email: true } },
  callLogs: { orderBy: { calledAt: 'desc' } },
} satisfies Prisma.EnquiryInclude;

export type AdminEnquiry = Prisma.EnquiryGetPayload<{
  include: typeof ADMIN_ENQUIRY_INCLUDE;
}>;

export interface PublicEnquiry {
  id: string;
  status: EnquiryStatus;
  channel: Enquiry['channel'];
}

export interface CreateEnquiryResult {
  enquiry: PublicEnquiry;
  conversationId?: string;
  /** Only present for channel: 'chat' — the bearer token the customer's
   *  browser uses to read/send messages and join the chat socket room. */
  accessToken?: string;
}

/** A conversation-scoped token minted for an anonymous (non-authenticated)
 *  customer at enquiry-creation time — narrower than a staff session token:
 *  it only ever proves "I am this customer, on this one conversation." */
interface ConversationTokenPayload {
  type: 'conversation';
  conversationId: string;
  customerId: string;
}

export type Requester =
  | { kind: 'staff'; id: string; role: UserRole }
  | { kind: 'customer'; conversationId: string; customerId: string };

type EnquiryWithConversation = Enquiry & {
  conversation: { id: string } | null;
};

const CONVERSATION_TOKEN_TTL = '24h';
const OPEN_ENQUIRY_STATUSES: EnquiryStatus[] = [
  'open',
  'contacted',
  'negotiating',
];

@Injectable()
export class EnquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly statusService: EnquiryStatusService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateEnquiryDto): Promise<CreateEnquiryResult> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { publicId: dto.vehiclePublicId },
    });
    if (!vehicle || vehicle.status !== 'live') {
      throw new NotFoundException('Vehicle not found');
    }

    const customer = await this.usersService.findOrCreateByPhone(
      dto.customerPhone,
      dto.customerName,
    );
    const agent = await this.pickLeastLoadedAgent();

    const enquiry = await this.prisma.enquiry.create({
      data: {
        vehicleId: vehicle.id,
        customerId: customer.id,
        agentId: agent?.id,
        channel: dto.channel,
        message: dto.message,
      },
    });

    if (dto.channel !== 'chat') {
      return { enquiry: this.toPublicEnquiry(enquiry) };
    }

    const conversation = await this.prisma.conversation.create({
      data: { enquiryId: enquiry.id },
    });
    const accessToken = await this.issueConversationToken(
      conversation.id,
      customer.id,
    );

    return {
      enquiry: this.toPublicEnquiry(enquiry),
      conversationId: conversation.id,
      accessToken,
    };
  }

  /** Assigns the newly-created enquiry to whichever active agent currently
   *  carries the fewest open enquiries — a simple, fair default that needs
   *  no district/territory setup. Returns null if there are no agents yet;
   *  an admin can assign one later via `reassign`. */
  private async pickLeastLoadedAgent(): Promise<{ id: string } | null> {
    const agents = await this.prisma.user.findMany({
      where: { role: UserRole.agent },
      select: { id: true },
    });
    if (agents.length === 0) return null;

    const loads = await this.prisma.enquiry.groupBy({
      by: ['agentId'],
      where: {
        agentId: { in: agents.map((a) => a.id) },
        status: { in: OPEN_ENQUIRY_STATUSES },
      },
      _count: { _all: true },
    });
    const loadByAgent = new Map(
      loads.map((row) => [row.agentId, row._count._all]),
    );

    return agents.reduce((leastLoaded, candidate) =>
      (loadByAgent.get(candidate.id) ?? 0) <
      (loadByAgent.get(leastLoaded.id) ?? 0)
        ? candidate
        : leastLoaded,
    );
  }

  private issueConversationToken(
    conversationId: string,
    customerId: string,
  ): Promise<string> {
    const payload: ConversationTokenPayload = {
      type: 'conversation',
      conversationId,
      customerId,
    };
    return this.jwtService.signAsync(payload, {
      expiresIn: CONVERSATION_TOKEN_TTL,
    });
  }

  /** Verifies a bearer token as either a staff access token or a customer
   *  conversation token — the two enquiry/message endpoints accept either,
   *  so this can't be a single passport strategy (see JwtStrategy, which
   *  only ever accepts `type: 'access'`). */
  async resolveRequesterFromToken(token: string): Promise<Requester> {
    let payload: JwtPayload | ConversationTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<
        JwtPayload | ConversationTokenPayload
      >(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type === 'access') {
      return { kind: 'staff', id: payload.sub, role: payload.role };
    }
    if (payload.type === 'conversation') {
      return {
        kind: 'customer',
        conversationId: payload.conversationId,
        customerId: payload.customerId,
      };
    }
    throw new UnauthorizedException('Invalid token');
  }

  async loadEnquiryWithConversation(
    enquiryId: string,
  ): Promise<EnquiryWithConversation> {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: { conversation: { select: { id: true } } },
    });
    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }
    return enquiry;
  }

  /** Staff (the assigned agent, or any admin) can always read/send; a
   *  customer only if both their own id and their token's conversation
   *  match this exact enquiry — a token minted for one conversation can't
   *  be replayed against another enquiry of the same customer's. */
  assertCanAccessConversation(
    enquiry: EnquiryWithConversation,
    requester: Requester,
  ): void {
    if (requester.kind === 'staff') {
      if (requester.role === UserRole.admin) return;
      if (requester.role === UserRole.agent && enquiry.agentId === requester.id)
        return;
      throw new ForbiddenException('You are not assigned to this enquiry');
    }

    if (
      requester.customerId !== enquiry.customerId ||
      !enquiry.conversation ||
      requester.conversationId !== enquiry.conversation.id
    ) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }
  }

  async getMessages(
    enquiryId: string,
    requester: Requester,
  ): Promise<Message[]> {
    const enquiry = await this.loadEnquiryWithConversation(enquiryId);
    this.assertCanAccessConversation(enquiry, requester);
    if (!enquiry.conversation) return [];

    return this.prisma.message.findMany({
      where: { conversationId: enquiry.conversation.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    enquiryId: string,
    body: string,
    requester: Requester,
  ): Promise<Message> {
    const enquiry = await this.loadEnquiryWithConversation(enquiryId);
    this.assertCanAccessConversation(enquiry, requester);
    if (!enquiry.conversation) {
      throw new BadRequestException('This enquiry has no chat conversation');
    }

    const senderType =
      requester.kind === 'customer'
        ? MessageSenderType.customer
        : MessageSenderType.agent;
    const senderId =
      requester.kind === 'customer' ? requester.customerId : requester.id;

    return this.prisma.message.create({
      data: {
        conversationId: enquiry.conversation.id,
        senderType,
        senderId,
        body,
      },
    });
  }

  async findForStaff(
    query: AdminEnquiryQueryDto,
    staff: AuthenticatedUser,
  ): Promise<PaginatedResult<AdminEnquiry>> {
    const where: Prisma.EnquiryWhereInput = {};
    if (query.status) where.status = query.status;
    // Agents only ever see their own assigned enquiries; admins see all —
    // mirrors the role matrix in docs/ARCHITECTURE.md exactly.
    if (staff.role === UserRole.agent) where.agentId = staff.id;

    const skip = (query.page - 1) * query.pageSize;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.enquiry.findMany({
        where,
        include: ADMIN_ENQUIRY_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.enquiry.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  async findByIdForStaff(
    id: string,
    staff: AuthenticatedUser,
  ): Promise<AdminEnquiry> {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: ADMIN_ENQUIRY_INCLUDE,
    });
    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }
    this.assertStaffCanManage(enquiry, staff);
    return enquiry;
  }

  async updateStatus(
    id: string,
    newStatus: EnquiryStatus,
    staff: AuthenticatedUser,
  ): Promise<Enquiry> {
    const enquiry = await this.requireEnquiry(id);
    this.assertStaffCanManage(enquiry, staff);
    this.statusService.assertTransition(enquiry.status, newStatus);
    return this.prisma.enquiry.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async reassign(
    id: string,
    newAgentId: string,
    staff: AuthenticatedUser,
  ): Promise<Enquiry> {
    if (staff.role !== UserRole.admin) {
      throw new ForbiddenException('Only admins can reassign enquiries');
    }
    await this.requireEnquiry(id);

    const agent = await this.prisma.user.findUnique({
      where: { id: newAgentId },
    });
    if (!agent || agent.role !== UserRole.agent) {
      throw new BadRequestException('agentId must belong to an existing agent');
    }

    return this.prisma.enquiry.update({
      where: { id },
      data: { agentId: newAgentId },
    });
  }

  async logCall(
    id: string,
    dto: CreateCallLogDto,
    staff: AuthenticatedUser,
  ): Promise<CallLog> {
    const enquiry = await this.requireEnquiry(id);
    this.assertStaffCanManage(enquiry, staff);

    return this.prisma.callLog.create({
      data: {
        enquiryId: id,
        loggedById: staff.id,
        outcome: dto.outcome,
        notes: dto.notes,
      },
    });
  }

  private async requireEnquiry(id: string): Promise<Enquiry> {
    const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }
    return enquiry;
  }

  private assertStaffCanManage(
    enquiry: Enquiry,
    staff: AuthenticatedUser,
  ): void {
    if (staff.role === UserRole.admin) return;
    if (staff.role === UserRole.agent && enquiry.agentId === staff.id) return;
    throw new ForbiddenException('You are not assigned to this enquiry');
  }

  private toPublicEnquiry(enquiry: Enquiry): PublicEnquiry {
    return { id: enquiry.id, status: enquiry.status, channel: enquiry.channel };
  }
}
