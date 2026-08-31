'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Copy, Check, Users } from 'lucide-react';
import { brand } from '@cg/shared-config';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getReferralInfo, ApiError } from '@/lib/api';

export default function ReferPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useCustomerAuth();

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [totalReferred, setTotalReferred] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login?next=/refer');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getReferralInfo(accessToken)
      .then((info) => {
        setReferralCode(info.referralCode);
        setTotalReferred(info.totalReferred);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Referral link load nahi ho paayi.');
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isAuthLoading || !user) return null;

  const referralLink =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${referralCode}`
      : '';

  async function handleCopy(): Promise<void> {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsAppShare(): void {
    const message = `${brand.name} pe achhi gaadiyan milti hain — mera link se check karo: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Invite Friends</h1>
        <p className="mt-1 text-sm text-muted">
          Apna link doston ke saath share karo — jitne zyada log {brand.name} pe aayenge, utni
          achhi gaadiyan aur deals sabke liye banengi.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="skeleton-row">
            <div className="skeleton skeleton-circle h-10 w-10" />
            <div className="flex-1 space-y-2">
              <div className="skeleton skeleton-title w-1/2" />
              <div className="skeleton skeleton-text w-3/4" />
            </div>
          </div>
          <div className="skeleton-row">
            <div className="skeleton skeleton-circle h-10 w-10" />
            <div className="flex-1 space-y-2">
              <div className="skeleton skeleton-title w-1/3" />
              <div className="skeleton skeleton-text w-1/2" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 rounded-2xl bg-background p-5 shadow-card">
            <p className="text-xs font-medium text-muted">Aapka referral link</p>
            <div className="flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5">
              <span className="flex-1 truncate font-mono text-sm text-foreground">
                {referralLink}
              </span>
              <button
                type="button"
                onClick={() => void handleCopy()}
                aria-label="Copy link"
                className="press-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-primary-light hover:text-primary"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="press flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} />
              Share on WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-primary-light/60 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-primary">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">{totalReferred}</p>
              <p className="text-xs text-muted">
                {totalReferred === 1 ? 'dost aapke link se joined' : 'log aapke link se joined'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
