// Mirrors the API's admin enquiry shape (apps/api/src/modules/enquiries/enquiries.service.ts).
import type { PaginatedResult } from './vehicle';

export type EnquiryStatus = 'open' | 'contacted' | 'negotiating' | 'closed_won' | 'closed_lost';
export type EnquiryChannel = 'chat' | 'call';
export type CallOutcome = 'connected' | 'no_answer' | 'busy' | 'wrong_number' | 'scheduled_callback';

export interface AdminEnquiryVehicle {
  id: string;
  publicId: number | null;
  slug: string;
  title: string;
}

export interface AdminEnquiryPerson {
  id: string;
  name: string | null;
  phone?: string;
  email?: string;
}

export interface AdminCallLog {
  id: string;
  outcome: CallOutcome;
  notes: string | null;
  calledAt: string;
}

export interface AdminEnquiry {
  id: string;
  channel: EnquiryChannel;
  status: EnquiryStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: AdminEnquiryVehicle;
  customer: AdminEnquiryPerson;
  agent: AdminEnquiryPerson | null;
  callLogs: AdminCallLog[];
}

export interface EnquiryMessage {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'agent';
  senderId: string;
  body: string;
  createdAt: string;
}

export type { PaginatedResult };
