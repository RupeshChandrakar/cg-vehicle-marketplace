export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

/**
 * Provider-agnostic SMS gateway interface (see docs/ARCHITECTURE.md
 * "Authentication") — swapping in a real vendor (Twilio, MSG91, ...) later
 * means adding one class here and rebinding SMS_PROVIDER in SmsModule,
 * nothing else in the app touches this interface's implementation.
 */
export interface SmsProvider {
  sendOtp(phone: string, otp: string): Promise<void>;
}
