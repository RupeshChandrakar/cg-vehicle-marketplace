'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithPhone, ApiError } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';

const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useCustomerAuth();

  const [phoneDigits, setPhoneDigits] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = `+91${phoneDigits}`;

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await loginWithPhone(phone, name.trim() || undefined);
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
        <h1 className="text-lg font-bold tracking-tight text-foreground">Login / Sign Up</h1>
        <p className="mt-1 text-sm text-muted">Apna mobile number darj karein. OTP abhi skip hai.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
            disabled={!INDIAN_MOBILE_PATTERN.test(phoneDigits) || isSubmitting}
            className="press w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? 'Login ho raha hai…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
