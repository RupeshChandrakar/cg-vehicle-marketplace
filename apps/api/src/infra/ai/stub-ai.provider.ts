import { Injectable } from '@nestjs/common';
import { AiProvider, SuggestReplyInput } from './ai-provider';

/**
 * The default AiProvider until ANTHROPIC_API_KEY is configured (see
 * AiModule) — the AI equivalent of Phase 4's ConsoleSmsProvider: no real
 * model call happens here. It still builds its templated reply from the
 * *real* vehicle facts and the real last customer message (never invents
 * vehicle data), but the output is unmistakably labeled as a stub so it can
 * never be confused with genuine AI output if it somehow reached a real
 * conversation.
 */
@Injectable()
export class StubAiProvider implements AiProvider {
  suggestReply(input: SuggestReplyInput): Promise<string> {
    const lastCustomerMessage = [...input.messages]
      .reverse()
      .find((message) => message.senderType === 'customer');

    const { title, price, kmDriven, fuelType, transmission } = input.vehicle;
    const priceText = `₹${price.toLocaleString('en-IN')}`;
    const kmText = `${kmDriven.toLocaleString('en-IN')} km`;

    const opening = `Namaste! Haan, ${title} abhi available hai — ${priceText}, ${kmText}, ${fuelType}/${transmission}.`;
    const followUp = lastCustomerMessage
      ? ` Aapne poocha tha "${lastCustomerMessage.body}" — isko confirm karke jald hi update denge.`
      : ' Kya aap test drive ya visit schedule karna chahenge?';

    const draft =
      `${opening}${followUp}\n\n` +
      '[Draft by stub AI provider — set ANTHROPIC_API_KEY in apps/api/.env for real suggestions]';

    return Promise.resolve(draft);
  }
}
