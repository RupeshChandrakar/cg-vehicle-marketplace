'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { submitFinanceEnquiry, ApiError } from '@/lib/api';

const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Deliberately generic — "financing available, enquire karo," never a
 * specific rate/down-payment claim. There is no bank/NBFC partner
 * integrated behind this yet; a real financing product with real terms
 * would need an actual lender relationship first. This is pure lead
 * capture: staff follows up manually with whatever partner is lined up
 * at the time. See FinanceEnquiriesService on the API.
 */
export function FinanceBanner({ vehiclePublicId }: { vehiclePublicId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function canSubmit(): boolean {
    return name.trim().length > 0 && INDIAN_MOBILE_PATTERN.test(phoneDigits);
  }

  async function handleSubmit(): Promise<void> {
    if (!canSubmit()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitFinanceEnquiry({
        name: name.trim(),
        phone: `+91${phoneDigits}`,
        vehiclePublicId,
      });
      setSubmitted(true);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kuch gadbad ho gayi. Dobara try karein.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-primary-light px-4 py-4 text-sm font-medium text-foreground shadow-card">
        Dhanyavaad! Financing ke baare me hamari team jald aapse sampark karegi.
      </div>
    );
  }

  if (isOpen) {
    return (
      <div className="space-y-3 rounded-2xl bg-primary-light p-4 shadow-card">
        <p className="text-sm font-medium text-foreground">
          Financing me interested hain? Apni details bharein
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aapka Naam"
          className="w-full rounded-lg border border-line bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <div className="flex items-center overflow-hidden rounded-lg border border-line bg-background focus-within:border-primary">
          <span className="px-3 text-sm text-muted">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phoneDigits}
            onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            className="w-full border-l border-line px-3 py-2.5 text-sm text-foreground focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-foreground">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit() || isSubmitting}
            className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? 'Bhej rahe hain…' : 'Enquiry Bhejein'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="press rounded-lg border border-line px-4 py-2.5 text-sm text-foreground transition hover:bg-background"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="press-card flex w-full items-center gap-3 rounded-2xl bg-primary-light px-4 py-3.5 text-left shadow-card transition hover:shadow-card-hover"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-primary">
        <Wallet className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-foreground">Financing Available</span>
        <span className="block text-xs text-muted">
          Is vehicle ke liye finance options ke baare me jaanein — enquire karein
        </span>
      </span>
    </button>
  );
}
