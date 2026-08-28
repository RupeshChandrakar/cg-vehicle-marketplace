import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EnquiriesService, Requester } from './enquiries.service';
import { Message } from '../../generated/prisma/client';

interface JoinPayload {
  enquiryId: string;
  token: string;
}

interface MessagePayload {
  body: string;
}

interface SocketData {
  enquiryId?: string;
  requester?: Requester;
}

interface ListenEvents {
  join: (data: JoinPayload) => void;
  message: (data: MessagePayload) => void;
}

interface EmitEvents {
  joined: (data: { enquiryId: string }) => void;
  message: (data: Message) => void;
  error: (data: { message: string }) => void;
}

type EnquirySocket = Socket<ListenEvents, EmitEvents, EmitEvents, SocketData>;

function roomFor(enquiryId: string): string {
  return `enquiry:${enquiryId}`;
}

/** One room per enquiry (`enquiry:{id}`); a customer joins with their
 *  conversation-access token, staff with their normal session token — both
 *  kinds are resolved the same way REST does it, via
 *  EnquiriesService.resolveRequesterFromToken. Kept intentionally minimal
 *  (send/receive text only) — "basic chat" per the Phase 3 scope. */
@WebSocketGateway({ namespace: '/enquiries', cors: { origin: '*' } })
export class EnquiriesGateway {
  @WebSocketServer()
  server!: Server<ListenEvents, EmitEvents>;

  constructor(private readonly enquiriesService: EnquiriesService) {}

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: EnquirySocket,
    @MessageBody() data: JoinPayload,
  ): Promise<void> {
    try {
      const requester = await this.enquiriesService.resolveRequesterFromToken(
        data.token,
      );
      const enquiry = await this.enquiriesService.loadEnquiryWithConversation(
        data.enquiryId,
      );
      this.enquiriesService.assertCanAccessConversation(enquiry, requester);

      client.data.enquiryId = data.enquiryId;
      client.data.requester = requester;
      await client.join(roomFor(data.enquiryId));
      client.emit('joined', { enquiryId: data.enquiryId });
    } catch (error) {
      client.emit('error', {
        message: messageOf(error, 'Unable to join this conversation'),
      });
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: EnquirySocket,
    @MessageBody() data: MessagePayload,
  ): Promise<void> {
    const enquiryId = client.data.enquiryId;
    const requester = client.data.requester;
    if (!enquiryId || !requester) {
      client.emit('error', {
        message: 'Join a conversation before sending messages',
      });
      return;
    }

    try {
      const message = await this.enquiriesService.sendMessage(
        enquiryId,
        data.body,
        requester,
      );
      this.server.to(roomFor(enquiryId)).emit('message', message);
    } catch (error) {
      client.emit('error', {
        message: messageOf(error, 'Unable to send message'),
      });
    }
  }
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
