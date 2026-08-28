'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { requestOtp, verifyOtp, ApiError } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getStoredReferralCode } from '@/lib/referral';

type Step = 'phone' | 'otp';
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useCustomerAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = `+91${phoneDigits}`;

  async function handleRequestOtp(event: FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await requestOtp(phone, getStoredReferralCode());
      setStep('otp');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kuch gadbad ho gayi. Dobara try karein.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await verifyOtp(phone, otp, name.trim() || undefined);
      login(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      router.push(searchParams.get('next') ?? '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kuch gadbad ho gayi. Dobara try karein.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-2xl bg-background p-6 shadow-card">
        <h1 className="text-xl font-bold text-foreground">Login / Sign Up</h1>
        <p className="mt-1 text-sm text-muted">
          {step === 'phone'
            ? 'Apna mobile number darj karein'
            : `OTP bheja gaya hai +91 ${phoneDigits} par`}
        </p>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
            <div className="flex items-center overflow-hidden rounded-lg border border-line focus-within:border-primary">
              <span className="px-3 text-sm text-muted">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="w-full border-l border-line px-3 py-2.5 text-sm text-foreground focus:outline-none"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-foreground">{error}</p>}
            <button
              type="submit"
              disabled={!INDIAN_MOBILE_PATTERN.test(phoneDigits) || isSubmitting}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] disabled:opacity-50"
            >
              {isSubmitting ? 'Bhej rahe hain…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-center text-lg tracking-[0.3em] text-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aapka Naam (optional)"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            {error && <p className="text-sm text-foreground">{error}</p>}
            <button
              type="submit"
              disabled={otp.length !== 6 || isSubmitting}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] disabled:opacity-50"
            >
              {isSubmitting ? 'Verify ho raha hai…' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-center text-sm text-muted"
            >
              Number badlein
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
