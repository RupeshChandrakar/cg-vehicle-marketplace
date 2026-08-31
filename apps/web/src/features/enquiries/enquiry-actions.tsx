'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Phone } from 'lucide-react';
import { createEnquiry, ApiError } from '@/lib/api';

const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

type Channel = 'chat' | 'call';

// Replaces the old disabled Chat/Call placeholders now that Phase 3's
// enquiry pipeline exists. The customer never gets the seller's contact —
// this always creates an Enquiry routed to an assigned agent instead.
export function EnquiryActions({ vehiclePublicId }: { vehiclePublicId: number }) {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [name, setName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callConfirmed, setCallConfirmed] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function handleSubmit(channel: Channel): Promise<void> {
    const nameInvalid = name.trim().length === 0;
    const phoneInvalid = !INDIAN_MOBILE_PATTERN.test(phoneDigits);
    setNameError(nameInvalid ? 'Naam daalein.' : null);
    setPhoneError(phoneInvalid ? 'Valid 10-digit mobile number daalein.' : null);
    if (nameInvalid || phoneInvalid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createEnquiry({
        vehiclePublicId,
        channel,
        customerName: name.trim(),
        customerPhone: `+91${phoneDigits}`,
        message: message.trim() || undefined,
      });

      if (channel === 'chat' && result.accessToken) {
        sessionStorage.setItem(`enquiry:${result.enquiry.id}:accessToken`, result.accessToken);
        router.push(`/enquiry/${result.enquiry.id}`);
        return;
      }

      setCallConfirmed(true);
      setActiveChannel(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kuch gadbad ho gayi. Dobara try karein.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (callConfirmed) {
    return (
      <div className="rounded-2xl bg-primary-light px-4 py-4 text-sm font-medium text-foreground shadow-card">
        Dhanyavaad! Hamara agent aapko jald hi call karega.
      </div>
    );
  }

  if (activeChannel) {
    return (
      <div className="space-y-3 rounded-2xl bg-primary-light p-4 shadow-card">
        <p className="text-sm font-medium text-foreground">
          {activeChannel === 'chat'
            ? 'Chat shuru karne ke liye apni details bharein'
            : 'Call ke liye apni details bharein'}
        </p>
        <div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            placeholder="Aapka Naam"
            className="w-full rounded-lg border border-line bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          {nameError && <p className="mt-1 text-xs text-danger">{nameError}</p>}
        </div>
        <div>
          <div className="flex items-center overflow-hidden rounded-lg border border-line bg-background focus-within:border-primary">
            <span className="px-3 text-sm text-muted">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phoneDigits}
              onChange={(e) => {
                setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10));
                setPhoneError(null);
              }}
              placeholder="98765 43210"
              className="w-full border-l border-line px-3 py-2.5 text-sm text-foreground focus:outline-none"
            />
          </div>
          {phoneError && <p className="mt-1 text-xs text-danger">{phoneError}</p>}
        </div>
        {activeChannel === 'chat' && (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Apna sawaal likhein (optional)"
            className="w-full rounded-lg border border-line bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        )}
        {error && <p className="text-sm text-foreground">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleSubmit(activeChannel)}
            disabled={isSubmitting}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-btn transition active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${
              activeChannel === 'chat' ? 'bg-primary hover:bg-primary-dark' : 'bg-foreground'
            }`}
          >
            {isSubmitting
              ? 'Bhej rahe hain…'
              : activeChannel === 'chat'
                ? 'Chat Shuru Karein'
                : 'Call Request Bhejein'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveChannel(null);
              setNameError(null);
              setPhoneError(null);
            }}
            className="press rounded-lg border border-line px-4 py-2.5 text-sm text-foreground transition hover:bg-primary-light"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setActiveChannel('chat')}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark hover:shadow-btn-hover-primary active:scale-[0.97]"
      >
        <MessageCircle className="h-4 w-4" />
        Chat Now
      </button>
      <button
        type="button"
        onClick={() => setActiveChannel('call')}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-white shadow-btn transition active:scale-[0.97]"
      >
        <Phone className="h-4 w-4" />
        Call Now
      </button>
    </div>
  );
}
