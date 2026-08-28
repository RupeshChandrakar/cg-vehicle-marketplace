export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface SuggestReplyVehicleContext {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kmDriven: number;
  fuelType: string;
  transmission: string;
  specs: Record<string, unknown>;
}

export interface SuggestReplyMessage {
  senderType: 'customer' | 'agent';
  body: string;
}

export interface SuggestReplyInput {
  vehicle: SuggestReplyVehicleContext;
  messages: SuggestReplyMessage[];
}

/**
 * Provider-agnostic AI orchestration interface (see docs/ARCHITECTURE.md
 * "Phase 5 notes") — mirrors the SmsProvider pattern from Phase 4. This is
 * assistive only: a suggestion is never persisted as a Message and never
 * sent on its own — the agent always reviews/edits/sends it themselves via
 * the existing EnquiriesService.sendMessage path. AI is never a source of
 * truth for vehicle facts or conversation history, only a consumer of them.
 */
export interface AiProvider {
  suggestReply(input: SuggestReplyInput): Promise<string>;
}
