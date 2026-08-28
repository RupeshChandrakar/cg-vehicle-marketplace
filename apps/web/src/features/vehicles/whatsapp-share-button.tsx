'use client';

import { Share2 } from 'lucide-react';
import { brand } from '@cg/shared-config';

/**
 * Builds the WhatsApp share link on click, reading window.location.href —
 * this is always the exact, correct absolute URL the visitor is on right
 * now, so there's no need for a metadataBase/site-URL env var to get this
 * right in both dev and prod.
 */
export function WhatsAppShareButton({ title, price }: { title: string; price: string }) {
  function handleShare(): void {
    const message = `${title} — ${price} mein, ${brand.name} pe dekho: ${window.location.href}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share on WhatsApp"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary transition hover:bg-primary hover:text-white"
    >
      <Share2 className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
