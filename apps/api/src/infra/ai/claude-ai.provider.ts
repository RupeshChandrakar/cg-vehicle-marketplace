import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AiProvider, SuggestReplyInput } from './ai-provider';

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 300;

const SYSTEM_PROMPT = `You are drafting a reply for a used-vehicle marketplace agent in Chhattisgarh, India, to send to a customer in an in-app chat.

Rules:
- Use ONLY the vehicle facts given below. Never invent a price, condition, feature, or fact not provided.
- Never share the seller's personal contact details — the platform routes all contact through the agent.
- Match the conversation's language mix (Hinglish — English structural words, Hindi conversational tone — is common and expected).
- Keep the reply concise, warm, and helpful — a few sentences, not an essay.
- Output ONLY the message text itself, with no preamble, labels, or quotation marks.`;

/**
 * The real AiProvider, used once ANTHROPIC_API_KEY is set (see AiModule) —
 * until then, StubAiProvider is used instead. This is real, working
 * integration code; it just has no live traffic in this environment yet.
 */
@Injectable()
export class ClaudeAiProvider implements AiProvider {
  private readonly logger = new Logger(ClaudeAiProvider.name);
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async suggestReply(input: SuggestReplyInput): Promise<string> {
    const vehicleFacts = describeVehicle(input.vehicle);
    const conversation =
      input.messages.length > 0
        ? input.messages.map((m) => `${m.senderType}: ${m.body}`).join('\n')
        : '(no messages yet)';

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Vehicle facts:\n${vehicleFacts}\n\nConversation so far:\n${conversation}\n\nDraft the agent's next reply.`,
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock?.type === 'text' ? textBlock.text.trim() : '';
    } catch (error) {
      this.logger.error(
        `Claude suggestReply call failed: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}

function describeVehicle(vehicle: SuggestReplyInput['vehicle']): string {
  const specsText = Object.entries(vehicle.specs)
    .filter(([key]) => key !== 'registrationNumber') // never surface this to an LLM prompt
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');

  return [
    `${vehicle.title} (${vehicle.brand} ${vehicle.model}, ${vehicle.year})`,
    `Price: ₹${vehicle.price.toLocaleString('en-IN')}`,
    `KM Driven: ${vehicle.kmDriven.toLocaleString('en-IN')}`,
    `Fuel: ${vehicle.fuelType}, Transmission: ${vehicle.transmission}`,
    specsText ? `Other details: ${specsText}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}
