import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms.provider';

/**
 * The only SmsProvider implementation until a real gateway is integrated —
 * "sends" an OTP by printing it, the standard no-op transport for local
 * development (there's no real phone to deliver to). This is deliberately
 * not the same thing as logging a real OTP in a production system: once a
 * real provider (Twilio/MSG91/...) is wired in, the OTP goes straight to
 * that gateway's API call and this class is never used.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('DEV-SMS');

  sendOtp(phone: string, otp: string): Promise<void> {
    this.logger.warn(
      `[DEV ONLY — no real SMS gateway configured] OTP for ${phone}: ${otp}`,
    );
    return Promise.resolve();
  }
}
