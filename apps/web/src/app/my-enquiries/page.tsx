'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, MessageCircle } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getMyEnquiries, createReview, ApiError, type MyEnquiry } from '@/lib/api';

const STATUS_LABELS: Record<MyEnquiry['status'], string> = {
  open: 'Open',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  closed_won: 'Deal Done',
  closed_lost: 'Closed',
};

export default function MyEnquiriesPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useCustomerAuth();
  const [enquiries, setEnquiries] = useState<MyEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login?next=/my-enquiries');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getMyEnquiries(accessToken)
      .then(setEnquiries)
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isAuthLoading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <h1 className="text-lg font-bold tracking-tight text-foreground">My Enquiries</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton skeleton-circle h-10 w-10" />
              <div className="flex-1 space-y-2">
                <div className="skeleton skeleton-title w-2/3" />
                <div className="skeleton skeleton-text w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">Aapne abhi tak koi enquiry nahi ki hai.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enquiry) => (
            <EnquiryCard key={enquiry.id} enquiry={enquiry} accessToken={accessToken as string} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnquiryCard({ enquiry, accessToken }: { enquiry: MyEnquiry; accessToken: string }) {
  const isClosed = enquiry.status === 'closed_won' || enquiry.status === 'closed_lost';

  return (
    <div className="space-y-3 rounded-2xl bg-background p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-foreground">{enquiry.vehicle.title}</h3>
          <p className="text-sm text-muted">
            {enquiry.channel === 'chat' ? 'Chat' : 'Call'} &middot; Agent:{' '}
            {enquiry.agent?.name ?? 'Unassigned'}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
          {STATUS_LABELS[enquiry.status]}
        </span>
      </div>

      {enquiry.channel === 'chat' && (
        <Link href={`/enquiry/${enquiry.id}`} className="press-text text-sm font-medium text-primary">
          Chat dekhein →
        </Link>
      )}

      {isClosed && <ReviewForm enquiry={enquiry} accessToken={accessToken} />}
    </div>
  );
}

function ReviewForm({ enquiry, accessToken }: { enquiry: MyEnquiry; accessToken: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    setIsSubmitting(true);
    setError(null);
    try {
      await createReview(accessToken, {
        vehiclePublicId: enquiry.vehicle.publicId ?? undefined,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kuch gadbad ho gayi. Dobara try karein.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="border-t border-line pt-3 text-sm font-medium text-primary">
        Dhanyavaad — aapka review submit ho gaya!
      </p>
    );
  }

  return (
    <div className="space-y-2 border-t border-line pt-3">
      <p className="text-sm font-medium text-foreground">Is vehicle ko rate karein</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} stars`}
            className="p-0.5"
          >
            <Star
              className={value <= rating ? 'h-5 w-5 fill-gold text-gold' : 'h-5 w-5 text-line'}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Apna experience share karein (optional)"
        className="w-full rounded-lg border border-line px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      />
      {error && <p className="text-sm text-foreground">{error}</p>}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={isSubmitting}
        className="press rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
}
